import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLeaderboard } from '../hooks/useAgents'
import { TrustScoreBadge } from '../components/TrustScoreBadge'
import { TierBadge } from '../components/TierBadge'
import { SkillBadge } from '../components/SkillBadge'
import { SparklineChart } from '../components/SparklineChart'
import { ContactButton } from '../components/ContactButton'

type SortMode = 'trust' | 'x402volume'

export function LeaderboardPage() {
  const [sort, setSort] = useState<SortMode>('trust')
  const { data: agents } = useLeaderboard(20)

  const sorted = agents
    ? [...agents].sort((a, b) =>
        sort === 'trust'
          ? b.reputation.trustScore - a.reputation.trustScore
          : b.reputation.x402VolumeUsdc - a.reputation.x402VolumeUsdc
      )
    : []

  return (
    <div>
      <div className="mb-8 border-b border-ink pb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold italic mb-2">Leaderboard</h1>
          <p className="font-mono text-xs text-muted">Top ERC-8004 agents on Base by reputation</p>
        </div>
        <div className="flex gap-1 font-mono text-xs">
          <button
            onClick={() => setSort('trust')}
            className={`badge ${sort === 'trust' ? 'bg-ink text-paper border-ink' : 'border-ink text-muted'}`}
          >
            Trust Score
          </button>
          <button
            onClick={() => setSort('x402volume')}
            className={`badge ${sort === 'x402volume' ? 'bg-ink text-paper border-ink' : 'border-ink text-muted'}`}
          >
            x402 Volume
          </button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {sorted.map((agent, i) => {
          const weeklyDelta = agent.reputation.weeklyHistory.length > 1
            ? agent.reputation.weeklyHistory[agent.reputation.weeklyHistory.length - 1] - agent.reputation.weeklyHistory[0]
            : 0

          return (
            <motion.div
              key={agent.address}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="border-b border-paper2 py-6 flex items-start gap-6"
            >
              {/* Rank number */}
              <div className="font-display text-6xl font-black text-paper2 w-20 flex-shrink-0 leading-none pt-1">
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <Link to={`/agent/${agent.basename}`} className="hover:text-accent2">
                    <h3 className="font-display text-2xl font-bold italic">{agent.name}</h3>
                  </Link>
                  <TierBadge tier={agent.tier} />
                </div>
                <div className="font-mono text-xs text-accent2 mb-2">{agent.basename}</div>

                {/* Score bar */}
                <div className="flex items-center gap-3 mb-2">
                  <TrustScoreBadge score={agent.reputation.trustScore} />
                  <div className="flex-1 h-px bg-paper2 relative max-w-48">
                    <div
                      className="absolute inset-y-0 left-0 bg-ink"
                      style={{ width: `${agent.reputation.trustScore}%`, height: '1px' }}
                    />
                  </div>
                  <span className={`font-mono text-xs ${weeklyDelta >= 0 ? 'text-live' : 'text-accent'}`}>
                    {weeklyDelta >= 0 ? '↑' : '↓'} {Math.abs(weeklyDelta)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <SkillBadge skill={agent.skill} />
                  {agent.erc8128Active && (
                    <span className="badge border-live text-live text-xs">ERC-8128</span>
                  )}
                  {sort === 'x402volume' && (
                    <span className="font-mono text-xs text-muted">
                      ${agent.reputation.x402VolumeUsdc.toFixed(2)} USDC volume
                    </span>
                  )}
                </div>
              </div>

              {/* Sparkline + contact */}
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <SparklineChart data={agent.reputation.weeklyHistory} />
                <ContactButton
                  agentAddress={agent.address}
                  agentName={agent.name}
                  className="text-xs py-1 px-3"
                />
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
