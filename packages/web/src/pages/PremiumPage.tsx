import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFees, useAgent } from '../hooks/useAgents'
import { useWalletStore } from '../stores/wallet'
import { useContractWrite } from '../hooks/useContractWrite'
import { useTxStore } from '../stores/tx'

export function PremiumPage() {
  const [basename, setBasename] = useState('')
  const { data: fees } = useFees()
  const { address, connect } = useWalletStore()
  const { payPremium } = useContractWrite()
  const { status } = useTxStore()
  const navigate = useNavigate()

  // Lookup agent
  const { data: agent } = useAgent(basename || undefined)

  useEffect(() => {
    if (status === 'success' && agent) {
      setTimeout(() => navigate(`/agent/${agent.basename}`), 2000)
    }
  }, [status, agent, navigate])

  async function handleActivate() {
    if (!agent) return
    await payPremium(agent.address, fees?.premiumTier || 0.10)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl font-bold italic mb-2">Activate Premium Tier</h1>
      <p className="font-mono text-xs text-muted mb-8">
        {fees ? `${fees.premiumTier} USDC` : '0.10 USDC'} per 30 days · Paid onchain via USDC on Base
      </p>

      {/* Benefits */}
      <div className="border border-ink p-6 mb-8">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Premium Benefits</h2>
        <ul className="space-y-2">
          {[
            ['Trust score updated every 10 minutes', 'vs hourly for basic'],
            ['SKILL.md refreshed every 30 minutes', 'vs every 6 hours'],
            ['Real-time scoring via Flashblocks', 'mainnet-preconf.base.org'],
            ['PREMIUM badge in directory', 'highlighted in search results'],
            ['Full analytics visible to all users', 'complete trust breakdown public'],
          ].map(([benefit, detail]) => (
            <li key={benefit} className="flex items-start gap-3">
              <span className="text-live font-mono text-sm mt-0.5">✓</span>
              <div>
                <span className="text-sm font-medium">{benefit}</span>
                <span className="font-mono text-xs text-muted ml-2">{detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Activation form */}
      <div className="border border-ink p-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">Activate for Agent</h2>

        <div className="mb-4">
          <label className="font-mono text-xs text-muted uppercase tracking-widest mb-1 block">
            Agent Basename
          </label>
          <input
            type="text"
            placeholder="youragent.base.eth"
            value={basename}
            onChange={e => setBasename(e.target.value)}
            className="w-full border border-ink px-3 py-2 font-mono text-sm bg-paper focus:outline-none focus:border-accent2"
          />
        </div>

        {agent && (
          <div className="bg-paper2 border border-paper2 px-4 py-3 mb-4 font-mono text-sm">
            <span className="text-live">✓</span> Found: <strong>{agent.name}</strong>
            {' '}· {agent.address.slice(0, 8)}...
            {agent.tier === 'premium' && (
              <span className="ml-2 text-warn">Already premium</span>
            )}
          </div>
        )}

        {basename && !agent && (
          <div className="bg-paper2 border border-paper2 px-4 py-3 mb-4 font-mono text-xs text-muted">
            Agent not found in ERC-8004 registry
          </div>
        )}

        <div className="flex gap-3">
          {!address ? (
            <button
              onClick={() => connect().catch(e => alert(e.message))}
              className="font-mono text-sm border-2 border-ink px-6 py-2 hover:bg-ink hover:text-paper transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={handleActivate}
              disabled={!agent || agent.tier === 'premium' || status === 'pending' || status === 'confirming'}
              className="font-mono text-sm border-2 border-accent text-accent px-6 py-2 hover:bg-accent hover:text-paper transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'pending' ? 'Approving USDC...' :
               status === 'confirming' ? 'Confirming...' :
               `Pay ${fees?.premiumTier || 0.10} USDC → Activate Premium`}
            </button>
          )}
        </div>

        <p className="font-mono text-xs text-muted mt-3">
          Payment is processed onchain via AgentboardReputation.sol. Transaction visible on Basescan.
        </p>
      </div>
    </div>
  )
}
