/**
 * Denemelerden kanonik kaydın kurulması.
 *
 * Kendi modülünde, çünkü iki çağıranı var: normal biten bir koşum (`run.ts`)
 * ve journal'dan toparlanan yarım bir koşum (`journal.ts`). İkisi ayrı kod
 * yollarından geçseydi kurtarılan kayıt ile normal kayıt er geç ayrışırdı ve
 * fark tam da kimsenin bakmadığı yerde ortaya çıkardı.
 */

import { createHash } from 'node:crypto'
import {
  proportion,
  type Attempt,
  type CaseResult,
  type Environment,
  type PartialRun,
  type Pins,
  type Run,
  type RunLayer,
  type SkippedCase,
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
/**
 * Bağlam pininin değeri — yüklenen talimat dosyalarının tek hash'i (0.4.8).
 *
 * Girişler zaten yol + içerik hash'i taşıyor; sıralanıp birleştiriliyor, yani
 * yükleme sırası değişince pin kaymıyor ama dosyanın içeriği değişince
 * kayıyor. Boş liste kendi hash'ini alır: "ölçtüm, hiçbir şey yüklenmedi"
 * ölçülebilir bir sonuçtur ve ölçülmemişlikten ayrılmalı.
 *
 * `core` hash alamıyor (I/O ve `node:crypto` yasak, docs/stack.md), bu yüzden
 * burada — `suiteHash` ile aynı sebep.
 */
export function hashContext(memory: readonly string[]): string {
  const canonical = JSON.stringify([...memory].sort())
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`
}

export function assembleRun(input: {
  id: string
  startedAt: string
  finishedAt: string
  host: string
  skill: string
  /** Koşumun insan tarafından verilen adı; hiçbir hash'e girmiyor. */
  label?: string
  runs: number
  /** Aynı anda koşan deneme sayısı; 1 ise yazılmıyor. */
  concurrency?: number
  /** Ölçülen katmanlar; hepsi ölçüldüyse yazılmıyor. */
  layers?: readonly RunLayer[]
  /** Hiç koşulmamış vakalar ve sebepleri. */
  skipped?: readonly SkippedCase[]
  pins: Pins
  attempts: readonly JournalAttempt[]
  partial?: PartialRun
  /** Kaydı üreten Assay sürümü; kurtarmada journal'ı yazan sürüm. */
  assayVersion?: string
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
  const byCase = new Map<
    string,
    { expectedTrigger?: boolean; expectedWinner?: readonly string[]; attempts: Attempt[] }
  >()

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
      ...(entry.expectedWinner === undefined ? {} : { expectedWinner: entry.expectedWinner }),
      attempts: [],
    }
    bucket.attempts.push(entry.attempt)
    byCase.set(entry.caseId, bucket)
  }

  const cases = [...byCase.entries()].map(([caseId, bucket]) =>
    summarizeCase(caseId, bucket.attempts, bucket.expectedTrigger, bucket.expectedWinner),
  )
  const environmentHash =
    environmentHashes.size === 1 ? [...environmentHashes][0] : undefined

  /*
   * Bağlam pini (0.4.8): host'un yüklediği talimat dosyalarının hash'i.
   *
   * Ortam kaydından türüyor, çünkü ölçümü 0.4.5 zaten yapıyor: her giriş bir
   * yol ve bir **içerik hash'i**. Buradaki iş onları tek bir pine indirmek.
   *
   * Ölçülmediyse (`memory` yok, 0.4.5 öncesi ya da kanca koşmadı) değer
   * YAZILMIYOR. Boş liste ile ölçülmemiş arasındaki fark tam da bu pinin
   * varlık sebebi: `[]` "ölçtüm, hiçbir şey yüklenmedi" der ve kendi hash'ini
   * alır; alanın yokluğu "bilmiyorum" der ve karşılaştırmayı durdurur.
   */
  const environment = environments.size === 1 ? [...environments.values()][0] : undefined
  const contextHash =
    environment?.memory === undefined ? undefined : hashContext(environment.memory)

  return {
    id: input.id,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    host: input.host,
    skill: input.skill,
    ...(input.label === undefined ? {} : { label: input.label }),
    pins: {
      ...input.pins,
      ...(environmentHash === undefined || environmentHash === ''
        ? {}
        : { environmentHash }),
      ...(contextHash === undefined ? {} : { contextHash }),
    },
    ...(permissionModes.size === 1
      ? { permissionMode: [...permissionModes][0] as string }
      : {}),
    ...(environment === undefined ? {} : { environment }),
    runs: input.runs,
    ...(input.concurrency === undefined ? {} : { concurrency: input.concurrency }),
    ...(input.layers === undefined ? {} : { layers: input.layers }),
    ...(input.skipped === undefined || input.skipped.length === 0
      ? {}
      : { skipped: input.skipped }),
    cases,
    verdict: verdictOf(
      input.attempts.map((entry) => entry.attempt),
      input.skipped,
      input.partial !== undefined,
    ),
    ...(input.partial === undefined ? {} : { partial: input.partial }),
    ...(input.assayVersion === undefined ? {} : { assayVersion: input.assayVersion }),
  }
}


export function summarizeCase(
  caseId: string,
  attempts: readonly Attempt[],
  expectedTrigger: boolean | undefined,
  expectedWinner?: readonly string[],
): CaseResult {
  const passed = attempts.filter((a) => a.verdict === 'pass').length
  const failed = attempts.filter((a) => a.verdict === 'fail').length
  const unknown = attempts.filter((a) => a.verdict === 'unknown').length
  return {
    caseId,
    ...(expectedTrigger === undefined ? {} : { expectedTrigger }),
    ...(expectedWinner === undefined ? {} : { expectedWinner }),
    attempts,
    // Değişmez #4: unknown'lar paydadan çıkar, ayrıca sayılır.
    passRate: proportion(passed, passed + failed),
    passed,
    failed,
    unknown,
  }
}


/**
 * Attempt listesinden koşum verdict'i. Boş liste ölçüm yok demektir.
 *
 * Bütçenin kestiği bir koşum `pass` veremez. Gerçek bir hostta ölçüldü:
 * `--max-attempts 3` hiçbir negatif vakayı koşturmadan doldu ve koşum yalnız
 * pozitiflerle PASS dedi — değişmez #5'in engellediği durum, şemadan geçip koşum
 * anında yeniden üretiliyordu. Ölçülmüş bir `fail` yine kazanır: kesilen vakalar
 * gerçek bir kırılmayı geri almaz. Katman elemesi (`cause: 'layer'`) kullanıcının
 * beyan ettiği kapsam; verdict'i değiştirmez.
 */
export function verdictOf(
  attempts: readonly Attempt[],
  skipped: readonly SkippedCase[] = [],
  partial = false,
): Verdict {
  const verdicts = attempts.map((a) => a.verdict)
  if (verdicts.includes('fail')) return 'fail'
  if (verdicts.includes('unknown') || verdicts.length === 0) return 'unknown'
  /*
   * Yarım kayıt `pass` veremez (0.3.1-b). Kurtarılan bir koşumun ölçmediği
   * denemeler var; ölçülmeyen şey geçmiş sayılmaz. Ölçüldü (0.3.0): üç
   * denemeden sonra öldürülen koşum yalnız pozitiflerle `pass` diye kurtarıldı.
   * Bu kural, son vakanın ortasında kesilip hiçbir vakayı tamamen kaçırmamış
   * bir koşumu da kapsıyor — orada `skipped` boş, eksik yine var.
   */
  if (partial) return 'unknown'
  // Bütçenin kestiği ya da koşumun hiç ulaşamadığı vaka: kullanıcının beyan
  // ettiği kapsam değil, ölçülmemiş bir vaka.
  if (skipped.some((s) => s.cause !== 'layer')) return 'unknown'
  return 'pass'
}