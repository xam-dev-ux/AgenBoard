import { useState } from 'react'
import { AgentSkill } from '@agentboard/shared'
import { SkillEndpointCard } from './SkillEndpointCard'
import { RawSkillModal } from './RawSkillModal'

const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || 'https://basescan.org'

interface Props {
  skill: AgentSkill
  agentEndpoint?: string
  skillFileHash?: string
}

export function SkillViewer({ skill, agentEndpoint, skillFileHash }: Props) {
  const [showRaw, setShowRaw] = useState(false)

  if (skill.fetchStatus === 'no-skill-file') {
    return (
      <div className="border border-paper2 p-6">
        <p className="font-mono text-sm text-muted mb-2">
          No SKILL.md found at{' '}
          <code className="text-ink">{agentEndpoint}/.well-known/SKILL.md</code>
        </p>
        <p className="text-sm text-muted mb-3">
          This agent hasn't published a SKILL.md yet. The Base Agent App Framework defines a standard for agents to document their capabilities so both humans and other agents can discover how to interact with them.
        </p>
        <a
          href="https://docs.base.org/builderkits/agent-app-framework"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-accent2 underline"
        >
          Learn about SKILL.md →
        </a>
      </div>
    )
  }

  if (skill.fetchStatus === 'unreachable') {
    return (
      <div className="border border-paper2 p-6">
        <p className="font-mono text-sm text-accent mb-1">Agent endpoint unreachable</p>
        <p className="font-mono text-xs text-muted">
          Last successful fetch: {skill.lastFetched ? new Date(skill.lastFetched).toISOString() : 'never'}
        </p>
      </div>
    )
  }

  if (skill.fetchStatus === 'parse-error') {
    return (
      <div className="border border-paper2 p-6">
        <p className="font-mono text-sm text-warn mb-3">SKILL.md found but could not be fully parsed</p>
        <div className="code-block text-xs max-h-48 overflow-y-auto">{skill.raw}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Description */}
      <p className="text-base leading-relaxed mb-6">{skill.description}</p>

      {/* Endpoints */}
      {skill.endpoints.length > 0 && (
        <div className="mb-6">
          <h4 className="font-mono text-xs uppercase tracking-widest text-muted mb-3 border-b border-paper2 pb-2">
            Endpoints ({skill.endpoints.length})
          </h4>
          {skill.endpoints.map((ep, i) => (
            <SkillEndpointCard key={i} endpoint={ep} />
          ))}
        </div>
      )}

      {/* Authentication */}
      {skill.authentication && skill.authentication !== 'None specified' && (
        <div className="mb-6">
          <h4 className="font-mono text-xs uppercase tracking-widest text-muted mb-2">Authentication</h4>
          <p className="font-mono text-sm bg-paper2 px-3 py-2">{skill.authentication}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap gap-4 items-center pt-4 border-t border-paper2">
        <button
          onClick={() => setShowRaw(true)}
          className="font-mono text-xs border border-muted text-muted px-3 py-1 hover:border-ink hover:text-ink transition-colors"
        >
          View raw SKILL.md
        </button>

        {agentEndpoint && (
          <a
            href={`${agentEndpoint}/.well-known/SKILL.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-accent2 underline"
          >
            {agentEndpoint}/.well-known/SKILL.md
          </a>
        )}

        <span className="font-mono text-xs text-muted ml-auto">
          fetched {new Date(skill.lastFetched).toLocaleDateString()}
          {skillFileHash && (
            <>
              {' · '}
              <a
                href={`${BASESCAN_URL}/search?q=${skillFileHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent2 underline"
              >
                verify onchain
              </a>
            </>
          )}
        </span>
      </div>

      {showRaw && <RawSkillModal raw={skill.raw} onClose={() => setShowRaw(false)} />}
    </div>
  )
}
