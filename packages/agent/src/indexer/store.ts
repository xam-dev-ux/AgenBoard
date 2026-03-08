import { AgentEntry, AgentCategory, GlobalStats, ReputationData } from '@agentboard/shared'

class AgentStore {
  private agents = new Map<string, AgentEntry>()
  private lastBlock = 0
  private agentCallsToday = 0
  private totalX402Volume = 0

  upsertAgent(agent: AgentEntry) {
    this.agents.set(agent.address.toLowerCase(), agent)
  }

  getAgent(addressOrBasename: string): AgentEntry | undefined {
    const lower = addressOrBasename.toLowerCase()
    // Try by address
    if (this.agents.has(lower)) return this.agents.get(lower)
    // Try by basename
    for (const agent of this.agents.values()) {
      if (agent.basename.toLowerCase() === lower) return agent
    }
    return undefined
  }

  getAllAgents(): AgentEntry[] {
    return Array.from(this.agents.values())
  }

  getFilteredAgents(opts: {
    category?: AgentCategory
    minTrust?: number
    erc8128?: boolean
    tier?: 'basic' | 'premium'
    hasSkill?: boolean
  }): AgentEntry[] {
    return this.getAllAgents().filter(a => {
      if (opts.category && a.category !== opts.category) return false
      if (opts.minTrust !== undefined && a.reputation.trustScore < opts.minTrust) return false
      if (opts.erc8128 !== undefined && a.erc8128Active !== opts.erc8128) return false
      if (opts.tier && a.tier !== opts.tier) return false
      if (opts.hasSkill !== undefined) {
        const hasSkill = a.skill?.fetchStatus === 'ok'
        if (opts.hasSkill !== hasSkill) return false
      }
      return true
    })
  }

  getLeaderboard(limit = 10): AgentEntry[] {
    return this.getAllAgents()
      .sort((a, b) => b.reputation.trustScore - a.reputation.trustScore)
      .slice(0, limit)
  }

  setLastBlock(block: number) { this.lastBlock = block }
  incrementCallsToday() { this.agentCallsToday++ }
  addX402Volume(usdc: number) { this.totalX402Volume += usdc }

  getStats(): GlobalStats {
    const agents = this.getAllAgents()
    return {
      totalAgents: agents.length,
      premiumAgents: agents.filter(a => a.tier === 'premium').length,
      verifiedErc8128: agents.filter(a => a.erc8128Active).length,
      totalX402Volume: this.totalX402Volume,
      agentCallsToday: this.agentCallsToday,
      lastBlock: this.lastBlock,
      agentsWithSkillFile: agents.filter(a => a.skill?.fetchStatus === 'ok').length,
    }
  }
}

export const store = new AgentStore()
