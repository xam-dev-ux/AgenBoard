import { create } from 'zustand'
import { AgentEntry, AgentCategory } from '@agentboard/shared'

interface RegistryStore {
  agents: AgentEntry[]
  searchQuery: string
  selectedCategory: AgentCategory | null
  sortBy: 'trust' | 'x402volume' | 'age'
  filterPremium: boolean
  filterHasSkill: boolean
  selectedAgent: AgentEntry | null
  setAgents: (agents: AgentEntry[]) => void
  setSearchQuery: (q: string) => void
  setSelectedCategory: (cat: AgentCategory | null) => void
  setSortBy: (sort: 'trust' | 'x402volume' | 'age') => void
  setFilterPremium: (v: boolean) => void
  setFilterHasSkill: (v: boolean) => void
  setSelectedAgent: (agent: AgentEntry | null) => void
  filteredAgents: () => AgentEntry[]
}

export const useRegistryStore = create<RegistryStore>((set, get) => ({
  agents: [],
  searchQuery: '',
  selectedCategory: null,
  sortBy: 'trust',
  filterPremium: false,
  filterHasSkill: false,
  selectedAgent: null,

  setAgents: (agents) => set({ agents }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSortBy: (sortBy) => set({ sortBy }),
  setFilterPremium: (filterPremium) => set({ filterPremium }),
  setFilterHasSkill: (filterHasSkill) => set({ filterHasSkill }),
  setSelectedAgent: (selectedAgent) => set({ selectedAgent }),

  filteredAgents: () => {
    const { agents, searchQuery, selectedCategory, sortBy, filterPremium, filterHasSkill } = get()
    let result = [...agents]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.basename.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.skill?.description.toLowerCase().includes(q) ||
        a.skill?.endpoints.some(e => e.path.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      )
    }

    if (selectedCategory) {
      result = result.filter(a => a.category === selectedCategory)
    }

    if (filterPremium) {
      result = result.filter(a => a.tier === 'premium')
    }

    if (filterHasSkill) {
      result = result.filter(a => a.skill?.fetchStatus === 'ok')
    }

    result.sort((a, b) => {
      if (sortBy === 'trust') return b.reputation.trustScore - a.reputation.trustScore
      if (sortBy === 'x402volume') return b.reputation.x402VolumeUsdc - a.reputation.x402VolumeUsdc
      return b.registeredAt - a.registeredAt
    })

    return result
  },
}))
