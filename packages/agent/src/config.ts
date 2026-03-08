import * as dotenv from 'dotenv'
dotenv.config()

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

export const config = {
  xmtp: {
    walletKey: process.env.XMTP_WALLET_KEY || '',
    dbEncryptionKey: process.env.XMTP_DB_ENCRYPTION_KEY || '',
    env: (process.env.XMTP_ENV || 'production') as 'production' | 'dev',
  },
  rpc: {
    url: process.env.RPC_URL || 'https://mainnet-preconf.base.org',
  },
  contracts: {
    agentboard: process.env.CONTRACT_ADDRESS || '',
    erc8004Registry: process.env.ERC8004_REGISTRY_ADDRESS || '',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  operator: {
    privateKey: process.env.OPERATOR_PRIVATE_KEY || '',
  },
  neynar: {
    apiKey: process.env.NEYNAR_API_KEY || '',
  },
  fees: {
    premiumUsdc: parseFloat(process.env.PREMIUM_FEE_USDC || '0.10'),
    reviewUsdc: parseFloat(process.env.REVIEW_FEE_USDC || '0.02'),
    analyticsUsdc: parseFloat(process.env.ANALYTICS_FEE_USDC || '0.05'),
    compareUsdc: parseFloat(process.env.COMPARE_FEE_USDC || '0.02'),
  },
  skill: {
    fetchTimeoutMs: parseInt(process.env.SKILL_FETCH_TIMEOUT_MS || '5000'),
    cacheTtlBasicHours: parseInt(process.env.SKILL_CACHE_TTL_BASIC_HOURS || '6'),
    cacheTtlPremiumMinutes: parseInt(process.env.SKILL_CACHE_TTL_PREMIUM_MINUTES || '30'),
  },
  port: parseInt(process.env.PORT || '3001'),
  corsOrigins: [
    process.env.WEB_URL || 'https://agentboard.vercel.app',
    'http://localhost:5173',
  ],
  basescanUrl: 'https://basescan.org',
  chainId: 8453,
}
