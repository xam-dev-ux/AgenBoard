import { AgentEntry, AgentSkill, GlobalStats, FeeConfig, AgentCategory } from '@agentboard/shared'

const API_URL = import.meta.env.VITE_API_URL || ''

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  getAgents: (params?: {
    category?: AgentCategory
    minTrust?: number
    erc8128?: boolean
    tier?: string
    hasSkill?: boolean
    limit?: number
    offset?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.minTrust !== undefined) qs.set('minTrust', String(params.minTrust))
    if (params?.erc8128 !== undefined) qs.set('erc8128', String(params.erc8128))
    if (params?.tier) qs.set('tier', params.tier)
    if (params?.hasSkill !== undefined) qs.set('hasSkill', String(params.hasSkill))
    if (params?.limit !== undefined) qs.set('limit', String(params.limit))
    if (params?.offset !== undefined) qs.set('offset', String(params.offset))
    return get<{ agents: AgentEntry[]; total: number; limit: number; offset: number }>(
      `/api/agents${qs.toString() ? '?' + qs : ''}`
    )
  },

  getAgent: (basename: string) =>
    get<AgentEntry>(`/api/agents/${basename}`),

  getAgentSkill: (basename: string) =>
    get<AgentSkill>(`/api/agents/${basename}/skill`),

  getAgentSkillRaw: (basename: string) =>
    fetch(`${API_URL}/api/agents/${basename}/skill/raw`).then(r => r.text()),

  getTrustHistory: (basename: string) =>
    get<{ agent: string; history: Array<{ score: number; timestamp: number; day: number }> }>(
      `/api/agents/${basename}/trust-history`
    ),

  getReviews: (basename: string) =>
    get<{ agent: string; positive: number; negative: number; reviews: any[] }>(
      `/api/agents/${basename}/reviews`
    ),

  getLeaderboard: (limit = 10) =>
    get<AgentEntry[]>(`/api/leaderboard?limit=${limit}`),

  getStats: () =>
    get<GlobalStats>('/api/stats'),

  getFees: () =>
    get<FeeConfig>('/api/fees'),
}
