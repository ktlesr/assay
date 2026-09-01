/**
 * Claude Code `--output-format stream-json` akışının ayrıştırıcısı.
 *
 * Saf: I/O yok, süreç yok. Girdi ayrıştırılmış JSON satırları, çıktı kanonik
 * `TraceEvent` dizisi ve oturum özeti. Bu ayrım, adaptörü gerçek bir koşum
 * yapmadan test edilebilir kılıyor — akış örnekleri gerçek koşumlardan alındı
 * (`src/__fixtures__`).
 *
 * Akışın şekli docs/host-feasibility.md'de deneyle belgelendi.
 */

import type { SessionOutcome, TraceEvent } from '@ktlsr/assay-core'

// ---------------------------------------------------------------------------
// Ham akış tipleri — host'un verdiği kadarı
// ---------------------------------------------------------------------------

/** `system/init` — koşumun ilk olayı, aktif kurulumun tamamını taşır. */
export interface InitEvent {
  sessionId: string
  model: string
  cwd: string
  version: string
  permissionMode: string
  outputStyle: string
  tools: readonly string[]
  /** Bu oturumda görünür olan skill'ler. Tetiklenme kümesinin evreni. */
  skills: readonly string[]
  agents: readonly string[]
  plugins: readonly { name: string; version?: string; source?: string }[]
}

/** Akışın son olayı. */
export interface ResultEvent {
  subtype: string
  isError: boolean
  numTurns: number
  stopReason?: string
  terminalReason?: string
  durationMs?: number
  costUsd?: number
  inputTokens: number
  outputTokens: number
  /** Ajanın son metni. */
  text?: string
}

export interface ParsedStream {
  init?: InitEvent
  result?: ResultEvent
  trace: TraceEvent[]
  /** `Skill` aracıyla tetiklendiği gözlenen skill'ler, sırayla. */
  triggeredSkills: string[]
  /** Ayrıştırılamayan satırlar. Boş değilse sinyal eksik olabilir. */
  malformed: number
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const str = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

/** `tool_result` içeriği string ya da blok dizisi olabilir; metne indirger. */
function contentToText(content: unknown): string | undefined {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    const parts = content
      .map((block) => (isRecord(block) ? str(block['text']) : undefined))
      .filter((t): t is string => t !== undefined)
    if (parts.length > 0) return parts.join('\n')
    return JSON.stringify(content)
  }
  if (content === undefined || content === null) return undefined
  return JSON.stringify(content)
}

/** `session_end` sonucunu host'un bildirdiği alanlardan türetir. */
export function outcomeOf(result: ResultEvent): SessionOutcome {
  if (result.isError) return 'error'
  if (result.terminalReason !== undefined && result.terminalReason !== 'completed') {
    return 'aborted'
  }
  return result.subtype === 'success' ? 'completed' : 'error'
}

// ---------------------------------------------------------------------------
// Ayrıştırma
// ---------------------------------------------------------------------------

/** JSONL metnini satır satır ayrıştırır; bozuk satırları sayar, atmaz. */
export function parseStreamJson(source: string): unknown[] {
  const out: unknown[] = []
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '' || !trimmed.startsWith('{')) continue
    try {
      out.push(JSON.parse(trimmed))
    } catch {
      out.push(null) // bozuk satır; sayılacak
    }
  }
  return out
}

/**
 * Ham olayları kanonik ize çevirir.
 *
 * `Skill` araç çağrısı hem `tool_call` hem `skill_trigger` üretir: birincisi iz
 * için, ikincisi tetiklenme ölçümü için. Tetiklenme sinyalinin tek kaynağı
 * budur — metinden çıkarım yapılmaz.
 */
export function parseSession(events: readonly unknown[]): ParsedStream {
  const trace: TraceEvent[] = []
  const triggeredSkills: string[] = []
  /** tool_use id → araç adı; tool_result'ı aracına bağlamak için. */
  const toolById = new Map<string, string>()
  let init: InitEvent | undefined
  let result: ResultEvent | undefined
  let malformed = 0
  let seq = 0

  for (const event of events) {
    if (!isRecord(event)) {
      malformed += 1
      continue
    }
    const type = str(event['type'])

    if (type === 'system' && str(event['subtype']) === 'init') {
      init = {
        sessionId: str(event['session_id']) ?? '',
        model: str(event['model']) ?? '',
        cwd: str(event['cwd']) ?? '',
        version: str(event['claude_code_version']) ?? '',
        permissionMode: str(event['permissionMode']) ?? '',
        outputStyle: str(event['output_style']) ?? '',
        tools: strings(event['tools']),
        skills: strings(event['skills']),
        agents: strings(event['agents']),
        plugins: Array.isArray(event['plugins'])
          ? event['plugins'].flatMap((p) => {
              if (!isRecord(p)) return []
              const name = str(p['name'])
              if (name === undefined) return []
              const version = str(p['version'])
              const source = str(p['source'])
              return [
                {
                  name,
                  ...(version === undefined ? {} : { version }),
                  ...(source === undefined ? {} : { source }),
                },
              ]
            })
          : [],
      }
      continue
    }

    if (type === 'result') {
      const usage = isRecord(event['usage']) ? event['usage'] : {}
      const text = str(event['result'])
      result = {
        subtype: str(event['subtype']) ?? '',
        isError: event['is_error'] === true,
        numTurns: num(event['num_turns']) ?? 0,
        ...(str(event['stop_reason']) === undefined
          ? {}
          : { stopReason: str(event['stop_reason']) as string }),
        ...(str(event['terminal_reason']) === undefined
          ? {}
          : { terminalReason: str(event['terminal_reason']) as string }),
        ...(num(event['duration_ms']) === undefined
          ? {}
          : { durationMs: num(event['duration_ms']) as number }),
        ...(num(event['total_cost_usd']) === undefined
          ? {}
          : { costUsd: num(event['total_cost_usd']) as number }),
        inputTokens: num(usage['input_tokens']) ?? 0,
        outputTokens: num(usage['output_tokens']) ?? 0,
        ...(text === undefined ? {} : { text }),
      }
      continue
    }

    const message = isRecord(event['message']) ? event['message'] : undefined
    const blocks =
      message !== undefined && Array.isArray(message['content'])
        ? message['content']
        : undefined
    if (blocks === undefined) continue

    for (const block of blocks) {
      if (!isRecord(block)) continue
      const kind = str(block['type'])

      if (kind === 'tool_use') {
        const tool = str(block['name']) ?? ''
        const id = str(block['id'])
        if (id !== undefined) toolById.set(id, tool)
        const args = isRecord(block['input']) ? block['input'] : undefined
        seq += 1
        trace.push({
          seq,
          kind: 'tool_call',
          tool,
          ...(id === undefined ? {} : { id }),
          ...(args === undefined ? {} : { args }),
        })
        // Tetiklenme sinyali: Skill aracının input.skill alanı.
        if (tool === 'Skill' && args !== undefined) {
          const skill = str(args['skill'])
          if (skill !== undefined) {
            triggeredSkills.push(skill)
            seq += 1
            trace.push({ seq, kind: 'skill_trigger', skill })
          }
        }
        continue
      }

      if (kind === 'tool_result') {
        const id = str(block['tool_use_id'])
        const tool = id === undefined ? undefined : toolById.get(id)
        const isError = block['is_error'] === true
        const text = contentToText(block['content'])
        seq += 1
        trace.push({
          seq,
          kind: 'tool_result',
          ...(id === undefined ? {} : { callId: id }),
          ...(tool === undefined ? {} : { tool }),
          ...(isError ? { isError: true } : {}),
          ...(isError && text !== undefined ? { error: text } : {}),
        })
        continue
      }

      if (kind === 'text') {
        const text = str(block['text'])
        if (text === undefined || text.trim() === '') continue
        seq += 1
        trace.push({ seq, kind: 'assistant_message', text })
      }
    }
  }

  if (result !== undefined) {
    seq += 1
    trace.push({ seq, kind: 'session_end', outcome: outcomeOf(result) })
  }

  return {
    ...(init === undefined ? {} : { init }),
    ...(result === undefined ? {} : { result }),
    trace,
    triggeredSkills,
    malformed,
  }
}
