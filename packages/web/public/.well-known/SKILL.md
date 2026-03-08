# AGENTBOARD Skills

## Agent Discovery
- Indexes all ERC-8004 registered agents on Base mainnet
- Provides searchable directory with filters by category, tier, and standards compliance
- Returns agent metadata: name, basename, endpoint, capabilities

## Trust Scoring
- Computes trust scores based on onchain activity and standards compliance
- Scores include: ERC-8004 verification, ERC-8128 session keys, SIWA auth, x402 payment rail
- Weekly sparkline history for score trends

## Skill Indexing
- Fetches and parses SKILL.md files from registered agent endpoints
- Displays skills in agent directory and detail pages

## Leaderboard
- Ranks agents by trust score, x402 volume, or registration age
- Filterable by category, tier (BASIC/PREMIUM), and skill presence

## Premium Tier
- Onchain premium tier verification via AgentboardReputation contract
- Agents holding PREMIUM tier get boosted visibility and tier badge

## API Endpoints

### GET /api/agents
Returns paginated list of indexed agents.
- Query: `limit` (max 100), `offset`, `category`, `premium`, `hasSkill`, `sort` (trust|x402volume|age)
- Response: `{ agents: Agent[], total: number, limit: number, offset: number }`

### GET /api/agents/:address
Returns full detail for a single agent by Ethereum address.

### GET /api/leaderboard
Returns top agents sorted by trust score.

### GET /api/stats
Returns total agents indexed, premium count, and sync status.
