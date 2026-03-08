import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ethers } from 'ethers'

const RPC_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/rpc`
  : 'https://mainnet.base.org'

const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || 'https://basescan.org'

export function TransactionPage() {
  const { hash } = useParams<{ hash: string }>()

  const { data: tx, isLoading } = useQuery({
    queryKey: ['tx', hash],
    queryFn: async () => {
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org')
      const [txData, receipt] = await Promise.all([
        provider.getTransaction(hash!),
        provider.getTransactionReceipt(hash!),
      ])
      const block = receipt ? await provider.getBlock(receipt.blockNumber) : null
      return { txData, receipt, block }
    },
    enabled: !!hash,
  })

  if (isLoading) {
    return (
      <div className="py-12 text-center font-mono text-sm text-muted">
        Loading transaction...
      </div>
    )
  }

  if (!tx?.txData) {
    return (
      <div className="py-12">
        <p className="font-mono text-sm text-accent mb-2">Transaction not found</p>
        <p className="font-mono text-xs text-muted break-all">{hash}</p>
      </div>
    )
  }

  const { txData, receipt, block } = tx
  const status = receipt?.status === 1 ? 'success' : receipt?.status === 0 ? 'failed' : 'pending'

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold italic mb-6">Transaction</h1>

      <div className="border border-ink divide-y divide-paper2">
        {[
          ['Hash', <span className="font-mono text-xs break-all">{hash}</span>],
          ['Status', (
            <span className={`badge ${status === 'success' ? 'border-live text-live' : status === 'failed' ? 'border-accent text-accent' : 'border-warn text-warn'}`}>
              {status.toUpperCase()}
            </span>
          )],
          ['Block', receipt?.blockNumber ? `#${receipt.blockNumber.toLocaleString()}` : '—'],
          ['Timestamp', block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : '—'],
          ['From', <span className="font-mono text-xs">{txData.from}</span>],
          ['To', <span className="font-mono text-xs">{txData.to}</span>],
          ['Value', `${ethers.formatEther(txData.value)} ETH`],
          ['Gas Used', receipt?.gasUsed?.toString() || '—'],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex gap-4 px-4 py-3">
            <span className="font-mono text-xs text-muted uppercase tracking-widest w-28 flex-shrink-0 pt-0.5">{label}</span>
            <span className="text-sm flex-1">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <a
          href={`${BASESCAN_URL}/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-accent2 underline"
        >
          View on Basescan ↗
        </a>
      </div>
    </div>
  )
}
