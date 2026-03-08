interface Props {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function SparklineChart({ data, color = '#0a0a08', width = 60, height = 20 }: Props) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data, 100)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
