import { create } from 'zustand'
import { ethers } from 'ethers'

interface WalletStore {
  address: string | null
  signer: ethers.Signer | null
  chainId: number | null
  usdcBalance: string
  connect: () => Promise<void>
  disconnect: () => void
  refreshBalance: () => Promise<void>
}

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '8453')

const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

export const useWalletStore = create<WalletStore>((set, get) => ({
  address: null,
  signer: null,
  chainId: null,
  usdcBalance: '0',

  connect: async () => {
    if (!window.ethereum) throw new Error('No wallet detected')

    const provider = new ethers.BrowserProvider(window.ethereum as any)
    await provider.send('eth_requestAccounts', [])

    const network = await provider.getNetwork()
    if (Number(network.chainId) !== CHAIN_ID) {
      // Request switch to Base mainnet
      await provider.send('wallet_switchEthereumChain', [
        { chainId: '0x' + CHAIN_ID.toString(16) }
      ]).catch(() => {
        throw new Error('Please switch to Base mainnet (chain ID 8453)')
      })
    }

    const signer = await provider.getSigner()
    const address = await signer.getAddress()

    set({ address, signer, chainId: CHAIN_ID })
    await get().refreshBalance()
  },

  disconnect: () => {
    set({ address: null, signer: null, chainId: null, usdcBalance: '0' })
  },

  refreshBalance: async () => {
    const { signer, address } = get()
    if (!signer || !address) return
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer)
      const bal = await usdc.balanceOf(address)
      set({ usdcBalance: ethers.formatUnits(bal, 6) })
    } catch {
      // ignore
    }
  },
}))
