import { create } from 'zustand'

type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

interface TxStore {
  status: TxStatus
  txHash: string | null
  blockNumber: number | null
  error: string | null
  setPending: () => void
  setConfirming: (txHash: string) => void
  setSuccess: (txHash: string, blockNumber: number) => void
  setError: (error: string) => void
  reset: () => void
}

export const useTxStore = create<TxStore>((set) => ({
  status: 'idle',
  txHash: null,
  blockNumber: null,
  error: null,

  setPending: () => set({ status: 'pending', txHash: null, blockNumber: null, error: null }),
  setConfirming: (txHash) => set({ status: 'confirming', txHash }),
  setSuccess: (txHash, blockNumber) => set({ status: 'success', txHash, blockNumber }),
  setError: (error) => set({ status: 'error', error }),
  reset: () => set({ status: 'idle', txHash: null, blockNumber: null, error: null }),
}))
