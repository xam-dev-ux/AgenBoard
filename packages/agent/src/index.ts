import { config } from './config'
import { createApiServer } from './api/index'
import { Indexer } from './indexer/index'
import { startXmtpAgent } from './xmtp/client'
import { store } from './indexer/store'
import { AgentEntry, AgentCategory } from '@agentboard/shared'

async function main() {
  console.log('╔═══════════════════════════════════════╗')
  console.log('║          AGENTBOARD AGENT             ║')
  console.log('║  Reputation layer for ERC-8004 on Base║')
  console.log('╚═══════════════════════════════════════╝')
  console.log()

  // Seed demo agents if registry not configured (dev mode)
  if (!config.contracts.erc8004Registry) {
    console.log('[Dev] No ERC-8004 registry configured, seeding demo agents...')
    seedDemoAgents()
  }

  // Start REST API
  const app = createApiServer()
  app.listen(config.port, () => {
    console.log(`[API] REST API listening on port ${config.port}`)
    console.log(`[API] Health check: http://localhost:${config.port}/api/stats`)
  })

  // Start indexer (only if registry configured)
  if (config.contracts.erc8004Registry) {
    const indexer = new Indexer()
    await indexer.start()
    console.log('[Indexer] Started')
  }

  // Start XMTP agent (only if wallet key configured)
  if (config.xmtp.walletKey && config.xmtp.walletKey !== 'undefined') {
    console.log('[XMTP] Starting agent...')
    startXmtpAgent().catch(e => console.error('[XMTP] Error:', e))
  } else {
    console.log('[XMTP] No wallet key configured, skipping XMTP agent')
  }

  // Weekly digest (Monday 9am UTC)
  scheduleWeeklyDigest()

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Agent] SIGTERM received, shutting down gracefully...')
    process.exit(0)
  })
}

function seedDemoAgents() {
  const demoAgents: AgentEntry[] = [
    {
      address: '0x1111111111111111111111111111111111111111',
      name: 'TrustTrader',
      basename: 'trusttrader.base.eth',
      endpoint: 'https://trusttrader.base.app',
      publicKey: '0x',
      registeredAt: Math.floor(Date.now() / 1000) - 90 * 86400,
      erc8004Verified: true,
      erc8128Active: true,
      siwaEnabled: true,
      x402Active: true,
      category: 'trading' as AgentCategory,
      description: 'Autonomous trading agent with ERC-8128 verification',
      skill: {
        raw: '# TrustTrader\n\nAutonomous trading agent for Base DeFi.\n\n## Authentication\nSign-In With Ethereum (SIWA)\n\n## Endpoints\n\nGET /api/quote\nGet a swap quote for any token pair.\ninputs: tokenIn, tokenOut, amount\noutput: quote object with price and slippage\n\nPOST /api/swap\nExecute a token swap.\ninputs: tokenIn, tokenOut, amount, slippage\noutput: transaction hash\npayment: 0.01 USDC via x402\nside effects: ERC-20 token transfer',
        appName: 'TrustTrader',
        description: 'Autonomous trading agent for Base DeFi protocols.',
        endpoints: [
          { method: 'GET', path: '/api/quote', description: 'Get swap quote', inputs: { tokenIn: 'input token address', tokenOut: 'output token address', amount: 'amount in wei' }, output: 'Quote object with price impact and route', payment: null, sideEffects: null },
          { method: 'POST', path: '/api/swap', description: 'Execute token swap', inputs: { tokenIn: 'input token', tokenOut: 'output token', amount: 'amount', slippage: 'max slippage bps' }, output: 'Transaction hash', payment: '0.01 USDC', sideEffects: 'ERC-20 token transfer on Base' },
        ],
        authentication: 'Sign-In With Ethereum (SIWA)',
        lastFetched: Date.now(),
        fetchStatus: 'ok',
      },
      reputation: { trustScore: 87, weeklyHistory: [80, 82, 83, 85, 86, 87, 87], uptimeLast7d: 98.5, x402VolumeUsdc: 42.30, erc8128VerificationRate: 95, totalInteractions: 312, positiveReviews: 28, negativeReviews: 3, lastUpdated: Date.now() },
      tier: 'premium',
    },
    {
      address: '0x2222222222222222222222222222222222222222',
      name: 'OracleMax',
      basename: 'oraclemax.base.eth',
      endpoint: 'https://oraclemax.base.app',
      publicKey: '0x',
      registeredAt: Math.floor(Date.now() / 1000) - 60 * 86400,
      erc8004Verified: true,
      erc8128Active: true,
      siwaEnabled: false,
      x402Active: true,
      category: 'oracle' as AgentCategory,
      description: 'Real-time price oracle for Base assets',
      skill: {
        raw: '# OracleMax\n\nHigh-frequency price feeds for Base.\n\n## Authentication\nAPI key via x-api-key header\n\n## Endpoints\n\nGET /api/price\nGet current price for any Base token.\ninputs: token (address or symbol), currency (USD default)\noutput: price in USD with 6 decimals\n\nGET /api/history\nGet OHLCV price history.\ninputs: token, interval (1m/5m/1h/1d), limit\noutput: array of OHLCV candles\npayment: 0.001 USDC per request via x402',
        appName: 'OracleMax',
        description: 'High-frequency price oracle and data feeds for Base mainnet assets.',
        endpoints: [
          { method: 'GET', path: '/api/price', description: 'Get current token price', inputs: { token: 'token address or symbol', currency: 'quote currency (default: USD)' }, output: 'Price with 6 decimals and timestamp', payment: null, sideEffects: null },
          { method: 'GET', path: '/api/history', description: 'Get OHLCV price history', inputs: { token: 'token address', interval: '1m | 5m | 1h | 1d', limit: 'number of candles (max 1000)' }, output: 'Array of OHLCV candles', payment: '0.001 USDC per request', sideEffects: null },
        ],
        authentication: 'API key via x-api-key header',
        lastFetched: Date.now(),
        fetchStatus: 'ok',
      },
      reputation: { trustScore: 91, weeklyHistory: [88, 89, 90, 90, 91, 91, 91], uptimeLast7d: 99.9, x402VolumeUsdc: 78.50, erc8128VerificationRate: 100, totalInteractions: 891, positiveReviews: 45, negativeReviews: 1, lastUpdated: Date.now() },
      tier: 'premium',
    },
    {
      address: '0x3333333333333333333333333333333333333333',
      name: 'PayRouter',
      basename: 'payrouter.base.eth',
      endpoint: 'https://payrouter.base.app',
      publicKey: '0x',
      registeredAt: Math.floor(Date.now() / 1000) - 30 * 86400,
      erc8004Verified: true,
      erc8128Active: false,
      siwaEnabled: true,
      x402Active: true,
      category: 'payment' as AgentCategory,
      description: 'Smart payment routing across Base protocols',
      skill: null,
      reputation: { trustScore: 72, weeklyHistory: [65, 67, 68, 70, 71, 72, 72], uptimeLast7d: 94.2, x402VolumeUsdc: 15.80, erc8128VerificationRate: 0, totalInteractions: 156, positiveReviews: 12, negativeReviews: 2, lastUpdated: Date.now() },
      tier: 'basic',
    },
    {
      address: '0x4444444444444444444444444444444444444444',
      name: 'EscrowBot',
      basename: 'escrowbot.base.eth',
      endpoint: 'https://escrowbot.base.app',
      publicKey: '0x',
      registeredAt: Math.floor(Date.now() / 1000) - 45 * 86400,
      erc8004Verified: true,
      erc8128Active: true,
      siwaEnabled: false,
      x402Active: false,
      category: 'escrow' as AgentCategory,
      description: 'Trustless escrow and dispute resolution on Base',
      skill: {
        raw: '# EscrowBot\n\nTrustless escrow for peer-to-peer transactions on Base.\n\n## Authentication\nSign-In With Ethereum (SIWA)\n\n## Endpoints\n\nPOST /api/create\nCreate a new escrow.\ninputs: buyer, seller, amount, token, deadline\noutput: escrow ID and contract address\nside effects: token transfer to escrow contract\n\nPOST /api/release\nRelease funds to seller.\ninputs: escrowId\noutput: transaction hash\nside effects: token transfer to seller\n\nPOST /api/dispute\nOpen a dispute for an escrow.\ninputs: escrowId, reason\noutput: dispute ID',
        appName: 'EscrowBot',
        description: 'Trustless escrow and dispute resolution for peer-to-peer transactions on Base.',
        endpoints: [
          { method: 'POST', path: '/api/create', description: 'Create new escrow', inputs: { buyer: 'buyer address', seller: 'seller address', amount: 'amount in wei', token: 'ERC-20 token address', deadline: 'Unix timestamp' }, output: 'escrowId and escrow contract address', payment: null, sideEffects: 'Token transfer to escrow contract' },
          { method: 'POST', path: '/api/release', description: 'Release funds to seller', inputs: { escrowId: 'escrow identifier' }, output: 'transaction hash', payment: null, sideEffects: 'Token transfer to seller address' },
          { method: 'POST', path: '/api/dispute', description: 'Open a dispute', inputs: { escrowId: 'escrow identifier', reason: 'dispute reason text' }, output: 'disputeId', payment: null, sideEffects: null },
        ],
        authentication: 'Sign-In With Ethereum (SIWA)',
        lastFetched: Date.now(),
        fetchStatus: 'ok',
      },
      reputation: { trustScore: 78, weeklyHistory: [72, 74, 75, 76, 77, 78, 78], uptimeLast7d: 97.1, x402VolumeUsdc: 8.40, erc8128VerificationRate: 88, totalInteractions: 89, positiveReviews: 18, negativeReviews: 1, lastUpdated: Date.now() },
      tier: 'basic',
    },
    {
      address: '0x5555555555555555555555555555555555555555',
      name: 'SocialGraph',
      basename: 'socialgraph.base.eth',
      endpoint: 'https://socialgraph.base.app',
      publicKey: '0x',
      registeredAt: Math.floor(Date.now() / 1000) - 15 * 86400,
      erc8004Verified: true,
      erc8128Active: false,
      siwaEnabled: true,
      x402Active: false,
      category: 'social' as AgentCategory,
      description: 'Onchain social graph analytics for Base',
      skill: null,
      reputation: { trustScore: 61, weeklyHistory: [55, 57, 58, 59, 60, 61, 61], uptimeLast7d: 89.5, x402VolumeUsdc: 2.10, erc8128VerificationRate: 0, totalInteractions: 43, positiveReviews: 5, negativeReviews: 0, lastUpdated: Date.now() },
      tier: 'basic',
    },
  ]

  for (const agent of demoAgents) {
    store.upsertAgent(agent)
  }

  console.log(`[Dev] Seeded ${demoAgents.length} demo agents`)
}

function scheduleWeeklyDigest() {
  const now = new Date()
  const nextMonday = new Date(now)
  nextMonday.setUTCHours(9, 0, 0, 0)
  const day = now.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)

  const msUntilMonday = nextMonday.getTime() - now.getTime()
  setTimeout(() => {
    sendWeeklyDigest()
    setInterval(sendWeeklyDigest, 7 * 24 * 60 * 60 * 1000)
  }, msUntilMonday)
}

async function sendWeeklyDigest() {
  const top3 = store.getLeaderboard(3)
  const stats = store.getStats()
  console.log('[Digest] Weekly digest:')
  console.log(`  Top 3: ${top3.map(a => a.name).join(', ')}`)
  console.log(`  Total agents: ${stats.totalAgents}`)
  console.log(`  With SKILL.md: ${stats.agentsWithSkillFile}`)
  // In production: post to Farcaster via Neynar
}

main().catch(e => {
  console.error('[Agent] Fatal error:', e)
  process.exit(1)
})
