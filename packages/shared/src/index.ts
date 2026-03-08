export type AgentCategory =
  | 'trading'
  | 'payment'
  | 'social'
  | 'oracle'
  | 'escrow'
  | 'analytics'

export interface SkillEndpoint {
  method: string
  path: string
  description: string
  inputs: Record<string, string>
  output: string
  payment: string | null
  sideEffects: string | null
}

export interface AgentSkill {
  raw: string
  appName: string
  description: string
  endpoints: SkillEndpoint[]
  authentication: string
  lastFetched: number
  fetchStatus: 'ok' | 'unreachable' | 'no-skill-file' | 'parse-error'
}

export interface ReputationData {
  trustScore: number
  weeklyHistory: number[]
  uptimeLast7d: number
  x402VolumeUsdc: number
  erc8128VerificationRate: number
  totalInteractions: number
  positiveReviews: number
  negativeReviews: number
  lastUpdated: number
}

export interface AgentEntry {
  // From ERC-8004 registry
  address: string
  name: string
  basename: string
  endpoint: string
  publicKey: string
  registeredAt: number
  erc8004Verified: boolean

  // Observed onchain by AGENTBOARD
  erc8128Active: boolean
  siwaEnabled: boolean
  x402Active: boolean
  category: AgentCategory
  description: string

  // From autodiscovered SKILL.md
  skill: AgentSkill | null

  // Calculated by AGENTBOARD
  reputation: ReputationData
  tier: 'basic' | 'premium'
}

export interface GlobalStats {
  totalAgents: number
  premiumAgents: number
  verifiedErc8128: number
  totalX402Volume: number
  agentCallsToday: number
  lastBlock: number
  agentsWithSkillFile: number
}

export interface FeeConfig {
  premiumTier: number
  review: number
  analytics: number
  compare: number
}

export interface TrustBreakdown {
  uptimeScore: number
  erc8128Score: number
  x402Score: number
  interactionsScore: number
  ageScore: number
  total: number
}
