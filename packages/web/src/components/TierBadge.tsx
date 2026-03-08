interface Props {
  tier: 'basic' | 'premium'
}

export function TierBadge({ tier }: Props) {
  if (tier === 'premium') {
    return (
      <span className="badge border-warn text-warn bg-warn/10">
        ★ PREMIUM
      </span>
    )
  }
  return (
    <span className="badge border-muted text-muted">
      BASIC
    </span>
  )
}
