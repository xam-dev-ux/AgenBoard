import { Link, useLocation } from 'react-router-dom'
import { WalletButton } from './WalletButton'
import { TransactionModal } from './TransactionModal'
import { useStats } from '../hooks/useAgents'
import { useMiniApp } from '../hooks/useMiniApp'

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { data: stats } = useStats()
  const { isInMiniApp, user } = useMiniApp()

  const navLinks = [
    { to: '/registry', label: 'Directory' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/premium', label: 'Premium' },
    { to: '/how-it-works', label: 'How it works' },
  ]

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Top bar */}
      <div className="border-b border-ink bg-ink text-paper">
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
          <div className="font-mono text-xs text-paper/60 flex gap-4">
            {stats && (
              <>
                <span>{stats.totalAgents} agents</span>
                <span>·</span>
                <span>{stats.agentsWithSkillFile} with SKILL.md</span>
                <span>·</span>
                <span className="text-live">block #{stats.lastBlock.toLocaleString()}</span>
              </>
            )}
          </div>
          <div className="font-mono text-xs text-paper/60">
            {isInMiniApp && user ? (
              <span className="flex items-center gap-1.5">
                {user.pfpUrl && (
                  <img src={user.pfpUrl} alt="" className="w-4 h-4 rounded-full" />
                )}
                @{user.username || `fid:${user.fid}`}
              </span>
            ) : (
              'Base mainnet · ERC-8004'
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-ink">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-bold italic tracking-tight hover:text-accent transition-colors">
            AGENTBOARD
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`font-mono text-xs uppercase tracking-widest hover:text-accent transition-colors ${location.pathname.startsWith(to) ? 'text-accent' : 'text-muted'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          {/* In Mini App context, wallet connect is handled by the host */}
          {!isInMiniApp && <WalletButton />}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer — compact in Mini App */}
      {!isInMiniApp && (
        <footer className="border-t border-ink mt-16">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
            <div className="font-mono text-xs text-muted">
              AGENTBOARD — The reputation layer for ERC-8004 agents on Base
            </div>
            <div className="flex gap-4 font-mono text-xs text-muted">
              <a href={`${import.meta.env.VITE_BASESCAN_URL}/address/${import.meta.env.VITE_CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                Contract
              </a>
              <Link to="/how-it-works" className="hover:text-ink">Docs</Link>
            </div>
          </div>
        </footer>
      )}

      <TransactionModal />
    </div>
  )
}
