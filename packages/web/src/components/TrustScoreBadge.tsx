interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

function scoreColor(score: number) {
  if (score >= 85) return 'text-live border-live'
  if (score >= 70) return 'text-accent2 border-accent2'
  if (score >= 55) return 'text-warn border-warn'
  return 'text-accent border-accent'
}

export function TrustScoreBadge({ score, size = 'md' }: Props) {
  const sizeClass = {
    sm: 'text-xs px-1.5 py-0',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  }[size]

  return (
    <span className={`badge font-mono ${scoreColor(score)} ${sizeClass}`}>
      {score}/100
    </span>
  )
}
