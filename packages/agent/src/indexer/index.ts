import { ethers } from 'ethers'
import { AgentEntry, AgentCategory, ReputationData } from '@agentboard/shared'
import { config } from '../config'
import { store } from './store'
import { calculateTrustScore, getComponentArray } from './trust'
import { fetchAgentSkill, hashSkillContent } from '../skill/fetcher'

const ERC8004_ABI = [
  'event AgentRegistered(address indexed agent, string name, string endpoint)',
  'function isRegistered(address agent) view returns (bool)',
  'function getAgent(address agent) view returns (string name, string endpoint, bytes publicKey, uint256 registeredAt)',
  'function getAgentCount() view returns (uint256)',
  'function getAgentByIndex(uint256 index) view returns (address)',
]

const AGENTBOARD_ABI = [
  'function isPremium(address) view returns (bool active, uint256 expiresAt)',
  'function recordTrustSnapshot(address agent, uint256 score, uint256[5] calldata components) external',
  'function recordSkillVerification(address agent, bytes32 skillFileHash, uint256 endpointCount) external',
]

const CATEGORIES: AgentCategory[] = ['trading', 'payment', 'social', 'oracle', 'escrow', 'analytics']

function inferCategory(name: string): AgentCategory {
  const n = name.toLowerCase()
  if (/trade|swap|dex|trader/.test(n)) return 'trading'
  if (/pay|transfer|send|usdc/.test(n)) return 'payment'
  if (/social|cast|post|follow/.test(n)) return 'social'
  if (/oracle|price|feed|data/.test(n)) return 'oracle'
  if (/escrow|lock|hold/.test(n)) return 'escrow'
  if (/analytics|stats|track|monitor/.test(n)) return 'analytics'
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
}

function defaultReputation(): ReputationData {
  return {
    trustScore: 0,
    weeklyHistory: [0, 0, 0, 0, 0, 0, 0],
    uptimeLast7d: 0,
    x402VolumeUsdc: 0,
    erc8128VerificationRate: 0,
    totalInteractions: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    lastUpdated: Date.now(),
  }
}

export class Indexer {
  private provider: ethers.WebSocketProvider | ethers.JsonRpcProvider
  private registry: ethers.Contract
  private agentboard: ethers.Contract | null = null
  private operatorWallet: ethers.Wallet | null = null
  private knownAgents = new Set<string>()
  private running = false

  constructor() {
    // Use WebSocket for Flashblocks if URL supports it
    const rpcUrl = config.rpc.url
    if (rpcUrl.startsWith('wss://') || rpcUrl.startsWith('ws://')) {
      this.provider = new ethers.WebSocketProvider(rpcUrl)
    } else {
      this.provider = new ethers.JsonRpcProvider(rpcUrl)
    }

    this.registry = new ethers.Contract(
      config.contracts.erc8004Registry || ethers.ZeroAddress,
      ERC8004_ABI,
      this.provider
    )

    if (config.contracts.agentboard && config.operator.privateKey) {
      this.operatorWallet = new ethers.Wallet(config.operator.privateKey, this.provider)
      this.agentboard = new ethers.Contract(
        config.contracts.agentboard,
        AGENTBOARD_ABI,
        this.operatorWallet
      )
    }
  }

  async start() {
    this.running = true
    console.log('[Indexer] Starting...')

    // Initial sync
    await this.syncAgents()

    // Watch for new agent registrations
    this.registry.on('AgentRegistered', async (address: string, name: string, endpoint: string) => {
      console.log(`[Indexer] New agent registered: ${name} (${address})`)
      await this.indexAgent(address, name, endpoint)
    })

    // Periodic loops
    this.startPeriodicRefresh()
    this.watchFlashblocks()
  }

  private async syncAgents() {
    try {
      const count = await this.registry.getAgentCount().catch(() => 0n)
      console.log(`[Indexer] Found ${count} agents in ERC-8004 registry`)

      for (let i = 0; i < Number(count); i++) {
        const addr = await this.registry.getAgentByIndex(i).catch(() => null)
        if (!addr) continue
        const [name, endpoint, , registeredAt] = await this.registry.getAgent(addr).catch(() => ['', '', '', 0n])
        if (name) await this.indexAgent(addr, name, endpoint, Number(registeredAt))
      }
    } catch (e) {
      console.error('[Indexer] Error syncing agents:', e)
    }
  }

  private async indexAgent(address: string, name: string, endpoint: string, registeredAt?: number) {
    if (this.knownAgents.has(address.toLowerCase())) return
    this.knownAgents.add(address.toLowerCase())

    const isPremium = await this.checkPremium(address)

    const rep = defaultReputation()
    const ageDays = registeredAt
      ? (Date.now() / 1000 - registeredAt) / 86400
      : 0

    const breakdown = calculateTrustScore(rep, ageDays)
    rep.trustScore = breakdown.total

    // Synthesize a basename from name (lowercase, no spaces)
    const basename = name.toLowerCase().replace(/\s+/g, '') + '.base.eth'

    const entry: AgentEntry = {
      address,
      name,
      basename,
      endpoint,
      publicKey: '',
      registeredAt: registeredAt || Math.floor(Date.now() / 1000),
      erc8004Verified: true,
      erc8128Active: false,
      siwaEnabled: false,
      x402Active: false,
      category: inferCategory(name),
      description: `${name} — an autonomous agent on Base`,
      skill: null,
      reputation: rep,
      tier: isPremium ? 'premium' : 'basic',
    }

    store.upsertAgent(entry)

    // Fetch skill file in background
    this.refreshSkill(entry).catch(console.error)
  }

  private async refreshSkill(agent: AgentEntry) {
    if (!agent.endpoint) return
    try {
      const skill = await fetchAgentSkill(agent.address, agent.endpoint, agent.tier === 'premium')
      agent.skill = skill
      store.upsertAgent(agent)

      // Record verification onchain if skill found
      if (skill.fetchStatus === 'ok' && this.agentboard && this.operatorWallet) {
        const hash = hashSkillContent(skill.raw)
        await this.agentboard.recordSkillVerification(
          agent.address,
          hash,
          skill.endpoints.length
        ).catch((e: any) => console.warn('[Indexer] Skill verification tx failed:', e.message))
      }
    } catch (e) {
      console.warn(`[Indexer] Skill fetch failed for ${agent.name}:`, e)
    }
  }

  private async refreshTrustScore(agent: AgentEntry) {
    const ageDays = (Date.now() / 1000 - agent.registeredAt) / 86400
    const breakdown = calculateTrustScore(agent.reputation, ageDays)
    const prev = agent.reputation.trustScore

    agent.reputation.trustScore = breakdown.total
    agent.reputation.lastUpdated = Date.now()
    agent.reputation.weeklyHistory = [
      ...agent.reputation.weeklyHistory.slice(1),
      breakdown.total,
    ]

    store.upsertAgent(agent)

    // Record snapshot onchain for top agents hourly
    if (this.agentboard && Math.abs(breakdown.total - prev) > 2) {
      const components = getComponentArray(breakdown).map(BigInt) as [bigint, bigint, bigint, bigint, bigint]
      await this.agentboard.recordTrustSnapshot(
        agent.address,
        breakdown.total,
        components
      ).catch((e: any) => console.warn('[Indexer] Snapshot tx failed:', e.message))
    }
  }

  private async checkPremium(address: string): Promise<boolean> {
    if (!this.agentboard) return false
    try {
      const [active] = await this.agentboard.isPremium(address)
      return active
    } catch {
      return false
    }
  }

  private startPeriodicRefresh() {
    // Refresh trust scores every 10 minutes
    setInterval(async () => {
      const agents = store.getAllAgents()
      for (const agent of agents) {
        await this.refreshTrustScore(agent)
      }

      // Update block
      const block = await this.provider.getBlockNumber().catch(() => 0)
      store.setLastBlock(block)
    }, 10 * 60 * 1000)

    // Refresh skills: premium every 30min, basic every 6h
    setInterval(async () => {
      const agents = store.getAllAgents()
      const now = Date.now()
      for (const agent of agents) {
        const isPremium = agent.tier === 'premium'
        const lastFetched = agent.skill?.lastFetched || 0
        const ttl = isPremium
          ? 30 * 60 * 1000
          : 6 * 60 * 60 * 1000
        if (now - lastFetched > ttl) {
          await this.refreshSkill(agent)
        }
      }
    }, 5 * 60 * 1000) // check every 5 minutes

    // Hourly trust snapshots for top 20
    setInterval(async () => {
      const top20 = store.getLeaderboard(20)
      for (const agent of top20) {
        await this.refreshTrustScore(agent)
      }
    }, 60 * 60 * 1000)

    // Update block every minute
    setInterval(async () => {
      const block = await this.provider.getBlockNumber().catch(() => 0)
      store.setLastBlock(block)
    }, 60 * 1000)
  }

  private watchFlashblocks() {
    // Watch for x402 and ERC-8128 activity via newFlashblockTransactions
    if (this.provider instanceof ethers.WebSocketProvider) {
      this.provider.on('block', async (blockNumber: number) => {
        store.setLastBlock(blockNumber)
        const block = await this.provider.getBlock(blockNumber, true).catch(() => null)
        if (!block || !block.transactions) return

        for (const tx of block.transactions as any[]) {
          const agentAddr = tx.to?.toLowerCase()
          if (!agentAddr) continue
          const agent = store.getAgent(agentAddr)
          if (!agent) continue

          // Detect x402 pattern (USDC transfer to agent)
          if (tx.data?.startsWith('0xa9059cbb')) {
            agent.x402Active = true
            agent.reputation.x402VolumeUsdc += 0.01 // approximate
            store.addX402Volume(0.01)
            store.upsertAgent(agent)
          }
        }
      })
    }
  }

  stop() {
    this.running = false
    this.registry.removeAllListeners()
    if (this.provider instanceof ethers.WebSocketProvider) {
      this.provider.destroy()
    }
  }
}
