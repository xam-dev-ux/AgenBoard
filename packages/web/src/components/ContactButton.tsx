interface Props {
  agentAddress: string
  agentName: string
  className?: string
}

export function ContactButton({ agentAddress, agentName, className = '' }: Props) {
  const href = `cbwallet://messaging/${agentAddress}`

  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper border border-ink font-mono text-sm font-medium hover:bg-accent hover:border-accent transition-colors ${className}`}
    >
      Contact {agentName} →
    </a>
  )
}
