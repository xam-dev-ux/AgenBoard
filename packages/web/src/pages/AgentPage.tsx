import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAgent, useTrustHistory } from '../hooks/useAgents'
import { TrustScoreBadge } from '../components/TrustScoreBadge'
import { TierBadge } from '../components/TierBadge'
import { StandardsBadge } from '../components/StandardsBadge'
import { SkillBadge } from '../components/SkillBadge'
import { ContactButton } from '../components/ContactButton'
import { TrustBreakdownComponent } from '../components/TrustBreakdown'
import { SkillViewer } from '../components/SkillViewer'

const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || 'https://basescan.org'

export function AgentPage() {
  const { basename } = useParams<{ basename: string }>()
  const { data: agent, isLoading, error } = useAgent(basename)
  const { data: historyData } = useTrustHistory(basename)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="font-mono text-sm text-muted">Loading agent...</div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="py-12 text-center">
        <p className="font-mono text-sm text-accent mb-4">Agent not found: {basename}</p>
        <Link to="/registry" className="font-mono text-xs text-accent2 underline">← Back to registry</Link>
      </div>
    )
  }

  const rep = agent.reputation
  const weeklyDelta = rep.weeklyHistory.length > 1
    ? rep.weeklyHistory[rep.weeklyHistory.length - 1] - rep.weeklyHistory[0]
    : 0

  const chartData = historyData?.history.map(h => ({
    day: `Day ${h.day + 1}`,
    score: h.score,
  })) || rep.weeklyHistory.map((s, i) => ({ day: `Day ${i + 1}`, score: s }))

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 font-mono text-xs text-muted">
        <Link to="/registry" className="hover:text-ink">Directory</Link>
        {' / '}
        <span className="text-ink">{agent.basename}</span>
      </div>

      {/* ── SECTION 1: REPUTATION ─────────────────────────────────── */}

      {/* Header */}
      <div className="border border-ink p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-4xl font-bold italic mb-1">{agent.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm text-accent2">{agent.basename}</span>
              <a
                href={`${BASESCAN_URL}/address/${agent.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-muted hover:text-ink"
              >
                {agent.address.slice(0, 6)}...{agent.address.slice(-4)} ↗
              </a>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <TierBadge tier={agent.tier} />
            <SkillBadge skill={agent.skill} />
          </div>
        </div>

        {/* Trust score prominent */}
        <div className="flex flex-wrap items-center gap-6 mb-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-muted mb-1">Trust Score</div>
            <div className="font-display text-5xl font-bold">
              {rep.trustScore}
              <span className="text-2xl text-muted">/100</span>
            </div>
            <div className={`font-mono text-xs mt-1 ${weeklyDelta >= 0 ? 'text-live' : 'text-accent'}`}>
              {weeklyDelta >= 0 ? '+' : ''}{weeklyDelta} this week
            </div>
          </div>

          <StandardsBadge
            erc8004={agent.erc8004Verified}
            erc8128={agent.erc8128Active}
            siwa={agent.siwaEnabled}
            x402={agent.x402Active}
          />
        </div>

        {/* Contact CTA — above the fold */}
        <ContactButton
          agentAddress={agent.address}
          agentName={agent.name}
          className="text-sm py-2 px-6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Trust breakdown */}
        <div className="lg:col-span-1">
          <TrustBreakdownComponent reputation={rep} />
        </div>

        {/* Metrics grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Uptime 7d', value: `${rep.uptimeLast7d.toFixed(1)}%` },
            { label: 'x402 Volume', value: `$${rep.x402VolumeUsdc.toFixed(2)}` },
            { label: 'ERC-8128 Rate', value: `${rep.erc8128VerificationRate}%` },
            { label: 'Interactions', value: rep.totalInteractions.toLocaleString() },
            { label: 'Positive Reviews', value: `${rep.positiveReviews}` },
            { label: 'Negative Reviews', value: `${rep.negativeReviews}` },
          ].map(({ label, value }) => (
            <div key={label} className="border border-ink p-3">
              <div className="font-mono text-xs text-muted uppercase tracking-widest mb-1">{label}</div>
              <div className="font-mono text-lg font-medium">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust history chart */}
      <div className="border border-ink p-6 mb-6">
        <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Trust Score — 7 Day History</h3>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
            <Tooltip
              contentStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 11, border: '1px solid #0a0a08' }}
            />
            <Line type="monotone" dataKey="score" stroke="#0a0a08" strokeWidth={1.5} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-10">
        {agent.tier === 'basic' && (
          <Link
            to={`/premium`}
            className="font-mono text-xs border border-warn text-warn px-4 py-2 hover:bg-warn hover:text-paper transition-colors"
          >
            Activate Premium for {agent.name}
          </Link>
        )}
        <button className="font-mono text-xs border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors">
          Submit Review
        </button>
      </div>

      {/* ── SECTION 2: CAPABILITIES ───────────────────────────────── */}

      <div className="border-rule-double my-8" />

      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold italic mb-1">What This Agent Does</h2>
        <p className="font-mono text-xs text-muted">
          Capabilities sourced from <code className="text-ink">{agent.endpoint}/.well-known/SKILL.md</code>
        </p>
      </div>

      <div className="bg-paper2 border border-ink p-6">
        {agent.skill ? (
          <SkillViewer
            skill={agent.skill}
            agentEndpoint={agent.endpoint}
          />
        ) : (
          <p className="font-mono text-sm text-muted">
            Loading capabilities...
          </p>
        )}
      </div>
    </div>
  )
}
