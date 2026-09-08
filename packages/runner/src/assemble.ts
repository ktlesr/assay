/**
 * Denemelerden kanonik kaydın kurulması.
 *
 * Kendi modülünde, çünkü iki çağıranı var: normal biten bir koşum (`run.ts`)
 * ve journal'dan toparlanan yarım bir koşum (`journal.ts`). İkisi ayrı kod
 * yollarından geçseydi kurtarılan kayıt ile normal kayıt er geç ayrışırdı ve
 * fark tam da kimsenin bakmadığı yerde ortaya çıkardı.
 */

import {
  proportion,
  type Attempt,
  type CaseResult,
  type Environment,
  type PartialRun,
  type Pins,
  type Run,
  type Verdict,
} from '@ktlsr/assay-core'
import type { JournalAttempt } from './journal.js'
/**
 * Denemelerden kanonik kaydı kurar.
 *
 * Hem normal bitişin hem `recover`ın tek yolu burası. İki ayrı yol olsaydı
 * kurtarılan kayıt ile normal kayıt er geç ayrışırdı ve fark, tam da kimsenin
 * bakmadığı yerde ortaya çıkardı.
 */
export function assembleRun(input: {
  id: string
  startedAt: string
  finishedAt: string
  host: string
  skill: string
  runs: number
  /** Aynı anda koşan deneme sayısı; 1 ise yazılmıyor. */
  concurrency?: number
  pins: Pins
  attempts: readonly JournalAttempt[]
  partial?: PartialRun
}): Run {
  // Ortam hash'i koşum seviyesinde bir pin ama oturum seviyesinde okunuyor.
  // Attempt'ler farklı hash bildirirse ortam koşum ortasında kaymış demektir;
  // o durumda hiçbir değer yazılmıyor ve pin "ölçülemedi" kalıyor.
  const environmentHashes = new Set<string>()
  // İzin modu ve ortam kaydı da aynı mantıkla: attempt'ler ayrışırsa koşum
  // ortasında kaymışlar demektir ve tek bir değer yazmak yanlış olur.
  const permissionModes = new Set<string>()
  const environments = new Map<string, Environment>()

  // Vaka sırası journal'daki ilk görülme sırası — o da suite sırası.
  const byCase = new Map<string, { expectedTrigger?: boolean; attempts: Attempt[] }>()

  for (const entry of input.attempts) {
    if (entry.environmentHash !== undefined) environmentHashes.add(entry.environmentHash)
    if (entry.permissionMode !== undefined) permissionModes.add(entry.permissionMode)
    if (entry.environment !== undefined) {
      environments.set(JSON.stringify(entry.environment), entry.environment)
    }
    const bucket = byCase.get(entry.caseId) ?? {
      ...(entry.expectedTrigger === undefined
        ? {}
        : { expectedTrigger: entry.expectedTrigger }),
      attempts: [],
    }
    bucket.attempts.push(entry.attempt)
    byCase.set(entry.caseId, bucket)
  }

  const cases = [...byCase.entries()].map(([caseId, bucket]) =>
    summarizeCase(caseId, bucket.attempts, bucket.expectedTrigger),
  )
  const environmentHash =
    environmentHashes.size === 1 ? [...environmentHashes][0] : undefined

  return {
    id: input.id,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    host: input.host,
    skill: input.skill,
    pins: {
      ...input.pins,
      ...(environmentHash === undefined || environmentHash === ''
        ? {}
        : { environmentHash }),
    },
    ...(permissionModes.size === 1
      ? { permissionMode: [...permissionModes][0] as string }
      : {}),
    ...(environments.size === 1
      ? { environment: [...environments.values()][0] as Environment }
      : {}),
    runs: input.runs,
    ...(input.concurrency === undefined ? {} : { concurrency: input.concurrency }),
    cases,
    verdict: verdictOf(input.attempts.map((entry) => entry.attempt)),
    ...(input.partial === undefined ? {} : { partial: input.partial }),
  }
}


export function summarizeCase(
  caseId: string,
  attempts: readonly Attempt[],
  expectedTrigger: boolean | undefined,
): CaseResult {
  const passed = attempts.filter((a) => a.verdict === 'pass').length
  const failed = attempts.filter((a) => a.verdict === 'fail').length
  const unknown = attempts.filter((a) => a.verdict === 'unknown').length
  return {
    caseId,
    ...(expectedTrigger === undefined ? {} : { expectedTrigger }),
    attempts,
    // Değişmez #4: unknown'lar paydadan çıkar, ayrıca sayılır.
    passRate: proportion(passed, passed + failed),
    passed,
    failed,
    unknown,
  }
}


/** Attempt listesinden koşum verdict'i. Boş liste ölçüm yok demektir. */
export function verdictOf(attempts: readonly Attempt[]): Verdict {
  const verdicts = attempts.map((a) => a.verdict)
  if (verdicts.includes('fail')) return 'fail'
  if (verdicts.includes('unknown') || verdicts.length === 0) return 'unknown'
  return 'pass'
}