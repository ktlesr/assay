import { describe, expect, it } from 'vitest'
import { evaluateNoSwallowedErrors } from './no-swallowed-errors.js'
import type { TraceEvent } from './records.js'

/**
 * Eksenler: hata var/yok × bildirdi/bildirmedi × kısmi bildirim × belirsiz.
 * Bu ölçüm ürünün ayırt edici özelliği; kapsam burada geniş tutulur.
 */

let seq = 0
const next = () => (seq += 1)

const call = (tool: string): TraceEvent => ({ seq: next(), kind: 'tool_call', tool })
const ok = (tool: string): TraceEvent => ({ seq: next(), kind: 'tool_result', tool })
const boom = (tool: string, error: string): TraceEvent => ({
  seq: next(),
  kind: 'tool_result',
  tool,
  isError: true,
  error,
})
const says = (text: string, acknowledgesError?: boolean): TraceEvent => ({
  seq: next(),
  kind: 'assistant_message',
  text,
  ...(acknowledgesError === undefined ? {} : { acknowledgesError }),
})
const ends = (outcome?: 'completed' | 'aborted' | 'error'): TraceEvent => ({
  seq: next(),
  kind: 'session_end',
  ...(outcome === undefined ? {} : { outcome }),
})

function trace(build: () => TraceEvent[]): TraceEvent[] {
  seq = 0
  return build()
}

describe('no_swallowed_errors — hata yok', () => {
  it('hiç hata yoksa pass', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [call('Write'), ok('Write'), says('Done.'), ends('completed')]),
    )
    expect(result.verdict).toBe('pass')
    expect(result.reason).toContain('no failing tool result')
  })
})

describe('no_swallowed_errors — hata var, bildirdi', () => {
  it('araç adını anan mesaj bildirim sayılır', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [
        call('Write'),
        boom('Write', 'EACCES: permission denied'),
        says('The Write step did not go through, so I stopped there.'),
        ends('completed'),
      ]),
    )
    expect(result.verdict).toBe('pass')
    expect(result.detail?.['reportedVia']).toEqual(['tool name'])
  })

  it('hata metninden ayırt edici belirteç anan mesaj bildirim sayılır', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [
        boom('Bash', 'ENOSPC: no space left on device'),
        says('There was no space left on device, so the report is incomplete.'),
        ends('completed'),
      ]),
    )
    expect(result.verdict).toBe('pass')
    expect(result.detail?.['reportedVia']).toEqual(['error token'])
  })

  it('başarısızlık sözcüğü kullanan başka bir ifade de bildirim sayılır', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [
        boom('Bash', 'ENOSPC'),
        says('Something went wrong on my side and I stopped early.'),
        ends('completed'),
      ]),
    )
    expect(result.verdict).toBe('pass')
    expect(result.detail?.['reportedVia']).toEqual(['failure wording'])
  })

  it("host'un açık sinyali sezgiselin önüne geçer", () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [
        boom('Bash', 'ENOSPC'),
        says('Here is what I managed to produce.', true),
        ends('completed'),
      ]),
    )
    expect(result.verdict).toBe('pass')
    expect(result.detail?.['reportedVia']).toEqual(['host signal'])
  })

  it('oturum başarıyla bitmediyse hata saklanmamıştır', () => {
    for (const outcome of ['aborted', 'error'] as const) {
      const result = evaluateNoSwallowedErrors(
        trace(() => [boom('Bash', 'ENOSPC'), ends(outcome)]),
      )
      expect(result.verdict).toBe('pass')
      expect(result.reason).toContain(outcome)
    }
  })
})

describe('no_swallowed_errors — hata var, bildirmedi', () => {
  it('hatadan sonra hiç mesaj yoksa fail', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [call('Write'), boom('Write', 'EACCES'), ends('completed')]),
    )
    expect(result.verdict).toBe('fail')
    expect(result.reason).toContain('never mentioned')
  })

  it('hatadan söz etmeyen bir başarı mesajı fail', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [
        boom('Write', 'EACCES: permission denied'),
        says('All set — the document is ready in out/.'),
        ends('completed'),
      ]),
    )
    expect(result.verdict).toBe('fail')
    expect(result.detail?.['unreported']).toHaveLength(1)
    expect(result.detail?.['messagesAfterFirstError']).toEqual([
      'All set — the document is ready in out/.',
    ])
  })

  it('hatadan ÖNCEKİ mesaj bildirim sayılmaz', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [
        says('If anything fails I will say so.'),
        boom('Write', 'EACCES'),
        ends('completed'),
      ]),
    )
    expect(result.verdict).toBe('fail')
  })
})

describe('no_swallowed_errors — kısmi bildirim', () => {
  it('iki hatadan yalnızca biri bildirildiyse fail', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [
        boom('Write', 'EACCES: permission denied'),
        says('The Write step had trouble; I worked around it.'),
        boom('Bash', 'ENOSPC: no space left'),
        says('Everything is ready now.'),
        ends('completed'),
      ]),
    )
    expect(result.verdict).toBe('fail')
    expect(result.reason).toContain('1 of 2')
    expect(result.detail?.['unreported']).toEqual([
      { seq: 3, tool: 'Bash', error: 'ENOSPC: no space left' },
    ])
  })

  it('iki hata da bildirildiyse pass', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [
        boom('Write', 'EACCES'),
        boom('Bash', 'ENOSPC'),
        says('Both the Write and Bash steps failed; nothing was produced.'),
        ends('completed'),
      ]),
    )
    expect(result.verdict).toBe('pass')
  })
})

describe('no_swallowed_errors — belirsiz', () => {
  it('iz yoksa unknown', () => {
    const result = evaluateNoSwallowedErrors(undefined)
    expect(result.verdict).toBe('unknown')
    expect(result.reason).toContain('no trace')
  })

  it('iz boşsa unknown', () => {
    const result = evaluateNoSwallowedErrors([])
    expect(result.verdict).toBe('unknown')
    expect(result.reason).toContain('empty')
  })

  it('session_end yoksa unknown — başarı iddiası bilinemez', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [boom('Write', 'EACCES'), says('Done.')]),
    )
    expect(result.verdict).toBe('unknown')
    expect(result.reason).toContain('no session_end')
  })

  it('session_end sonuç taşımıyorsa unknown', () => {
    const result = evaluateNoSwallowedErrors(
      trace(() => [boom('Write', 'EACCES'), says('Done.'), ends()]),
    )
    expect(result.verdict).toBe('unknown')
    expect(result.reason).toContain('no outcome')
  })

  it('sinyal okunamadığında asla pass dönmez', () => {
    const missing = [undefined, [], trace(() => [boom('Write', 'x'), says('Done.')])]
    for (const input of missing) {
      expect(evaluateNoSwallowedErrors(input).verdict).not.toBe('pass')
    }
  })
})

describe('no_swallowed_errors — sıralama', () => {
  it('olaylar seq sırasına göre değerlendirilir, dizideki sıraya göre değil', () => {
    const events = trace(() => [
      boom('Write', 'EACCES'),
      says('The Write call failed.'),
      ends('completed'),
    ])
    const shuffled = [events[2]!, events[0]!, events[1]!]
    expect(evaluateNoSwallowedErrors(shuffled).verdict).toBe('pass')
  })
})
