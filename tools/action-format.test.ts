import { describe, expect, it } from 'vitest'
// @ts-expect-error — action script'leri düz JS; tip bildirimi tutmuyoruz.
import {
  commentBody,
  comparisonSection,
  icon,
  rate,
  scorecard,
} from '../action/format.mjs'
import {
  compareRuns,
  proportion,
  type Pins,
  type Run,
} from '../packages/core/src/index.js'

/**
 * Action'ın PR yorumu, ürünün en görünür yüzü. Değişmez #4 orada da geçerli:
 * hiçbir oran N ve güven aralığı olmadan basılamaz.
 */

const pins: Pins = {
  skillSource: 'owner/repo@abc',
  skillHash: 'sha256:s1',
  model: 'claude-haiku-4-5-20251001',
  systemPromptHash: 'not-provided-by-host',
  suiteVersion: 1,
  suiteHash: 'sha256:c1',
}

const run = (
  id: string,
  cases: ReadonlyArray<[string, number, number, number]>,
  overrides: Partial<Pins> = {},
): Run => ({
  id,
  startedAt: '',
  finishedAt: '',
  host: 'claude-code',
  skill: 'docx',
  pins: { ...pins, ...overrides },
  runs: 10,
  cases: cases.map(([caseId, passed, failed, unknown]) => ({
    caseId,
    attempts: [],
    passRate: proportion(passed, passed + failed),
    passed,
    failed,
    unknown,
  })),
  verdict: cases.some(([, , f]) => f > 0)
    ? 'fail'
    : cases.some(([, , , u]) => u > 0)
      ? 'unknown'
      : 'pass',
})

describe('icon', () => {
  it.each([
    [{ failed: 0, unknown: 0 }, '✅'],
    [{ failed: 0, unknown: 2 }, '⚠️'],
    [{ failed: 1, unknown: 0 }, '❌'],
    [{ failed: 1, unknown: 5 }, '❌'],
  ])('%o → %s', (caseResult, expected) => {
    expect(icon(caseResult)).toBe(expected)
  })
})

describe('rate — değişmez #4', () => {
  it('N ve aralık taşır', () => {
    expect(rate(proportion(8, 10))).toBe('80% (N=10, 95% CI 49%–94%)')
  })

  it('gözlem yoksa oran basılmaz', () => {
    expect(rate(proportion(0, 0))).toBe('no observations (N=0)')
  })
})

describe('scorecard', () => {
  const table = scorecard(run('r', [['trigger.positive.a', 9, 1, 0]]))

  it('markdown tablosu üretir', () => {
    expect(table).toContain('| | Case | Pass rate | Pass | Fail | Unknown |')
    expect(table).toContain('`trigger.positive.a`')
  })

  it('yüzde içeren her satır N de taşır', () => {
    // Asıl kural satır seviyesinde: oran gösteren hiçbir satır N'siz olamaz.
    for (const line of table.split('\n')) {
      if (!line.includes('%')) continue
      expect(line, `N'siz oran satırı: ${line}`).toContain('N=')
    }
  })

  it('unknown ayrı sütun, fail ile karışmıyor', () => {
    const withUnknown = scorecard(run('r', [['a', 2, 0, 3]]))
    expect(withUnknown).toContain('| 2 | 0 | 3 |')
    expect(withUnknown).toContain('⚠️')
  })
})

describe('comparisonSection', () => {
  it('baseline yoksa bunu söyler, sessizce geçmez', () => {
    expect(comparisonSection(null, '')).toContain('No baseline run was found')
  })

  it('pin kaydıysa karşılaştırma yapılmadığını ve nedenini söyler', () => {
    const comparison = compareRuns(
      run('a', [['c', 10, 0, 0]]),
      run('b', [['c', 0, 10, 0]], { model: 'other' }),
    )
    const section = comparisonSection(comparison, 'a')
    expect(section).toContain('Not compared')
    expect(section).toContain('model')
    expect(section).toContain('does not guess across a drift')
  })

  it('gürültü içindeki farklar tabloya girmez', () => {
    const comparison = compareRuns(run('a', [['c', 3, 0, 0]]), run('b', [['c', 0, 3, 0]]))
    expect(comparisonSection(comparison, 'a')).toContain(
      'no change outside the confidence',
    )
  })

  it('regresyon tabloda before/after ile gösterilir', () => {
    const comparison = compareRuns(
      run('a', [['c', 20, 0, 0]]),
      run('b', [['c', 0, 20, 0]]),
    )
    const section = comparisonSection(comparison, 'a')
    expect(section).toContain('regressed')
    expect(section).toContain('N=20')
  })
})

describe('commentBody', () => {
  const body = commentBody(run('r-1', [['a', 8, 2, 0]]), null, '')

  it('güncellenebilmesi için gizli işaretçi taşır', () => {
    expect(body.startsWith('<!-- assay-scorecard -->')).toBe(true)
  })

  it('verdict rozetini ve pinlenen modeli gösterir', () => {
    expect(body).toContain('❌ fail')
    expect(body).toContain('claude-haiku-4-5-20251001')
  })

  it('ölçülemeyenin geçmiş sayılmadığını yazar', () => {
    expect(body).toContain('never folded into a pass')
  })

  it('unknown koşumda rozet "nothing measured"', () => {
    expect(commentBody(run('r', [['a', 0, 0, 5]]), null, '')).toContain(
      'nothing measured',
    )
  })
})
