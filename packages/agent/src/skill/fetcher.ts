import { AgentSkill, SkillEndpoint } from '@agentboard/shared'
import { config } from '../config'
import { createHash } from 'crypto'

interface SkillCache {
  skill: AgentSkill
  fetchedAt: number
  isPremium: boolean
}

const cache = new Map<string, SkillCache>()

/**
 * Fetch and parse SKILL.md from an agent's endpoint.
 * Returns cached version if still fresh.
 */
export async function fetchAgentSkill(
  agentAddress: string,
  endpoint: string,
  isPremium: boolean
): Promise<AgentSkill> {
  const cached = cache.get(agentAddress)
  if (cached) {
    const ttlMs = isPremium
      ? config.skill.cacheTtlPremiumMinutes * 60 * 1000
      : config.skill.cacheTtlBasicHours * 60 * 60 * 1000
    if (Date.now() - cached.fetchedAt < ttlMs) {
      return cached.skill
    }
  }

  const skill = await doFetch(endpoint)
  cache.set(agentAddress, { skill, fetchedAt: Date.now(), isPremium })
  return skill
}

async function doFetch(endpoint: string): Promise<AgentSkill> {
  const url = `${endpoint.replace(/\/$/, '')}/.well-known/SKILL.md`

  let raw = ''
  try {
    const { default: fetch } = await import('node-fetch')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.skill.fetchTimeoutMs)

    const res = await fetch(url, { signal: controller.signal as any })
    clearTimeout(timeout)

    if (res.status === 404) {
      return emptySkill('no-skill-file')
    }
    if (!res.ok) {
      return emptySkill('unreachable')
    }
    raw = await res.text()
  } catch {
    return emptySkill('unreachable')
  }

  return parseSkillMd(raw)
}

function emptySkill(status: AgentSkill['fetchStatus']): AgentSkill {
  return {
    raw: '',
    appName: '',
    description: '',
    endpoints: [],
    authentication: '',
    lastFetched: Date.now(),
    fetchStatus: status,
  }
}

/**
 * Parse SKILL.md markdown into structured AgentSkill.
 * Robust parser — extracts what it can, marks missing fields null.
 */
export function parseSkillMd(raw: string): AgentSkill {
  try {
    const lines = raw.split('\n')
    let appName = ''
    let description = ''
    let authentication = ''
    const endpoints: SkillEndpoint[] = []

    // Extract app name from first H1
    const h1 = lines.find(l => l.startsWith('# '))
    if (h1) appName = h1.replace(/^#\s+/, '').trim()

    // Extract description — first non-empty paragraph after H1
    let foundH1 = false
    for (const line of lines) {
      if (line.startsWith('# ')) { foundH1 = true; continue }
      if (foundH1 && line.trim() && !line.startsWith('#') && !description) {
        description = line.trim()
      }
    }

    // Extract authentication section
    const authIdx = lines.findIndex(l => /authentication/i.test(l) && l.startsWith('#'))
    if (authIdx !== -1) {
      const authLines: string[] = []
      for (let i = authIdx + 1; i < lines.length; i++) {
        if (lines[i].startsWith('#')) break
        if (lines[i].trim()) authLines.push(lines[i].trim())
      }
      authentication = authLines.join(' ').trim()
    }

    // Extract endpoints — look for H2/H3 sections with method + path patterns
    const endpointPattern = /^(GET|POST|PUT|DELETE|PATCH)\s+(\/\S+)/i
    let currentEndpoint: Partial<SkillEndpoint> | null = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      // Endpoint header: ### GET /api/action or **GET** `/api/action`
      const match = line.match(endpointPattern)
        || line.replace(/\*+/g, '').replace(/`/g, '').trim().match(endpointPattern)

      if (match) {
        if (currentEndpoint?.method && currentEndpoint?.path) {
          endpoints.push(finalizeEndpoint(currentEndpoint))
        }
        currentEndpoint = {
          method: match[1].toUpperCase(),
          path: match[2],
          description: '',
          inputs: {},
          output: '',
          payment: null,
          sideEffects: null,
        }
        continue
      }

      if (!currentEndpoint) continue

      // Description line (first non-empty non-header line after method/path)
      if (!currentEndpoint.description && line && !line.startsWith('-') && !line.startsWith('|')) {
        currentEndpoint.description = line
      }

      // Payment: look for x402 or USDC mentions
      if (/x402|payment|usdc|fee/i.test(line)) {
        const usdcMatch = line.match(/\$?(\d+\.?\d*)\s*usdc/i)
        if (usdcMatch) currentEndpoint.payment = `${usdcMatch[1]} USDC`
        else currentEndpoint.payment = line.trim()
      }

      // Side effects
      if (/side.?effect|transfer|state.?change/i.test(line)) {
        currentEndpoint.sideEffects = line.replace(/^[*-]\s*/, '').trim()
      }

      // Input params from table or list
      const tableMatch = line.match(/^\|\s*(\w+)\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|/)
      if (tableMatch && currentEndpoint.inputs) {
        currentEndpoint.inputs[tableMatch[1]] = tableMatch[3]
      }
      const listMatch = line.match(/^[-*]\s+`?(\w+)`?\s*[-:]\s*(.+)/)
      if (listMatch && currentEndpoint.inputs) {
        currentEndpoint.inputs[listMatch[1]] = listMatch[2]
      }

      // Output
      if (/^output|^returns/i.test(line)) {
        currentEndpoint.output = line.replace(/^(output|returns)[:\s]*/i, '').trim()
      }
    }

    if (currentEndpoint?.method && currentEndpoint?.path) {
      endpoints.push(finalizeEndpoint(currentEndpoint))
    }

    const status: AgentSkill['fetchStatus'] =
      appName || description || endpoints.length > 0 ? 'ok' : 'parse-error'

    return {
      raw,
      appName: appName || 'Unknown Agent',
      description: description || '',
      endpoints,
      authentication: authentication || 'None specified',
      lastFetched: Date.now(),
      fetchStatus: status,
    }
  } catch {
    return {
      raw,
      appName: '',
      description: '',
      endpoints: [],
      authentication: '',
      lastFetched: Date.now(),
      fetchStatus: 'parse-error',
    }
  }
}

function finalizeEndpoint(ep: Partial<SkillEndpoint>): SkillEndpoint {
  return {
    method: ep.method || 'GET',
    path: ep.path || '/',
    description: ep.description || '',
    inputs: ep.inputs || {},
    output: ep.output || '',
    payment: ep.payment || null,
    sideEffects: ep.sideEffects || null,
  }
}

export function hashSkillContent(raw: string): string {
  return '0x' + createHash('sha256').update(raw).digest('hex')
}

export function clearSkillCache(agentAddress: string) {
  cache.delete(agentAddress)
}
