/**
 * Skorlama.
 *
 * Tek kural: **hiçbir fonksiyon çıplak oran döndürmez.** Her oran bir
 * `Proportion`'dır ve N ile Wilson güven aralığını yanında taşır (değişmez #4).
 *
 * İkinci kural: `unknown` sonuçlar oranların paydasından çıkarılır ama
 * **ayrıca sayılır**. Ölçülemeyeni başarısızlık saymak da başarı saymak kadar
 * yanlış; ikisi de gerçeği gizler.
 */

import { proportion, type Attempt, type Proportion, type Verdict } from './records.js'

// ---------------------------------------------------------------------------
// Sayım
// ---------------------------------------------------------------------------

export interface VerdictCounts {
  pass: number
  fail: number
  unknown: number
  /** Toplam gözlem. `pass + fail + unknown`. */
  total: number
}

export function countVerdicts(verdicts: readonly Verdict[]): VerdictCounts {
  const counts = { pass: 0, fail: 0, unknown: 0, total: verdicts.length }
  for (const verdict of verdicts) counts[verdict] += 1
  return counts
}

/**
 * Kesin sonuçların oranı. `unknown`'lar paydadan çıkarılır.
 *
 * Hepsi `unknown` ise N=0 olur ve `Proportion.rate` `null` döner — "hiç
 * ölçülemedi" ile "%0 geçti" karışmaz.
 */
export function decidedRate(counts: VerdictCounts): Proportion {
  return proportion(counts.pass, counts.pass + counts.fail)
}

// ---------------------------------------------------------------------------
// Tetiklenme doğruluğu
// ---------------------------------------------------------------------------

/** Tek bir tetiklenme gözlemi: beklenen ve gözlenen. */
export interface TriggerObservationPoint {
  /** Vaka tetiklenmesini bekliyor mu (pozitif vaka mı). */
  expected: boolean
  /** Gözlenen tetiklenme. Okunamadıysa `null`. */
  observed: boolean | null
}

/**
 * Tetiklenme karışıklık matrisi.
 *
 * Pozitif sınıf = "skill tetiklenmeli". `unknown` gözlemler matrise girmez,
 * `unknown` alanında sayılır.
 */
export interface TriggerAccuracy {
  truePositive: number
  falsePositive: number
  trueNegative: number
  falseNegative: number
  /** Okunamayan gözlemler. Matrise dahil değil. */
  unknown: number
  /** TP / (TP + FP) — tetiklendiğinde haklı mıydı. */
  precision: Proportion
  /** TP / (TP + FN) — tetiklenmesi gerektiğinde tetiklendi mi. */
  recall: Proportion
  /**
   * Harmonik ortalama. Oran olmadığı için `Proportion` değil; precision veya
   * recall ölçülemediyse `null`.
   */
  f1: number | null
}

export function triggerAccuracy(
  points: readonly TriggerObservationPoint[],
): TriggerAccuracy {
  let truePositive = 0
  let falsePositive = 0
  let trueNegative = 0
  let falseNegative = 0
  let unknown = 0

  for (const point of points) {
    if (point.observed === null) {
      unknown += 1
      continue
    }
    if (point.expected && point.observed) truePositive += 1
    else if (!point.expected && point.observed) falsePositive += 1
    else if (!point.expected && !point.observed) trueNegative += 1
    else falseNegative += 1
  }

  const precision = proportion(truePositive, truePositive + falsePositive)
  const recall = proportion(truePositive, truePositive + falseNegative)
  const f1 =
    precision.rate === null || recall.rate === null || precision.rate + recall.rate === 0
      ? null
      : (2 * precision.rate * recall.rate) / (precision.rate + recall.rate)

  return {
    truePositive,
    falsePositive,
    trueNegative,
    falseNegative,
    unknown,
    precision,
    recall,
    f1,
  }
}

// ---------------------------------------------------------------------------
// Kararsızlık
// ---------------------------------------------------------------------------

export interface Flakiness {
  passRate: Proportion
  /**
   * Vaka kararsız mı: hem `pass` hem `fail` gözlendi. Tek koşumda anlamsız
   * olduğu için N < 2 iken `null`.
   */
  flaky: boolean | null
  /** Kesin gözlem sayısı 2'nin altındaysa kararsızlık ölçülememiştir. */
  measured: boolean
}

export function flakiness(counts: VerdictCounts): Flakiness {
  const decided = counts.pass + counts.fail
  return {
    passRate: decidedRate(counts),
    flaky: decided < 2 ? null : counts.pass > 0 && counts.fail > 0,
    measured: decided >= 2,
  }
}

// ---------------------------------------------------------------------------
// Maliyet ve hacim
// ---------------------------------------------------------------------------

export interface Totals {
  attempts: number
  inputTokens: number
  outputTokens: number
  /** Host maliyet vermediyse `null` — sıfır değil. */
  usd: number | null
  /** Toplam süre. Ölçülemeyen attempt'ler dahil değil. */
  durationMs: number
  toolCalls: number
}

export function totals(attempts: readonly Attempt[]): Totals {
  let inputTokens = 0
  let outputTokens = 0
  let usd = 0
  let sawCost = false
  let durationMs = 0
  let toolCalls = 0

  for (const attempt of attempts) {
    if (attempt.cost !== undefined) {
      inputTokens += attempt.cost.inputTokens
      outputTokens += attempt.cost.outputTokens
      if (attempt.cost.usd !== undefined) {
        usd += attempt.cost.usd
        sawCost = true
      }
    }
    durationMs += attempt.latencyMs ?? 0
    toolCalls += (attempt.trace ?? []).filter(
      (event) => event.kind === 'tool_call',
    ).length
  }

  return {
    attempts: attempts.length,
    inputTokens,
    outputTokens,
    usd: sawCost ? usd : null,
    durationMs,
    toolCalls,
  }
}

// ---------------------------------------------------------------------------
// Koşum özeti
// ---------------------------------------------------------------------------

export interface RunSummary {
  counts: VerdictCounts
  /** Attempt seviyesinde geçiş oranı. */
  passRate: Proportion
  trigger: TriggerAccuracy
  totals: Totals
  /** Koşumun bileşik verdict'i: bir fail varsa fail, yoksa unknown varsa unknown. */
  verdict: Verdict
}

/**
 * Attempt'lerden koşum özeti.
 *
 * `expectedTrigger` her vaka için beklenen tetiklenmeyi verir; vaka tetiklenme
 * hakkında iddiada bulunmuyorsa `undefined` döner ve o vaka doğruluk matrisine
 * girmez.
 */
export function summarize(
  attempts: readonly Attempt[],
  expectedTrigger: (caseId: string) => boolean | undefined,
): RunSummary {
  const counts = countVerdicts(attempts.map((a) => a.verdict))

  const points: TriggerObservationPoint[] = []
  for (const attempt of attempts) {
    const expected = expectedTrigger(attempt.caseId)
    if (expected === undefined) continue
    points.push({
      expected,
      observed: attempt.trigger.available ? attempt.trigger.triggered : null,
    })
  }

  return {
    counts,
    passRate: decidedRate(counts),
    trigger: triggerAccuracy(points),
    totals: totals(attempts),
    verdict: counts.fail > 0 ? 'fail' : counts.unknown > 0 ? 'unknown' : 'pass',
  }
}
