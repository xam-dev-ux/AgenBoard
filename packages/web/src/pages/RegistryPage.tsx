import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAgents } from '../hooks/useAgents'
import { useRegistryStore } from '../stores/registry'
import { TrustScoreBadge } from '../components/TrustScoreBadge'
import { TierBadge } from '../components/TierBadge'
import { SkillBadge } from '../components/SkillBadge'
import { StandardsBadge } from '../components/StandardsBadge'
import { SparklineChart } from '../components/SparklineChart'
import { ContactButton } from '../components/ContactButton'
import { AgentCategory } from '@agentboard/shared'

const CATEGORIES: AgentCategory[] = ['trading', 'payment', 'social', 'oracle', 'escrow', 'analytics']

export function RegistryPage() {
  useAgents() // triggers sync to store

  const {
    searchQuery, setSearchQuery,
    selectedCategory, setSelectedCategory,
    sortBy, setSortBy,
    filterPremium, setFilterPremium,
    filterHasSkill, setFilterHasSkill,
    filteredAgents,
  } = useRegistryStore()

  const agents = filteredAgents()

  return (
    <div>
      <div className="mb-6 border-b border-ink pb-6">
        <h1 className="font-display text-4xl font-bold italic mb-2">Agent Directory</h1>
        <p className="font-mono text-xs text-muted">
          Agents sourced from the public ERC-8004 registry on Base mainnet — AGENTBOARD indexes and scores them.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search agents, capabilities, endpoints..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 min-w-48 border border-ink px-3 py-2 font-mono text-sm bg-paper focus:outline-none focus:border-accent2"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="border border-ink px-3 py-2 font-mono text-sm bg-paper focus:outline-none"
        >
          <option value="trust">Sort: Trust Score</option>
          <option value="x402volume">Sort: x402 Volume</option>
          <option value="age">Sort: Newest</option>
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`badge ${!selectedCategory ? 'bg-ink text-paper border-ink' : 'border-ink text-muted'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`badge capitalize ${selectedCategory === cat ? 'bg-ink text-paper border-ink' : 'border-ink text-muted hover:border-accent2'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Toggle filters */}
      <div className="flex gap-4 mb-6 font-mono text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filterPremium} onChange={e => setFilterPremium(e.target.checked)} className="accent-ink" />
          Premium only
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filterHasSkill} onChange={e => setFilterHasSkill(e.target.checked)} className="accent-ink" />
          Has SKILL.md
        </label>
      </div>

      {/* Table */}
      <div className="border border-ink">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink bg-ink text-paper">
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-2">#</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-2">Agent</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-2 hidden md:table-cell">Category</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-2 hidden lg:table-cell">Standards</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-2">SKILL.md</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-2">Score</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-2 hidden md:table-cell">7d</th>
              <th className="text-left font-mono text-xs uppercase tracking-widest px-4 py-2">Contact</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent, i) => (
              <tr key={agent.address} className="border-b border-paper2 hover:bg-paper2/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link to={`/agent/${agent.basename}`} className="hover:text-accent2">
                    <div className="font-medium">{agent.name}</div>
                    <div className="font-mono text-xs text-muted">{agent.basename}</div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="badge border-muted text-muted capitalize text-xs">{agent.category}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <StandardsBadge
                    erc8004={agent.erc8004Verified}
                    erc8128={agent.erc8128Active}
                    siwa={agent.siwaEnabled}
                    x402={agent.x402Active}
                  />
                </td>
                <td className="px-4 py-3">
                  <SkillBadge skill={agent.skill} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TrustScoreBadge score={agent.reputation.trustScore} size="sm" />
                    <TierBadge tier={agent.tier} />
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <SparklineChart data={agent.reputation.weeklyHistory} />
                </td>
                <td className="px-4 py-3">
                  <ContactButton
                    agentAddress={agent.address}
                    agentName={agent.name}
                    className="text-xs py-1 px-3"
                  />
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-mono text-sm text-muted">
                  No agents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
