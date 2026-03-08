import { useWalletStore } from '../stores/wallet'

export function WalletButton() {
  const { address, usdcBalance, connect, disconnect } = useWalletStore()

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-muted">
          {usdcBalance} USDC
        </span>
        <button
          onClick={disconnect}
          className="font-mono text-xs border border-ink px-3 py-1 hover:bg-ink hover:text-paper transition-colors"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect().catch(e => alert(e.message))}
      className="font-mono text-xs border border-ink px-3 py-1 hover:bg-ink hover:text-paper transition-colors"
    >
      Connect Wallet
    </button>
  )
}
