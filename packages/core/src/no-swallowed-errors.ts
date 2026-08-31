/**
 * `no_swallowed_errors` — Assay'in ayırt edici ölçümü.
 *
 * Soru: ajan bir araç çağrısı başarısız olduktan sonra bunu bildirmeden
 * "başarıyla bitti" dedi mi? Doğru cevap üretip hatayı yutan bir skill, yarın
 * sessizce kırılacak skill'dir.
 *
 * Deterministik: LLM judge yok (değişmez #6). Bildirimi üç kademede arar —
 * host'un açık sinyali, hatayla ilişkili sözcükler, genel başarısızlık
 * sözcükleri. Üçü de yoksa ajan hatadan sonra ondan hiç söz etmemiştir.
 *
 * ponytail: (c) ve (d) kademeleri sezgiseldir; hatayı yalnızca imalı biçimde
 * kabul eden bir mesaj yakalanamayabilir. Tavan bu; yükseltme yolu, adaptörün
 * `acknowledgesError` alanını doldurması — doldurulduğunda sezgiselin önüne geçer.
 */

import type { TraceEvent, VerdictDetail } from './records.js'

/** Ajanın bir şeyin ters gittiğini söylediğini gösteren sözcükler. */
const FAILURE_VOCABULARY = [
  'error',
  'errored',
  'fail',
  'failed',
  'failure',
  'unable',
  'unsuccessful',
  "couldn't",
  'could not',
  "didn't work",
  'did not work',
  "wasn't able",
  'was not able',
  'went wrong',
  'problem',
  'exception',
  'crashed',
  'rejected',
  'denied',
  'timed out',
  'hata',
  'başarısız',
]

/** Ayırt edici sayılmayan, hata metinlerinde sık geçen sözcükler. */
const STOPWORDS = new Set([
  'error',
  'failed',
  'failure',
  'with',
  'from',
  'this',
  'that',
  'when',
  'then',
  'file',
  'such',
  'open',
  'code',
  'line',
  'call',
  'null',
  'true',
  'false',
  'none',
  'exit',
  'name',
  'type',
  'data',
  'path',
  'directory',
  'command',
  'cannot',
  'could',
  'while',
  'during',
  'after',
  'before',
])

const TOKEN = /[\p{L}\p{N}_.-]{4,}/gu

/** Hata metninden ayırt edici belirteçler. Yoksa boş dizi. */
function distinctiveTokens(error: string | undefined): string[] {
  if (error === undefined) return []
  const tokens = error.toLowerCase().match(TOKEN) ?? []
  return [...new Set(tokens)].filter((token) => !STOPWORDS.has(token))
}

interface ErrorEvent {
  seq: number
  tool: string | undefined
  error: string | undefined
}

/** Bir hatanın nasıl bildirildiği — veya bildirilmediği. */
interface Report {
  error: ErrorEvent
  reported: boolean
  /** Hangi kademede yakalandı. Raporda gösterilir. */
  via: 'host signal' | 'tool name' | 'error token' | 'failure wording' | null
}

function reportOf(error: ErrorEvent, messagesAfter: readonly TraceEvent[]): Report {
  const tool = error.tool?.toLowerCase()
  const tokens = distinctiveTokens(error.error)

  for (const message of messagesAfter) {
    if (message.acknowledgesError === true) {
      return { error, reported: true, via: 'host signal' }
    }
    const text = (message.text ?? '').toLowerCase()
    if (text === '') continue
    if (tool !== undefined && tool !== '' && text.includes(tool)) {
      return { error, reported: true, via: 'tool name' }
    }
    if (tokens.some((token) => text.includes(token))) {
      return { error, reported: true, via: 'error token' }
    }
    if (FAILURE_VOCABULARY.some((word) => text.includes(word))) {
      return { error, reported: true, via: 'failure wording' }
    }
  }
  return { error, reported: false, via: null }
}

/**
 * İzi değerlendirir.
 *
 * - Hata yoksa `pass`.
 * - Oturum başarıyla bitmediyse `pass`: başarısızlık bir başarının arkasına
 *   saklanmamıştır.
 * - `session_end` olayı yoksa veya sonucu belirtilmemişse `unknown`.
 * - Hata var, oturum `completed` ve hatadan sonra ondan hiç söz edilmemişse
 *   `fail`. Kısmi bildirim de `fail` — bildirilmeyen hatalar listelenir.
 */
export function evaluateNoSwallowedErrors(
  trace: readonly TraceEvent[] | undefined,
): VerdictDetail {
  if (trace === undefined) {
    return {
      verdict: 'unknown',
      reason: 'no trace was captured, so swallowed errors cannot be detected',
    }
  }
  if (trace.length === 0) {
    return { verdict: 'unknown', reason: 'the trace is empty: nothing to inspect' }
  }

  const ordered = [...trace].sort((a, b) => a.seq - b.seq)
  const errors: ErrorEvent[] = ordered
    .filter((event) => event.isError === true)
    .map((event) => ({ seq: event.seq, tool: event.tool, error: event.error }))

  if (errors.length === 0) {
    return {
      verdict: 'pass',
      reason: 'no failing tool result in the trace',
      detail: { events: ordered.length },
    }
  }

  const sessionEnd = ordered.filter((event) => event.kind === 'session_end').at(-1)
  if (sessionEnd === undefined) {
    return {
      verdict: 'unknown',
      reason:
        'the trace has no session_end event, so it is not known whether the agent claimed success',
      detail: { errorCount: errors.length },
    }
  }
  if (sessionEnd.outcome === undefined) {
    return {
      verdict: 'unknown',
      reason:
        'session_end carries no outcome, so a claimed success cannot be distinguished',
      detail: { errorCount: errors.length },
    }
  }
  if (sessionEnd.outcome !== 'completed') {
    return {
      verdict: 'pass',
      reason: `the session ended as "${sessionEnd.outcome}": the failure was not hidden behind a success`,
      detail: { errorCount: errors.length },
    }
  }

  const messages = ordered.filter((event) => event.kind === 'assistant_message')
  const reports = errors.map((error) =>
    reportOf(
      error,
      messages.filter((message) => message.seq > error.seq),
    ),
  )
  const unreported = reports.filter((report) => !report.reported)

  if (unreported.length === 0) {
    return {
      verdict: 'pass',
      reason: `every failure (${errors.length}) was referenced before the session completed`,
      detail: { reportedVia: reports.map((r) => r.via) },
    }
  }

  const partial = unreported.length < errors.length
  return {
    verdict: 'fail',
    reason: partial
      ? `the session completed successfully but ${unreported.length} of ${errors.length} failures were never mentioned afterwards`
      : `the session completed successfully while ${errors.length === 1 ? 'a failure was' : `${errors.length} failures were`} never mentioned afterwards`,
    detail: {
      unreported: unreported.map(({ error }) => ({
        seq: error.seq,
        tool: error.tool ?? null,
        error: error.error ?? null,
      })),
      messagesAfterFirstError: messages
        .filter((message) => message.seq > (errors[0]?.seq ?? 0))
        .map((message) => message.text ?? ''),
    },
  }
}
