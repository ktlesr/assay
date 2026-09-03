import { describe, expect, it } from 'vitest'
import type { Attempt } from './records.js'
import {
  countVerdicts,
  decidedRate,
  flakiness,
  summarize,
  totals,
  triggerAccuracy,
} from './scoring.js'

describe('countVerdicts', () => {
  it('üç durumu ayrı sayar', () => {
    expect(countVerdicts(['pass', 'pass', 'fail', 'unknown'])).toEqual({
      pass: 2,
      fail: 1,
      unknown: 1,
      total: 4,
    })
  })
})

describe('decidedRate — unknown paydadan çıkar', () => {
  it('8 pass, 2 fail, 5 unknown → N=10', () => {
    const rate = decidedRate({ pass: 8, fail: 2, unknown: 5, total: 15 })
    expect(rate.n).toBe(10)
    expect(rate.rate).toBeCloseTo(0.8, 10)
  })

  it('hepsi unknown ise oran null — %0 ile karışmaz', () => {
    const rate = decidedRate({ pass: 0, fail: 0, unknown: 7, total: 7 })
    expect(rate.n).toBe(0)
    expect(rate.rate).toBeNull()
    expect(rate.ci).toBeNull()
  })

  it('hiç unknown yokken oran tüm gözlemleri kapsar', () => {
    expect(decidedRate({ pass: 3, fail: 1, unknown: 0, total: 4 }).n).toBe(4)
  })
})

describe('triggerAccuracy', () => {
  const point = (expected: boolean, observed: boolean | null) => ({ expected, observed })

  it('mükemmel ayrım: precision ve recall 1', () => {
    const accuracy = triggerAccuracy([
      point(true, true),
      point(true, true),
      point(false, false),
      point(false, false),
    ])
    expect(accuracy).toMatchObject({ truePositive: 2, trueNegative: 2, falsePositive: 0 })
    expect(accuracy.precision.rate).toBe(1)
    expect(accuracy.recall.rate).toBe(1)
    expect(accuracy.f1).toBe(1)
  })

  it('her istekte tetiklenen skill: recall 1 ama precision düşük', () => {
    // Değişmez #5'in ölçüsü. Negatif vaka olmasa bu skill mükemmel görünürdü.
    const accuracy = triggerAccuracy([
      point(true, true),
      point(false, true),
      point(false, true),
    ])
    expect(accuracy.recall.rate).toBe(1)
    expect(accuracy.precision.rate).toBeCloseTo(1 / 3, 10)
    expect(accuracy.f1).toBeCloseTo(0.5, 10)
  })

  it('hiç tetiklenmeyen skill: precision ölçülemez, recall 0', () => {
    const accuracy = triggerAccuracy([point(true, false), point(false, false)])
    expect(accuracy.precision.rate).toBeNull() // TP+FP = 0
    expect(accuracy.recall.rate).toBe(0)
    expect(accuracy.f1).toBeNull()
  })

  it('okunamayan gözlemler matrise girmez, ayrıca sayılır', () => {
    const accuracy = triggerAccuracy([
      point(true, true),
      point(true, null),
      point(false, null),
    ])
    expect(accuracy.unknown).toBe(2)
    expect(accuracy.truePositive).toBe(1)
    expect(accuracy.precision.n).toBe(1)
  })

  it('hiç gözlem yoksa oranlar null, sıfır değil', () => {
    const accuracy = triggerAccuracy([])
    expect(accuracy.precision.rate).toBeNull()
    expect(accuracy.recall.rate).toBeNull()
    expect(accuracy.f1).toBeNull()
  })

  it('oranlar her zaman N ve aralık taşır', () => {
    const accuracy = triggerAccuracy([point(true, true), point(false, true)])
    expect(accuracy.precision.n).toBe(2)
    expect(accuracy.precision.ci).not.toBeNull()
  })
})

describe('flakiness', () => {
  it('hem pass hem fail görülmüşse kararsız', () => {
    expect(flakiness({ pass: 6, fail: 4, unknown: 0, total: 10 })).toMatchObject({
      flaky: true,
      measured: true,
    })
  })

  it('hepsi aynıysa kararlı', () => {
    expect(flakiness({ pass: 10, fail: 0, unknown: 0, total: 10 }).flaky).toBe(false)
  })

  it('tek kesin gözlemle kararsızlık ölçülemez — N=1 gözlemdir, ölçüm değil', () => {
    const result = flakiness({ pass: 1, fail: 0, unknown: 4, total: 5 })
    expect(result.flaky).toBeNull()
    expect(result.measured).toBe(false)
  })
})

describe('totals', () => {
  const attempt = (overrides: Partial<Attempt>): Attempt => ({
    index: 0,
    caseId: 'c',
    startedAt: '',
    finishedAt: '',
    trigger: { available: false, reason: 'x' },
    assertions: [],
    verdict: 'unknown',
    reason: '',
    ...overrides,
  })

  it('token, süre ve araç çağrısı toplanır', () => {
    const result = totals([
      attempt({
        cost: { inputTokens: 10, outputTokens: 5, usd: 0.01 },
        latencyMs: 100,
        trace: [
          { seq: 1, kind: 'tool_call', tool: 'Write' },
          { seq: 2, kind: 'tool_result', tool: 'Write' },
        ],
      }),
      attempt({ cost: { inputTokens: 20, outputTokens: 7, usd: 0.02 }, latencyMs: 200 }),
    ])
    expect(result).toMatchObject({
      attempts: 2,
      inputTokens: 30,
      outputTokens: 12,
      durationMs: 300,
      toolCalls: 1,
    })
    expect(result.usd).toBeCloseTo(0.03, 10)
  })

  it('host maliyet vermediyse usd null — sıfır değil', () => {
    const result = totals([attempt({ cost: { inputTokens: 1, outputTokens: 1 } })])
    expect(result.usd).toBeNull()
  })

  it('boş liste sıfırlarla döner', () => {
    expect(totals([])).toMatchObject({ attempts: 0, inputTokens: 0, usd: null })
  })
})

describe('summarize', () => {
  const attempt = (
    caseId: string,
    verdict: Attempt['verdict'],
    triggered: boolean | null,
  ): Attempt => ({
    index: 0,
    caseId,
    startedAt: '',
    finishedAt: '',
    trigger:
      triggered === null
        ? { available: false, reason: 'unreadable' }
        : { available: true, triggered, skills: [], complete: true, via: 'test' },
    assertions: [],
    verdict,
    reason: '',
  })

  const expected = (caseId: string) =>
    caseId.startsWith('trigger.positive')
      ? true
      : caseId.startsWith('trigger.negative')
        ? false
        : undefined

  it('koşum verdicti fail > unknown > pass önceliğinde', () => {
    expect(
      summarize([attempt('a', 'pass', true), attempt('b', 'unknown', null)], expected)
        .verdict,
    ).toBe('unknown')
    expect(
      summarize([attempt('a', 'pass', true), attempt('b', 'fail', false)], expected)
        .verdict,
    ).toBe('fail')
    expect(summarize([attempt('a', 'pass', true)], expected).verdict).toBe('pass')
  })

  it('tetiklenme iddiası olmayan vaka doğruluk matrisine girmez', () => {
    const summary = summarize(
      [
        attempt('complete.creates_file', 'pass', true),
        attempt('trigger.positive.x', 'pass', true),
      ],
      expected,
    )
    expect(summary.trigger.truePositive).toBe(1)
  })

  it('okunamayan tetiklenme unknown olarak sayılır', () => {
    const summary = summarize([attempt('trigger.positive.x', 'unknown', null)], expected)
    expect(summary.trigger.unknown).toBe(1)
    expect(summary.trigger.precision.rate).toBeNull()
  })

  it('passRate unknown"ları paydadan çıkarır', () => {
    const summary = summarize(
      [
        attempt('trigger.positive.x', 'pass', true),
        attempt('trigger.positive.x', 'fail', false),
        attempt('trigger.positive.x', 'unknown', null),
      ],
      expected,
    )
    expect(summary.passRate.n).toBe(2)
    expect(summary.counts.unknown).toBe(1)
  })
  // --- ayrım gücü notu ---------------------------------------------------
  //
  // docs/measurements.md: aynı skill, aynı model ve aynı pinlerle iki set
  // %100 ve %51 precision verdi. Fark yalnızca negatiflerin kurulumundaydı.
  // `untested` o durumu görünür kılıyor; verdict'i DEĞİŞTİRMİYOR.

  it('hiçbir negatif kırılmadıysa ayrım gücü ölçülmemiş sayılır', () => {
    const summary = summarize(
      [
        attempt('trigger.positive.x', 'pass', true),
        attempt('trigger.negative.a', 'pass', false),
        attempt('trigger.negative.b', 'pass', false),
        attempt('trigger.negative.b', 'pass', false),
      ],
      expected,
    )
    expect(summary.discrimination).toEqual({
      cases: 2,
      attempts: 3,
      falsePositives: 0,
      untested: true,
    })
  })

  it('bir negatif sızdıysa ayrım gücü ölçülmüş sayılır', () => {
    const summary = summarize(
      [attempt('trigger.negative.a', 'pass', false), attempt('trigger.negative.a', 'fail', true)],
      expected,
    )
    expect(summary.discrimination.falsePositives).toBe(1)
    expect(summary.discrimination.untested).toBe(false)
  })

  it('not verdicti değiştirmez', () => {
    // Pozitif kaçtı, negatiflerin hepsi tuttu: verdict fail, not yine de var.
    const summary = summarize(
      [attempt('trigger.positive.x', 'fail', false), attempt('trigger.negative.a', 'pass', false)],
      expected,
    )
    expect(summary.verdict).toBe('fail')
    expect(summary.discrimination.untested).toBe(true)
  })

  it('negatif yoksa not çıkmaz', () => {
    const summary = summarize([attempt('trigger.positive.x', 'pass', true)], expected)
    expect(summary.discrimination.cases).toBe(0)
    expect(summary.discrimination.untested).toBe(false)
  })

  it('ölçülemeyen negatif ayrım gücü saymaz', () => {
    // Tek negatif okunamadıysa "hiçbiri kırılmadı" demek yanlış olur.
    const summary = summarize(
      [attempt('trigger.positive.x', 'pass', true), attempt('trigger.negative.a', 'unknown', null)],
      expected,
    )
    expect(summary.discrimination.attempts).toBe(0)
    expect(summary.discrimination.untested).toBe(false)
  })
})
