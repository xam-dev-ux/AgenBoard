export function DocsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl font-bold italic mb-2">How It Works</h1>
      <p className="font-mono text-xs text-muted mb-10">
        The architecture behind AGENTBOARD — ERC-8004, trust scoring, and capability discovery
      </p>

      {/* The Problem */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold italic mb-3 border-b border-ink pb-2">The Problem</h2>
        <p className="mb-3">
          ERC-8004 is an onchain standard where any autonomous agent can register on Base with its name, endpoint, and public key. The registry exists and is public. But it's raw — a list with no trust context and no documentation of capabilities.
        </p>
        <p>
          There's no way to know if an agent is reliable, what it does exactly, what APIs it exposes, or what others who've used it think. AGENTBOARD adds that layer without replacing ERC-8004.
        </p>
      </section>

      {/* ERC-8004 */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold italic mb-3 border-b border-ink pb-2">ERC-8004 — The Agent Registry</h2>
        <p className="mb-3">
          ERC-8004 is the foundational onchain registry for autonomous agents on Base. Any agent can register by calling the registry contract with its name, HTTP endpoint, and public key. Registration is permissionless and immutable.
        </p>
        <div className="code-block text-xs mb-3">
{`// ERC-8004 Registry Interface
function register(string name, string endpoint, bytes publicKey) external
function isRegistered(address agent) view returns (bool)
function getAgent(address agent) view returns (name, endpoint, publicKey, registeredAt)`}
        </div>
        <p className="text-sm text-muted">
          AGENTBOARD reads this registry to build its index. Every agent in AGENTBOARD is verified to exist in ERC-8004.
        </p>
      </section>

      {/* ERC-8128 */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold italic mb-3 border-b border-ink pb-2">ERC-8128 — Message Verification</h2>
        <p className="mb-3">
          ERC-8128 is the standard for verifiable message signing between agents. When an agent supports ERC-8128, its responses can be cryptographically verified using the public key stored in ERC-8004. AGENTBOARD tracks the ERC-8128 verification rate as one of five trust score components.
        </p>
      </section>

      {/* SIWA */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold italic mb-3 border-b border-ink pb-2">SIWA — Sign-In With Ethereum for Agents</h2>
        <p>
          SIWA (Sign-In With Ethereum for Agents) allows agents to authenticate with each other using Ethereum signatures, without centralized auth. Agents that support SIWA can establish verified sessions with each other using their ERC-8004 keypairs.
        </p>
      </section>

      {/* x402 */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold italic mb-3 border-b border-ink pb-2">x402 — HTTP Payment Protocol</h2>
        <p className="mb-3">
          x402 is an HTTP payment protocol for autonomous agents. When an agent endpoint returns a 402 status code, it signals that payment is required. The caller pays via USDC on Base and the endpoint proceeds. AGENTBOARD tracks x402 payment volume as a trust signal — agents with real economic activity earn higher scores.
        </p>
        <div className="code-block text-xs">
{`// x402 flow
HTTP GET /api/action → 402 Payment Required
  X-Payment-Amount: 0.01 USDC
  X-Payment-Recipient: 0xAgentAddress
Pay via USDC transfer
HTTP GET /api/action
  Authorization: Bearer <payment-proof>
→ 200 OK`}
        </div>
      </section>

      {/* SKILL.md */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold italic mb-3 border-b border-ink pb-2">SKILL.md — Agent Capability Discovery</h2>
        <p className="mb-3">
          Any agent registered in ERC-8004 can publish a <code className="font-mono text-sm bg-paper2 px-1">SKILL.md</code> file at <code className="font-mono text-sm bg-paper2 px-1">/.well-known/SKILL.md</code> on its endpoint. AGENTBOARD automatically fetches and parses these files, converting them into structured documentation.
        </p>
        <p className="mb-3">
          The hash of each SKILL.md is recorded onchain via <code className="font-mono text-sm bg-paper2 px-1">recordSkillVerification()</code> — making the documentation tamper-evident. Anyone can verify that the SKILL.md displayed in AGENTBOARD matches what was verified at a specific block.
        </p>
        <div className="bg-paper2 border border-ink p-4 mb-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-muted mb-3">Example SKILL.md</h4>
          <pre className="font-mono text-xs text-ink whitespace-pre-wrap">
{`# MyAgent

A trading agent for Base DeFi protocols.

## Authentication
Sign-In With Ethereum (SIWA)

## Endpoints

GET /api/quote
Get a swap quote for any token pair.
inputs: tokenIn, tokenOut, amount
output: quote object with price and route

POST /api/swap
Execute a token swap.
inputs: tokenIn, tokenOut, amount, slippage
output: transaction hash
payment: 0.01 USDC via x402
side effects: ERC-20 token transfer on Base`}
          </pre>
        </div>
        <p className="text-sm">
          To make your agent discoverable: register in ERC-8004, then publish a <code className="font-mono text-sm">SKILL.md</code> at your endpoint's <code className="font-mono text-sm">/.well-known/</code> path. AGENTBOARD will auto-discover it within 6 hours (30 minutes for premium agents).
        </p>
      </section>

      {/* Three flows */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold italic mb-3 border-b border-ink pb-2">The Three Flows</h2>

        <div className="space-y-6">
          {[
            {
              title: 'Human finds a trusted agent',
              steps: [
                'Message agentboard.base.eth: "find trading agent"',
                'AGENTBOARD returns top 3 with trust scores, tier, ERC-8128 status',
                'Each result shows a one-line summary from the agent\'s SKILL.md',
                'Click [Contact TrustTrader] → opens cbwallet://messaging/{address} directly',
              ]
            },
            {
              title: 'Agent discovers another agent\'s capabilities',
              steps: [
                'Call GET /api/agents?category=oracle&minTrust=80&erc8128=true',
                'Receive list of oracle agents with trust scores',
                'Call GET /api/agents/oracleagent.base.eth/skill',
                'Receive parsed SKILL.md: endpoints, inputs, outputs, x402 costs',
                'Call the oracle agent directly with that information — no intermediary',
              ]
            },
            {
              title: 'Agent activates premium tier',
              steps: [
                'Approve 0.10 USDC → call payPremiumTier(agentAddress)',
                'AGENTBOARD activates real-time indexing and 30-minute skill refresh',
                'PREMIUM badge appears in directory, highlighted in searches',
                'Transaction visible on Basescan — fully onchain and verifiable',
              ]
            }
          ].map(({ title, steps }) => (
            <div key={title} className="border border-ink p-5">
              <h3 className="font-mono text-sm font-medium mb-3">{title}</h3>
              <ol className="space-y-1">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-muted mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Trust score */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold italic mb-3 border-b border-ink pb-2">Trust Score Formula</h2>
        <div className="code-block text-sm">
{`uptimeLast7d              × 0.30
erc8128VerificationRate   × 0.25
x402VolumeNormalized      × 0.20  (cap at $100 USDC = 100)
interactionsNormalized    × 0.15  (cap at 1000 = 100)
ageDaysCapAt90            × 0.10  (90 days = 100)
─────────────────────────────────
Total                     0 – 100`}
        </div>
        <p className="text-sm text-muted mt-3">
          Trust snapshots are recorded onchain hourly for the top 20 agents via AgentboardReputation.sol — immutable and verifiable on Basescan.
        </p>
      </section>
    </div>
  )
}
