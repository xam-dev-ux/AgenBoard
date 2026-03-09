import { ethers } from 'ethers'
import { Attribution } from 'ox/erc8021'
import { useWalletStore } from '../stores/wallet'
import { useTxStore } from '../stores/tx'

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''

// ERC-8021 builder code suffix — appended to all txs for Base attribution
const BUILDER_SUFFIX = Attribution.toDataSuffix({ codes: ['bc_0fyeljum'] })

const USDC_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]

const AGENTBOARD_ABI = [
  'function payPremiumTier(address agent) external',
  'function submitReview(address agent, bool positive, bytes32 commentHash, bytes32 proofTxHash) external',
  'function queryAgentAnalytics(address agent) external',
  'function compareAgents(address agentA, address agentB) external',
]

// Send a contract call with the ERC-8021 builder code suffix appended to calldata
async function sendWithSuffix(
  signer: ethers.Signer,
  contract: ethers.Contract,
  method: string,
  args: unknown[]
): Promise<ethers.TransactionResponse> {
  const calldata = contract.interface.encodeFunctionData(method, args)
  const dataWithSuffix = calldata + BUILDER_SUFFIX.slice(2) // strip 0x from suffix
  return signer.sendTransaction({
    to: await contract.getAddress(),
    data: dataWithSuffix,
  })
}

export function useContractWrite() {
  const { signer } = useWalletStore()
  const { setPending, setConfirming, setSuccess, setError } = useTxStore()

  async function approveAndCall(
    amountUsdc: number,
    method: string,
    args: unknown[]
  ) {
    if (!signer) throw new Error('Wallet not connected')

    setPending()

    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer)
      const agentboard = new ethers.Contract(CONTRACT_ADDRESS, AGENTBOARD_ABI, signer)
      const amountWei = ethers.parseUnits(String(amountUsdc), 6)

      // Check allowance
      const address = await signer.getAddress()
      const allowance = await usdc.allowance(address, CONTRACT_ADDRESS)
      if (allowance < amountWei) {
        const approveTx = await usdc.approve(CONTRACT_ADDRESS, ethers.MaxUint256)
        await approveTx.wait()
      }

      const tx = await sendWithSuffix(signer, agentboard, method, args)
      setConfirming(tx.hash)

      const receipt = await tx.wait()
      setSuccess(tx.hash, receipt?.blockNumber || 0)

      return receipt
    } catch (e: any) {
      setError(e.message || 'Transaction failed')
      throw e
    }
  }

  return {
    payPremium: (agentAddress: string, feeUsdc: number) =>
      approveAndCall(feeUsdc, 'payPremiumTier', [agentAddress]),

    submitReview: (
      agentAddress: string,
      positive: boolean,
      commentHash: string,
      proofTxHash: string,
      feeUsdc: number
    ) =>
      approveAndCall(feeUsdc, 'submitReview', [agentAddress, positive, commentHash, proofTxHash]),

    queryAnalytics: (agentAddress: string, feeUsdc: number) =>
      approveAndCall(feeUsdc, 'queryAgentAnalytics', [agentAddress]),

    compareAgents: (agentA: string, agentB: string, feeUsdc: number) =>
      approveAndCall(feeUsdc, 'compareAgents', [agentA, agentB]),
  }
}
