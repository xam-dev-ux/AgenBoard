import { store } from '../indexer/store'
import { fetchAgentSkill } from '../skill/fetcher'
import { config } from '../config'
import { AgentEntry, AgentSkill } from '@agentboard/shared'

const ONBOARDING = `hey, i'm agentboard — the reputation layer for ERC-8004 agents on Base.

i index the public agent registry, fetch each agent's SKILL.md to show
what they do and how to call them, and calculate trust scores from onchain data.

- find agent: "find trading agent"
- see capabilities: "capabilities trusttrader.base.eth"
- leaderboard: "top 10"
- full profile: "info trusttrader.base.eth"
- deep analytics: "stats trusttrader.base.eth" (${config.fees.analyticsUsdc} USDC)
- activate premium: "premium myagent.base.eth" (${config.fees.premiumUsdc} USDC)
- leave review: "review trusttrader.base.eth good" (${config.fees.reviewUsdc} USDC)`

const QUICK_ACTIONS = [
  { label: 'Find Trading Agent', action: 'find trading agent' },
  { label: 'Top 10 Leaderboard', action: 'top 10' },
  { label: 'Activate Premium', action: 'premium' },
  { label: 'How does this work?', action: 'how does this work' },
]

interface MessageContext {
  senderAddress: string
  isFirstMessage: boolean
}

export async function handleMessage(
  text: string,
  ctx: MessageContext
): Promise<string> {
  const msg = text.trim().toLowerCase()

  // Onboarding
  if (ctx.isFirstMessage || msg === 'help' || msg === 'start') {
    return ONBOARDING
  }

  // Find agent
  const findMatch = msg.match(/^find\s+(\w+)\s+agent/)
  if (findMatch) {
    return handleFind(findMatch[1] as any)
  }

  // Capabilities
  const capMatch = msg.match(/^(?:capabilities?|what can)\s+(\S+)(?:\s+do)?/)
  if (capMatch) {
    return await handleCapabilities(capMatch[1])
  }

  // Top 10 / leaderboard
  if (/^(?:top\s*\d+|leaderboard)/.test(msg)) {
    const limit = parseInt(msg.match(/\d+/)?.[0] || '10')
    return handleLeaderboard(Math.min(limit, 20))
  }

  // Info
  const infoMatch = msg.match(/^info\s+(\S+)/)
  if (infoMatch) {
    return handleInfo(infoMatch[1])
  }

  // Stats (paid)
  const statsMatch = msg.match(/^stats\s+(\S+)/)
  if (statsMatch) {
    return handleStats(statsMatch[1])
  }

  // Compare (paid)
  const compareMatch = msg.match(/^compare\s+(\S+)\s+(\S+)/)
  if (compareMatch) {
    return handleCompare(compareMatch[1], compareMatch[2])
  }

  // Premium
  const premiumMatch = msg.match(/^premium(?:\s+(\S+))?/)
  if (premiumMatch) {
    return handlePremium(premiumMatch[1])
  }

  // Review
  const reviewMatch = msg.match(/^review\s+(\S+)\s+(good|bad|positive|negative)/)
  if (reviewMatch) {
    return handleReview(reviewMatch[1], reviewMatch[2])
  }

  // How does this work
  if (/how.*(work|function|operate)|what is agentboard/.test(msg)) {
    return handleHowItWorks()
  }

  return `i didn't understand that. try:
- "find trading agent"
- "capabilities trusttrader.base.eth"
- "top 10"
- "info agentname.base.eth"
- "help"`
}

function handleFind(category: string): string {
  const agents = store.getFilteredAgents({ category: category as any })
    .sort((a, b) => b.reputation.trustScore - a.reputation.trustScore)
    .slice(0, 3)

  if (agents.length === 0) {
    return `no ${category} agents found in the ERC-8004 registry yet.`
  }

  const lines = [`top ${category} agents on Base:\n`]
  for (const a of agents) {
    const skill = a.skill?.fetchStatus === 'ok' ? `\n   📄 ${a.skill.description.slice(0, 80)}` : ''
    const erc8128 = a.erc8128Active ? '✓ ERC-8128' : '— ERC-8128'
    const tier = a.tier === 'premium' ? '⭐ PREMIUM' : 'BASIC'
    lines.push(`${a.name} (${a.basename})
   trust: ${a.reputation.trustScore}/100 | ${tier} | ${erc8128}${skill}
   [Contact via Base App] cbwallet://messaging/${a.address}
   [See capabilities] reply: "capabilities ${a.basename}"\n`)
  }
  return lines.join('\n')
}

async function handleCapabilities(basename: string): Promise<string> {
  const agent = store.getAgent(basename)
  if (!agent) return `agent "${basename}" not found in the registry.`

  // Refresh skill
  if (agent.endpoint) {
    const skill = await fetchAgentSkill(agent.address, agent.endpoint, agent.tier === 'premium')
    agent.skill = skill
    store.upsertAgent(agent)
  }

  const skill = agent.skill
  if (!skill || skill.fetchStatus === 'no-skill-file') {
    return `${agent.name} hasn't published a SKILL.md yet.\n\nno skill file found at ${agent.endpoint}/.well-known/SKILL.md\n\nto learn about the Agent App Framework: https://docs.base.org/builderkits/agent-app-framework`
  }
  if (skill.fetchStatus === 'unreachable') {
    return `${agent.name}'s endpoint is currently unreachable. last successful fetch: ${skill.lastFetched ? new Date(skill.lastFetched).toISOString() : 'never'}`
  }

  return formatCapabilities(agent, skill)
}

function formatCapabilities(agent: AgentEntry, skill: AgentSkill): string {
  const lines = [`${agent.name} — CAPABILITIES\n`]
  lines.push(skill.description)
  lines.push(`\nAuthentication: ${skill.authentication}\n`)

  if (skill.endpoints.length > 0) {
    lines.push('ENDPOINTS:')
    for (const ep of skill.endpoints) {
      lines.push(`\n${ep.method} ${ep.path}`)
      if (ep.description) lines.push(`  ${ep.description}`)
      if (Object.keys(ep.inputs).length > 0) {
        lines.push('  inputs: ' + Object.entries(ep.inputs).map(([k, v]) => `${k}: ${v}`).join(', '))
      }
      if (ep.output) lines.push(`  returns: ${ep.output}`)
      if (ep.payment) lines.push(`  💰 payment: ${ep.payment}`)
      if (ep.sideEffects) lines.push(`  ⚡ side effects: ${ep.sideEffects}`)
    }
  }

  lines.push(`\nverified onchain | fetched: ${new Date(skill.lastFetched).toISOString()}`)
  lines.push(`[Contact ${agent.name}] cbwallet://messaging/${agent.address}`)
  return lines.join('\n')
}

function handleLeaderboard(limit: number): string {
  const agents = store.getLeaderboard(limit)
  if (agents.length === 0) return 'no agents indexed yet.'

  const lines = [`AGENTBOARD LEADERBOARD — top ${agents.length}\n`]
  agents.forEach((a, i) => {
    const skill = a.skill?.fetchStatus === 'ok' ? `📄 ${a.skill.endpoints.length} endpoints` : 'no SKILL.md'
    const tier = a.tier === 'premium' ? '⭐' : ' '
    lines.push(`${i + 1}. ${tier} ${a.name} (${a.basename})`)
    lines.push(`   ${a.reputation.trustScore}/100 | ${skill}\n`)
  })
  return lines.join('\n')
}

function handleInfo(basename: string): string {
  const agent = store.getAgent(basename)
  if (!agent) return `agent "${basename}" not found.`

  const rep = agent.reputation
  const skill = agent.skill

  const lines = [
    `${agent.name}`,
    `${agent.basename} | ${agent.address.slice(0, 6)}...${agent.address.slice(-4)} | ${agent.tier.toUpperCase()}`,
    '',
    `trust score: ${rep.trustScore}/100`,
    `uptime 7d: ${rep.uptimeLast7d}%`,
    `x402 volume: $${rep.x402VolumeUsdc.toFixed(2)} USDC`,
    `ERC-8128 rate: ${rep.erc8128VerificationRate}%`,
    `reviews: ${rep.positiveReviews}👍 ${rep.negativeReviews}👎`,
    '',
  ]

  if (skill?.fetchStatus === 'ok') {
    lines.push(`capabilities: ${skill.description.slice(0, 120)}`)
    lines.push(`${skill.endpoints.length} endpoints documented`)
    lines.push(`reply "capabilities ${agent.basename}" for full details`)
  } else {
    lines.push('no SKILL.md published')
  }

  lines.push('')
  lines.push(`[Contact ${agent.name}] cbwallet://messaging/${agent.address}`)
  lines.push(`view on Base: https://basescan.org/address/${agent.address}`)

  return lines.join('\n')
}

function handleStats(basename: string): string {
  const agent = store.getAgent(basename)
  if (!agent) return `agent "${basename}" not found.`

  return `stats for ${agent.name} costs ${config.fees.analyticsUsdc} USDC.

to pay via x402, call the AGENTBOARD contract:
queryAgentAnalytics("${agent.address}")
contract: ${config.contracts.agentboard}

once paid, your wallet unlocks full analytics including:
- 30-day trust history
- complete SKILL.md documentation
- interaction breakdown
- ERC-8128 verification log`
}

function handleCompare(basename1: string, basename2: string): string {
  const a1 = store.getAgent(basename1)
  const a2 = store.getAgent(basename2)

  if (!a1) return `agent "${basename1}" not found.`
  if (!a2) return `agent "${basename2}" not found.`

  return `comparing ${a1.name} vs ${a2.name} costs ${config.fees.compareUsdc} USDC.

to pay via x402:
compareAgents("${a1.address}", "${a2.address}")
contract: ${config.contracts.agentboard}

quick preview:
${a1.name}: ${a1.reputation.trustScore}/100 | ${a1.tier} | ${a1.skill?.fetchStatus === 'ok' ? a1.skill.endpoints.length + ' endpoints' : 'no SKILL.md'}
${a2.name}: ${a2.reputation.trustScore}/100 | ${a2.tier} | ${a2.skill?.fetchStatus === 'ok' ? a2.skill.endpoints.length + ' endpoints' : 'no SKILL.md'}`
}

function handlePremium(basename?: string): string {
  if (!basename) {
    return `to activate premium tier for your agent:
"premium youragent.base.eth"

cost: ${config.fees.premiumUsdc} USDC / 30 days
benefits:
- trust score updated every 10 minutes
- skill file refreshed every 30 minutes
- PREMIUM badge in directory
- analytics visible to all users
- priority in search results

pay via web: ${process.env.WEB_URL || 'https://agentboard.vercel.app'}/premium`
  }

  const agent = store.getAgent(basename)
  if (!agent) return `agent "${basename}" not found in the ERC-8004 registry.`

  return `to activate premium for ${agent.name}:

cost: ${config.fees.premiumUsdc} USDC / 30 days
contract: ${config.contracts.agentboard}
function: payPremiumTier("${agent.address}")

pay via web: ${process.env.WEB_URL || 'https://agentboard.vercel.app'}/premium
or approve USDC then call the contract directly.

tx will be visible at: https://basescan.org/address/${config.contracts.agentboard}`
}

function handleReview(basename: string, sentiment: string): string {
  const agent = store.getAgent(basename)
  if (!agent) return `agent "${basename}" not found.`

  const positive = ['good', 'positive'].includes(sentiment)

  return `submitting a ${positive ? 'positive' : 'negative'} review for ${agent.name} costs ${config.fees.reviewUsdc} USDC.

contract: ${config.contracts.agentboard}
function: submitReview("${agent.address}", ${positive}, <commentHash>, <proofTxHash>)

pay via web: ${process.env.WEB_URL || 'https://agentboard.vercel.app'}/agent/${agent.basename}

note: you need a bytes32 hash of your comment and a proof transaction hash from a prior interaction with the agent.`
}

function handleHowItWorks(): string {
  return `AGENTBOARD is the reputation and discovery layer for ERC-8004 agents on Base.

ERC-8004 is an onchain standard where any autonomous agent can register with its name, endpoint, and public key. but that registry is raw — no trust, no documentation.

AGENTBOARD adds two layers:

1. REPUTATION
   reads ERC-8004 onchain, observes agent behavior, calculates trust scores from: uptime, ERC-8128 verification rate, x402 payment volume, interaction count, and registry age. snapshots are recorded onchain via AgentboardReputation.sol — immutable and verifiable on Basescan.

2. CAPABILITY DISCOVERY
   each registered agent can publish a SKILL.md at /.well-known/SKILL.md following the Base Agent App Framework. AGENTBOARD auto-fetches these files, parses endpoints/inputs/outputs/costs, and records the content hash onchain so the documentation is tamper-evident.

AGENTBOARD does NOT intermediate — it connects. the Contact button goes directly to the agent via cbwallet://messaging. AGENTBOARD is the DNS and the documentation, not the middleman.

for agents: register at ERC-8004, publish /.well-known/SKILL.md, and you're automatically discoverable.
for users: search by category and trust score, read capabilities, contact directly.
for other agents: call GET /api/agents?category=oracle&minTrust=80 to find qualified agents, then GET /api/agents/{basename}/skill to get their SKILL.md parsed and ready to call.

contract: ${config.contracts.agentboard || '[not yet deployed]'}
ERC-8004 registry: ${config.contracts.erc8004Registry || '[configure]'}`
}
