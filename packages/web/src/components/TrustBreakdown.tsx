import { ReputationData } from '@agentboard/shared'

interface Props {
  reputation: ReputationData
}

interface BarProps {
  label: string
  weight: string
  value: number
  max: number
}

function Bar({ label, weight, value, max }: BarProps) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono text-xs text-muted">{label}</span>
        <span className="font-mono text-xs text-muted">{weight}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-paper2 relative">
          <div
            className="absolute inset-y-0 left-0 bg-ink"
            style={{ width: `${pct}%`, height: '1px' }}
          />
        </div>
        <span className="font-mono text-xs w-12 text-right">{value.toFixed(0)}/100</span>
      </div>
    </div>
  )
}

export function TrustBreakdownComponent({ reputation }: Props) {
  return (
    <div className="border border-ink p-4">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Trust Breakdown</h3>
      <Bar label="Uptime 7d" weight="×0.30" value={reputation.uptimeLast7d} max={100} />
      <Bar label="ERC-8128 Rate" weight="×0.25" value={reputation.erc8128VerificationRate} max={100} />
      <Bar label="x402 Volume" weight="×0.20" value={Math.min(reputation.x402VolumeUsdc, 100)} max={100} />
      <Bar label="Interactions" weight="×0.15" value={Math.min(reputation.totalInteractions / 10, 100)} max={100} />
      <Bar label="Age (capped 90d)" weight="×0.10" value={100} max={100} />
    </div>
  )
}
