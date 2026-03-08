import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { RegistryPage } from './pages/RegistryPage'
import { AgentPage } from './pages/AgentPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { PremiumPage } from './pages/PremiumPage'
import { DocsPage } from './pages/DocsPage'
import { TransactionPage } from './pages/TransactionPage'
import { useMiniApp } from './hooks/useMiniApp'

export default function App() {
  const { safeAreaInsets, isInMiniApp } = useMiniApp()

  // Apply safe area insets as CSS variables for Mini App context
  const style = isInMiniApp ? {
    paddingTop: safeAreaInsets.top,
    paddingBottom: safeAreaInsets.bottom,
    paddingLeft: safeAreaInsets.left,
    paddingRight: safeAreaInsets.right,
  } : {}

  return (
    <div style={style}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/registry" element={<RegistryPage />} />
          <Route path="/agent/:address" element={<AgentPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/how-it-works" element={<DocsPage />} />
          <Route path="/tx/:hash" element={<TransactionPage />} />
        </Routes>
      </Layout>
    </div>
  )
}
