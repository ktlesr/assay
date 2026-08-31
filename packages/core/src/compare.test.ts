import { describe, expect, it } from 'vitest'
import { compareRuns } from './compare.js'
import { proportion, type Pins, type Run } from './records.js'

const pins: Pins = {
  skillSource: 'owner/repo@abc',
  skillHash: 'sha256:skill1',
  model: 'model-1',
  systemPromptHash: 'sha256:sp',
  suiteVersion: 1,
  suiteHash: 'sha256:suite1',
}

const run = (
  cases: ReadonlyArray<[string, number, number]>,
  overrides: Partial<Pins> = {},
): Run => ({
  id: 'r',
  startedAt: '',
  finishedAt: '',
  host: 'mock',
  pins: { ...pins, ...overrides },
  runs: 10,
  cases: cases.map(([caseId, passed, failed]) => ({
    caseId,
    attempts: [],
    passRate: proportion(passed, passed + failed),
    passed,
    failed,
    unknown: 0,
  })),
  verdict: 'pass',
})

describe('compareRuns — dört pin', () => {
  it.each([
    ['skillSource', { skillSource: 'owner/repo@def' }],
    ['skillHash', { skillHash: 'sha256:skill2' }],
    ['model', { model: 'model-2' }],
    ['systemPromptHash', { systemPromptHash: 'sha256:other' }],
    ['suiteVersion', { suiteVersion: 2 }],
    ['suiteHash', { suiteHash: 'sha256:suite2' }],
  ])('%s kayarsa karşılaştırma yapılmaz', (name, drift) => {
    const comparison = compareRuns(run([['a', 10, 0]]), run([['a', 0, 10]], drift))
    expect(comparison.comparable).toBe(false)
    expect(comparison.verdict).toBe('unknown')
    expect(comparison.drifted).toContain(name)
    expect(comparison.cases).toEqual([])
  })

  it('pin kayması regresyonu gizler — bu kasıtlı', () => {
    // %100'den %0'a düşüş var ama model değişmiş; bu regresyon değil, gürültü.
    const comparison = compareRuns(
      run([['a', 10, 0]]),
      run([['a', 0, 10]], { model: 'model-2' }),
    )
    expect(comparison.verdict).not.toBe('fail')
    expect(comparison.reason).toContain('model')
  })
})

describe('compareRuns — regresyon tespiti', () => {
  it('aralıklar ayrık ve düşüş varsa regresyon', () => {
    const comparison = compareRuns(run([['a', 20, 0]]), run([['a', 0, 20]]))
    expect(comparison.cases[0]?.status).toBe('regressed')
    expect(comparison.verdict).toBe('fail')
  })

  it('aralıklar ayrık ve yükseliş varsa iyileşme', () => {
    const comparison = compareRuns(run([['a', 0, 20]]), run([['a', 20, 0]]))
    expect(comparison.cases[0]?.status).toBe('improved')
    expect(comparison.verdict).toBe('pass')
  })

  it('aralıklar kesişiyorsa gürültü — küçük N ile regresyon iddia edilmez', () => {
    const comparison = compareRuns(run([['a', 3, 0]]), run([['a', 0, 3]]))
    expect(comparison.cases[0]?.status).toBe('within_noise')
    expect(comparison.verdict).toBe('pass')
    expect(comparison.cases[0]?.reason).toContain('noise')
  })

  it('değişiklik yoksa unchanged', () => {
    const comparison = compareRuns(run([['a', 10, 0]]), run([['a', 10, 0]]))
    expect(comparison.cases[0]?.reason).toBe('unchanged')
    expect(comparison.cases[0]?.delta).toBe(0)
  })

  it('yeni vaka karşılaştırılamaz', () => {
    const comparison = compareRuns(
      run([['a', 10, 0]]),
      run([
        ['a', 10, 0],
        ['b', 10, 0],
      ]),
    )
    const added = comparison.cases.find((c) => c.caseId === 'b')
    expect(added?.status).toBe('unknown')
    expect(added?.reason).toContain('new')
    expect(comparison.verdict).toBe('unknown')
  })

  it('kaybolan vaka karşılaştırılamaz', () => {
    const comparison = compareRuns(
      run([
        ['a', 10, 0],
        ['b', 10, 0],
      ]),
      run([['a', 10, 0]]),
    )
    expect(comparison.cases.find((c) => c.caseId === 'b')?.reason).toContain('gone')
  })

  it('bir tarafta kesin gözlem yoksa unknown', () => {
    const comparison = compareRuns(run([['a', 10, 0]]), run([['a', 0, 0]]))
    expect(comparison.cases[0]?.status).toBe('unknown')
    expect(comparison.cases[0]?.reason).toContain('no decided attempts')
  })

  it('regresyon varsa gerekçe vakayı adlandırır', () => {
    const comparison = compareRuns(
      run([
        ['a', 20, 0],
        ['b', 20, 0],
      ]),
      run([
        ['a', 0, 20],
        ['b', 20, 0],
      ]),
    )
    expect(comparison.reason).toContain('a')
    expect(comparison.verdict).toBe('fail')
  })
})
