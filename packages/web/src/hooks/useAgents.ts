import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useRegistryStore } from '../stores/registry'
import { AgentCategory } from '@agentboard/shared'

const PAGE_SIZE = 50

export function useAgents() {
  const { setAgents, page, selectedCategory, filterPremium, filterHasSkill } = useRegistryStore()
  return useQuery({
    queryKey: ['agents', page, selectedCategory, filterPremium, filterHasSkill],
    queryFn: async () => {
      const result = await api.getAgents({
        category: selectedCategory ?? undefined,
        tier: filterPremium ? 'premium' : undefined,
        hasSkill: filterHasSkill ? true : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setAgents(result.agents, result.total)
      return result
    },
    refetchInterval: 30 * 1000,
  })
}

export function useAgent(basename: string | undefined) {
  return useQuery({
    queryKey: ['agent', basename],
    queryFn: () => api.getAgent(basename!),
    enabled: !!basename,
    refetchInterval: 30 * 1000,
  })
}

export function useAgentSkill(basename: string | undefined, isPremium?: boolean) {
  return useQuery({
    queryKey: ['agent-skill', basename],
    queryFn: () => api.getAgentSkill(basename!),
    enabled: !!basename,
    refetchInterval: isPremium ? 30 * 60 * 1000 : 6 * 60 * 60 * 1000,
  })
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 5 * 1000,
  })
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => api.getLeaderboard(limit),
    refetchInterval: 15 * 1000,
  })
}

export function useTrustHistory(basename: string | undefined) {
  return useQuery({
    queryKey: ['trust-history', basename],
    queryFn: () => api.getTrustHistory(basename!),
    enabled: !!basename,
    refetchInterval: 60 * 1000,
  })
}

export function useReviews(basename: string | undefined) {
  return useQuery({
    queryKey: ['reviews', basename],
    queryFn: () => api.getReviews(basename!),
    enabled: !!basename,
    refetchInterval: 30 * 1000,
  })
}

export function useFees() {
  return useQuery({
    queryKey: ['fees'],
    queryFn: api.getFees,
    refetchInterval: 60 * 1000,
  })
}
