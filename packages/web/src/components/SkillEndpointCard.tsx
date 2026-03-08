import { SkillEndpoint } from '@agentboard/shared'

interface Props {
  endpoint: SkillEndpoint
}

function MethodBadge({ method }: { method: string }) {
  const cls = `method-${method.toLowerCase()}` as string
  return <span className={`badge ${cls} text-xs`}>{method}</span>
}

export function SkillEndpointCard({ endpoint }: Props) {
  return (
    <div className="border border-ink p-4 mb-3">
      <div className="flex items-center gap-3 mb-2">
        <MethodBadge method={endpoint.method} />
        <code className="font-mono text-sm font-medium">{endpoint.path}</code>
      </div>

      {endpoint.description && (
        <p className="text-sm mb-3">{endpoint.description}</p>
      )}

      {Object.keys(endpoint.inputs).length > 0 && (
        <div className="mb-3">
          <div className="font-mono text-xs uppercase tracking-widest text-muted mb-1">Inputs</div>
          <table className="w-full text-xs font-mono">
            <tbody>
              {Object.entries(endpoint.inputs).map(([key, desc]) => (
                <tr key={key} className="border-b border-paper2">
                  <td className="py-1 pr-3 text-accent2 whitespace-nowrap">{key}</td>
                  <td className="py-1 text-muted">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {endpoint.output && (
        <div className="mb-2">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">Returns: </span>
          <span className="font-mono text-xs">{endpoint.output}</span>
        </div>
      )}

      {endpoint.payment && (
        <div className="bg-warn/10 border border-warn/30 px-3 py-1.5 mb-2">
          <span className="font-mono text-xs text-warn">💰 {endpoint.payment}</span>
        </div>
      )}

      {endpoint.sideEffects && (
        <div className="bg-accent/10 border border-accent/30 px-3 py-1.5">
          <span className="font-mono text-xs text-accent">⚡ {endpoint.sideEffects}</span>
        </div>
      )}
    </div>
  )
}
