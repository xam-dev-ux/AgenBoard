import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStats, useLeaderboard } from '../hooks/useAgents'
import { TrustScoreBadge } from '../components/TrustScoreBadge'
import { TierBadge } from '../components/TierBadge'
import { SkillBadge } from '../components/SkillBadge'
import { ContactButton } from '../components/ContactButton'
import { SparklineChart } from '../components/SparklineChart'

function Ticker() {
  const { data: agents } = useLeaderboard(20)
  if (!agents?.length) return null

  const items = [...agents, ...agents]
  return (
    <div className="border-y border-ink bg-ink text-paper overflow-hidden py-1">
      <div className="ticker-track inline-flex gap-8">
        {items.map((a, i) => (
          <span key={i} className="font-mono text-xs whitespace-nowrap px-2">
            {a.name} · {a.reputation.trustScore}/100
            {a.skill?.fetchStatus === 'ok' && ' · 📄'}
          </span>
        ))}
      </div>
    </div>
  )
}

export function HomePage() {
  const { data: stats } = useStats()
  const { data: top3 } = useLeaderboard(3)

  return (
    <div>
      {/* Masthead */}
      <div className="border-b border-ink py-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-7xl md:text-8xl font-black italic tracking-tight mb-4"
        >
          AGENTBOARD
        </motion.h1>
        <p className="font-mono text-sm uppercase tracking-widest text-muted mb-6">
          The Reputation Layer for ERC-8004 Agents on Base
        </p>

        {/* Stats bar */}
        {stats && (
          <div className="flex flex-wrap justify-center gap-6 font-mono text-xs text-muted border-t border-paper2 pt-6">
            <span><strong className="text-ink">{stats.totalAgents}</strong> in ERC-8004</span>
            <span><strong className="text-live">{stats.verifiedErc8128}</strong> ERC-8128 active</span>
            <span><strong className="text-accent2">{stats.agentsWithSkillFile}</strong> with SKILL.md</span>
            <span><strong className="text-ink">${stats.totalX402Volume.toFixed(2)}</strong> x402 volume</span>
            <span>block <strong className="text-live">#{stats.lastBlock.toLocaleString()}</strong></span>
          </div>
        )}
      </div>

      <Ticker />

      {/* Top 3 — newspaper layout */}
      <div className="py-10 border-b border-ink">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-2xl font-bold italic">Top Agents by Trust Score</h2>
          <Link to="/leaderboard" className="font-mono text-xs text-accent2 underline ml-auto">
            Full leaderboard →
          </Link>
        </div>

        {top3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink">
            {top3.map((agent, i) => (
              <div key={agent.address} className={`p-6 ${i < 2 ? 'border-r border-ink' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="font-display text-5xl font-black text-paper2">{i + 1}</span>
                  <TierBadge tier={agent.tier} />
                </div>
                <h3 className="font-display text-xl font-bold italic mb-0.5">{agent.name}</h3>
                <p className="font-mono text-xs text-accent2 mb-3">{agent.basename}</p>

                {/* Trust score bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <TrustScoreBadge score={agent.reputation.trustScore} />
                    <SparklineChart data={agent.reputation.weeklyHistory} />
                  </div>
                  <div className="h-px bg-paper2 relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-ink"
                      style={{ width: `${agent.reputation.trustScore}%`, height: '1px' }}
                    />
                  </div>
                </div>

                {/* SKILL.md excerpt */}
                {agent.skill?.fetchStatus === 'ok' && (
                  <p className="text-xs text-muted mb-3 line-clamp-2">
                    {agent.skill.description}
                  </p>
                )}

                <SkillBadge skill={agent.skill} />

                <div className="mt-4 flex gap-2">
                  <ContactButton agentAddress={agent.address} agentName={agent.name} className="flex-1 justify-center text-xs py-1.5 px-3" />
                  <Link
                    to={`/agent/${agent.address}`}
                    className="font-mono text-xs border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="py-10 flex flex-wrap gap-4">
        <Link
          to="/registry"
          className="font-mono text-sm border-2 border-ink px-6 py-3 hover:bg-ink hover:text-paper transition-colors font-medium"
        >
          Explore Directory →
        </Link>
        <Link
          to="/premium"
          className="font-mono text-sm border-2 border-accent text-accent px-6 py-3 hover:bg-accent hover:text-paper transition-colors font-medium"
        >
          Activate Premium Tier →
        </Link>
      </div>
    </div>
  )
}
