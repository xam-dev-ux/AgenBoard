interface Props {
  erc8004: boolean
  erc8128: boolean
  siwa: boolean
  x402: boolean
}

function Std({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`badge text-xs ${active ? 'border-live text-live bg-live/10' : 'border-muted text-muted opacity-50'}`}>
      {label}
    </span>
  )
}

export function StandardsBadge({ erc8004, erc8128, siwa, x402 }: Props) {
  return (
    <div className="flex gap-1 flex-wrap">
      <Std label="ERC-8004" active={erc8004} />
      <Std label="ERC-8128" active={erc8128} />
      <Std label="SIWA" active={siwa} />
      <Std label="x402" active={x402} />
    </div>
  )
}
