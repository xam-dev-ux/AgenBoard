import { AgentEntry, ReputationData, TrustBreakdown } from '@agentboard/shared'

/**
 * Calculate trust score from agent reputation data.
 *
 * uptimeLast7d            × 0.30
 * erc8128VerificationRate × 0.25
 * x402VolumeNormalized    × 0.20
 * interactionsNormalized  × 0.15
 * ageDaysCapAt90          × 0.10
 */
export function calculateTrustScore(rep: ReputationData, ageDays: number): TrustBreakdown {
  const uptimeScore = Math.min(rep.uptimeLast7d, 100) * 0.30
  const erc8128Score = Math.min(rep.erc8128VerificationRate, 100) * 0.25
  const x402Score = Math.min(normalizeVolume(rep.x402VolumeUsdc), 100) * 0.20
  const interactionsScore = Math.min(normalizeInteractions(rep.totalInteractions), 100) * 0.15
  const ageScore = Math.min((ageDays / 90) * 100, 100) * 0.10

  const total = Math.round(uptimeScore + erc8128Score + x402Score + interactionsScore + ageScore)

  return {
    uptimeScore: Math.round(uptimeScore),
    erc8128Score: Math.round(erc8128Score),
    x402Score: Math.round(x402Score),
    interactionsScore: Math.round(interactionsScore),
    ageScore: Math.round(ageScore),
    total: Math.min(total, 100),
  }
}

// Normalize x402 volume: $100 USDC = 100 score
function normalizeVolume(usdc: number): number {
  return Math.min((usdc / 100) * 100, 100)
}

// Normalize interactions: 1000 = 100 score
function normalizeInteractions(count: number): number {
  return Math.min((count / 1000) * 100, 100)
}

export function getComponentArray(breakdown: TrustBreakdown): [number, number, number, number, number] {
  return [
    breakdown.uptimeScore,
    breakdown.erc8128Score,
    breakdown.x402Score,
    breakdown.interactionsScore,
    breakdown.ageScore,
  ]
}
