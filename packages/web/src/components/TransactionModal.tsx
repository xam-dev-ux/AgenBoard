import { motion, AnimatePresence } from 'framer-motion'
import { useTxStore } from '../stores/tx'

const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || 'https://basescan.org'

export function TransactionModal() {
  const { status, txHash, blockNumber, error, reset } = useTxStore()

  if (status === 'idle') return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-paper border border-ink max-w-md w-full p-6"
        >
          {status === 'pending' && (
            <div className="text-center">
              <div className="font-mono text-sm text-muted mb-2">PROCESSING</div>
              <div className="w-8 h-8 border-2 border-ink border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-xs text-muted mt-3">Waiting for wallet confirmation...</p>
            </div>
          )}

          {status === 'confirming' && (
            <div className="text-center">
              <div className="font-mono text-sm text-muted mb-2">CONFIRMING</div>
              <div className="w-8 h-8 border-2 border-accent2 border-t-transparent rounded-full animate-spin mx-auto" />
              {txHash && (
                <p className="font-mono text-xs mt-3 break-all">
                  <a
                    href={`${BASESCAN_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent2 underline"
                  >
                    {txHash.slice(0, 18)}...{txHash.slice(-8)}
                  </a>
                </p>
              )}
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="font-mono text-sm text-live mb-2">✓ RECORDED ON BASE MAINNET</div>
              {txHash && (
                <p className="font-mono text-xs mb-1">
                  tx: <a
                    href={`${BASESCAN_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent2 underline"
                  >
                    {txHash.slice(0, 18)}...
                  </a>
                </p>
              )}
              {blockNumber && (
                <p className="font-mono text-xs text-muted mb-4">block: #{blockNumber}</p>
              )}
              <button
                onClick={reset}
                className="font-mono text-sm border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="font-mono text-sm text-accent mb-2">TRANSACTION FAILED</div>
              <p className="font-mono text-xs text-muted mb-4 break-all">{error}</p>
              <button
                onClick={reset}
                className="font-mono text-sm border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-paper transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
