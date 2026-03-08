import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useRegistryStore } from '../stores/registry'
import { AgentCategory } from '@agentboard/shared'

export function useAgents() {
  const setAgents = useRegistryStore(s => s.setAgents)
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const agents = await api.getAgents()
      setAgents(agents)
      return agents
    },
    refetchInterval: 10 * 1000,
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
