import { describe, expect, it } from 'vitest'
import { compareRuns } from './compare.js'
import { labelProblem, LABEL_MAX_LENGTH, proportion, type Pins, type Run } from './records.js'

const pins: Pins = {
  skillSource: 'owner/repo@abc',
  skillHash: 'sha256:skill1',
  model: 'model-1',
  systemPromptHash: 'sha256:sp',
  suiteVersion: 1,
  suiteHash: 'sha256:suite1',
}

const run = (label?: string): Run => ({
  id: 'r',
  startedAt: '',
  finishedAt: '',
  host: 'mock',
  skill: 'widget',
  ...(label === undefined ? {} : { label }),
  pins,
  runs: 10,
  cases: [
    {
      caseId: 'c',
      attempts: [],
      passRate: proportion(10, 10),
      passed: 10,
      failed: 0,
      unknown: 0,
    },
  ],
  verdict: 'pass',
})

describe('labelProblem — etiketin şekli (0.4.7)', () => {
  it('boş etiketi reddeder: undefined ile aynı şeyi söyleyip farklı görünürdü', () => {
    expect(labelProblem('')).toContain('empty')
    expect(labelProblem('   ')).toContain('empty')
  })

  it('üst sınırın üstünü reddeder, sınırın kendisini kabul eder', () => {
    expect(labelProblem('x'.repeat(LABEL_MAX_LENGTH))).toBeNull()
    expect(labelProblem('x'.repeat(LABEL_MAX_LENGTH + 1))).toContain('the most is')
  })

  it('satır sonunu ve kontrol karakterini reddeder: etiket tek satır', () => {
    expect(labelProblem(`arm A${String.fromCharCode(10)}arm B`)).toContain('line break')
    expect(labelProblem(`arm${String.fromCharCode(9)}A`)).toContain('control character')
  })

  it('sıradan bir etiketi kabul eder', () => {
    expect(labelProblem('arm C — table + standing default')).toBeNull()
  })
})

describe('compareRuns — etiket karşılaştırmayı DURDURMAZ (0.4.7)', () => {
  /*
   * Etiketin pin olmamasının bütün anlamı bu testte: farklı etiketli iki
   * koşum hâlâ karşılaştırılıyor. Ters kural (etiket hash'e girsin) burayı
   * kırar — ve etiketi yazmayan iki kolu yine karşılaştırılabilir bırakırdı,
   * yani korumayı tam da ihtiyaç duyulan yerde kaybederdi.
   */
  it('etiketler farklıyken karşılaştırma açık kalır ve vakalar karşılaştırılır', () => {
    const result = compareRuns(run('arm B — no instruction file'), run('arm A — table'))
    expect(result.comparable).toBe(true)
    expect(result.drifted).toEqual([])
    expect(result.unavailable).toEqual([])
    expect(result.cases).toHaveLength(1)
  })

  it('etiketler farklıyken not düşer ve iki adı da söyler', () => {
    const result = compareRuns(run('arm B — no instruction file'), run('arm A — table'))
    expect(result.note).toContain('labelled differently')
    expect(result.note).toContain('arm B — no instruction file')
    expect(result.note).toContain('arm A — table')
  })

  it('etiketler aynıyken not yok', () => {
    expect(compareRuns(run('nightly'), run('nightly')).note).toBeUndefined()
  })

  it('bir taraf etiketsizken not yok: farktan bir sonuç çıkmaz', () => {
    expect(compareRuns(run(), run('arm A')).note).toBeUndefined()
    expect(compareRuns(run('arm A'), run()).note).toBeUndefined()
    expect(compareRuns(run(), run()).note).toBeUndefined()
  })
})
