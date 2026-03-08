import express from 'express'
import cors from 'cors'
import { store } from '../indexer/store'
import { fetchAgentSkill } from '../skill/fetcher'
import { AgentCategory } from '@agentboard/shared'
import { config } from '../config'

const CACHE_SECONDS = 10

function withCache(res: express.Response) {
  res.setHeader('Cache-Control', `public, max-age=${CACHE_SECONDS}`)
  return res
}

export function createApiServer() {
  const app = express()

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true) // curl / server-to-server
      const allowed = config.corsOrigins.some(o => origin === o) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        origin === 'http://localhost:5173'
      cb(null, allowed)
    },
    methods: ['GET'],
  }))

  app.use(express.json())

  // Health check
  app.get('/api/stats', (req, res) => {
    withCache(res).json(store.getStats())
  })

  // List agents with optional filters
  app.get('/api/agents', (req, res) => {
    const { category, minTrust, erc8128, tier, hasSkill } = req.query
    const agents = store.getFilteredAgents({
      category: category as AgentCategory | undefined,
      minTrust: minTrust ? parseFloat(minTrust as string) : undefined,
      erc8128: erc8128 !== undefined ? erc8128 === 'true' : undefined,
      tier: tier as 'basic' | 'premium' | undefined,
      hasSkill: hasSkill !== undefined ? hasSkill === 'true' : undefined,
    })
    withCache(res).json(agents)
  })

  // Get single agent
  app.get('/api/agents/:basename', (req, res) => {
    const agent = store.getAgent(req.params.basename)
    if (!agent) return res.status(404).json({ error: 'Agent not found' })
    withCache(res).json(agent)
  })

  // Get agent skill (parsed SKILL.md)
  app.get('/api/agents/:basename/skill', async (req, res) => {
    const agent = store.getAgent(req.params.basename)
    if (!agent) return res.status(404).json({ error: 'Agent not found' })

    // Refresh if stale
    if (agent.endpoint) {
      const skill = await fetchAgentSkill(agent.address, agent.endpoint, agent.tier === 'premium')
      agent.skill = skill
      store.upsertAgent(agent)
    }

    if (!agent.skill) {
      return res.status(404).json({
        error: 'no-skill-file',
        endpoint: agent.endpoint,
        message: `No SKILL.md found at ${agent.endpoint}/.well-known/SKILL.md`,
      })
    }

    withCache(res).json(agent.skill)
  })

  // Get raw SKILL.md
  app.get('/api/agents/:basename/skill/raw', async (req, res) => {
    const agent = store.getAgent(req.params.basename)
    if (!agent) return res.status(404).json({ error: 'Agent not found' })
    if (!agent.skill?.raw) {
      return res.status(404).json({
        error: 'no-skill-file',
        fetchStatus: agent.skill?.fetchStatus || 'no-skill-file',
      })
    }
    res.setHeader('Content-Type', 'text/markdown')
    withCache(res).send(agent.skill.raw)
  })

  // Trust history (mock — real data would come from contract events)
  app.get('/api/agents/:basename/trust-history', (req, res) => {
    const agent = store.getAgent(req.params.basename)
    if (!agent) return res.status(404).json({ error: 'Agent not found' })
    withCache(res).json({
      agent: agent.basename,
      history: agent.reputation.weeklyHistory.map((score, i) => ({
        score,
        timestamp: Date.now() - (6 - i) * 86400 * 1000,
        day: i,
      })),
    })
  })

  // Reviews (stub — production reads from contract events)
  app.get('/api/agents/:basename/reviews', (req, res) => {
    const agent = store.getAgent(req.params.basename)
    if (!agent) return res.status(404).json({ error: 'Agent not found' })
    withCache(res).json({
      agent: agent.basename,
      positive: agent.reputation.positiveReviews,
      negative: agent.reputation.negativeReviews,
      reviews: [],
    })
  })

  // Leaderboard
  app.get('/api/leaderboard', (req, res) => {
    const limit = parseInt((req.query.limit as string) || '10')
    withCache(res).json(store.getLeaderboard(Math.min(limit, 50)))
  })

  // Fees
  app.get('/api/fees', (req, res) => {
    withCache(res).json({
      premiumTier: config.fees.premiumUsdc,
      review: config.fees.reviewUsdc,
      analytics: config.fees.analyticsUsdc,
      compare: config.fees.compareUsdc,
    })
  })

  return app
}
