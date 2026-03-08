import { AgentSkill } from '@agentboard/shared'

interface Props {
  skill: AgentSkill | null
}

export function SkillBadge({ skill }: Props) {
  if (skill?.fetchStatus === 'ok') {
    return (
      <span className="badge border-live text-live bg-live/10">
        📄 {skill.endpoints.length} endpoints
      </span>
    )
  }
  return (
    <span className="badge border-muted text-muted">
      no SKILL.md
    </span>
  )
}
