/**
 * Kanonik koşum kayıtları.
 *
 * Bunlar hem Faz 1'in dosya store'unun hem de Faz 2'nin Postgres şemasının tek
 * doğruluk kaynağıdır; Prisma modelleri bu tiplerden türetilecek. Bugün doğru
 * tanımlamak, iki kalıcılık hedefinin ayrışmasını engeller (docs/stack.md).
 *
 * core I/O yapmaz: buradaki hiçbir tip dosya sistemine veya ağa dokunmaz.
 * Kanıtı runner toplar, core değerlendirir.
 */

import type { Assertion } from './suite.js'

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

/**
 * Değişmez #1: verdict üç durumludur. Sinyal alınamadıysa `unknown` — sessiz
 * `pass` yasak.
 */
export type Verdict = 'pass' | 'fail' | 'unknown'

/** `unknown` bir hata kovası değil, birinci sınıf sonuç. Her zaman gerekçe taşır. */
export interface VerdictDetail {
  verdict: Verdict
  /** Neden bu sonuç. `unknown` için hangi sinyalin eksik olduğu. */
  reason: string
  /** Makine tarafından okunabilir ek kanıt; raporda gösterilir. */
  detail?: Readonly<Record<string, unknown>>
}

// ---------------------------------------------------------------------------
// Pin'ler — değişmez #2
// ---------------------------------------------------------------------------

/**
 * Dört pin. Biri eksik veya kaymışsa iki koşum karşılaştırılamaz.
 * `suiteHash` beyan edilen `suiteVersion`'ın unutulduğu durumu yakalar; runner
 * suite kaynağından hesaplar.
 */
export interface Pins {
  /** Pin 1 — beyan edilen skill sürümü. `owner/repo@<sha>` veya etiket. */
  skillSource: string
  /**
   * Pin 1'in denetçisi — skill dizininin içerik hash'i.
   *
   * `skillSource` insanın beyanı; unutulur, güncellenmez. Bu hash gerçeği
   * taşır: skill dosyası değişip beyan değişmezse karşılaştırma yine de
   * durur. `suiteVersion`/`suiteHash` çiftiyle aynı mantık.
   * Runner hesaplayamadıysa boş kalır ve karşılaştırma `unknown` üretir.
   */
  skillHash: string
  /** Pin 2 — tam model kimliği. */
  model: string
  /** Pin 3 — host sistem promptunun hash'i. */
  systemPromptHash: string
  /** Pin 4 — beyan edilen vaka seti sürümü. */
  suiteVersion: number
  /** Pin 4'ün denetçisi — suite kaynağının içerik hash'i. */
  suiteHash: string
}

/** İki koşumun karşılaştırılabilir olup olmadığı. */
export interface PinComparison {
  comparable: boolean
  /** Kayan pin adları. Boş değilse karşılaştırma `unknown` üretir. */
  drifted: readonly (keyof Pins)[]
}

export function comparePins(a: Pins, b: Pins): PinComparison {
  const keys: (keyof Pins)[] = [
    'skillSource',
    'skillHash',
    'model',
    'systemPromptHash',
    'suiteVersion',
    'suiteHash',
  ]
  const drifted = keys.filter((key) => a[key] !== b[key])
  return { comparable: drifted.length === 0, drifted }
}

// ---------------------------------------------------------------------------
// İz
// ---------------------------------------------------------------------------

export type TraceEventKind =
  'tool_call' | 'tool_result' | 'assistant_message' | 'skill_trigger' | 'session_end'

export type SessionOutcome = 'completed' | 'aborted' | 'error'

/**
 * Host'tan okunan tek bir olay. Adaptörler ham transkripti buna normalize eder;
 * assertion motoru yalnızca bu tipi bilir.
 */
export interface TraceEvent {
  /** Olay sırası. Adaptör atar, monoton artar. */
  seq: number
  kind: TraceEventKind
  /** `tool_call` için host'un verdiği çağrı kimliği. */
  id?: string
  /** `tool_result` için hangi çağrının sonucu olduğu. */
  callId?: string
  /** ISO 8601. Host vermiyorsa yok. */
  at?: string
  /** `tool_call` / `tool_result` için araç adı. */
  tool?: string
  /** `tool_call` argümanları. */
  args?: Readonly<Record<string, unknown>>
  /** `tool_result` başarısız mı. */
  isError?: boolean
  /** Hata metni, varsa. */
  error?: string
  /** `assistant_message` metni. */
  text?: string
  /**
   * Host, bu mesajın bir hatayı açıkça bildirdiğini söyleyebiliyorsa burada
   * belirtir. Verildiğinde no_swallowed_errors sezgiselinin önüne geçer.
   */
  acknowledgesError?: boolean
  /** `skill_trigger` için tetiklenen skill. */
  skill?: string
  /** `session_end` için oturumun nasıl bittiği. */
  outcome?: SessionOutcome
}

// ---------------------------------------------------------------------------
// Tetiklenme sinyali
// ---------------------------------------------------------------------------

/**
 * Tetiklenme okunamadıysa bu tip "bilinmiyor"u görmezden gelinemez kılar:
 * `triggered` alanına `available: true` olmadan erişilemez.
 */
export type TriggerObservation =
  | {
      available: true
      /** Hedef skill tetiklendi mi. */
      triggered: boolean
      /** Bu koşumda tetiklendiği gözlenen skill'ler. */
      skills: readonly string[]
      /**
       * `skills` tetiklenen skill'lerin *tamamı* mı, yoksa yalnızca hedef mi?
       * `false` ise "şu skill tetiklenmedi" iddiası doğrulanamaz ve `unknown`
       * üretilir — coexistence ölçümü ancak tam liste ile anlamlıdır.
       */
      complete: boolean
      /** Sinyalin hangi mekanizmadan okunduğu. Raporda gösterilir. */
      via: string
    }
  | { available: false; reason: string }

// ---------------------------------------------------------------------------
// Yan etkiler
// ---------------------------------------------------------------------------

export interface NetworkRequest {
  host: string
  method?: string
  /** Sandbox isteği engelledi mi. */
  blocked: boolean
}

/** Sandbox'ın gözlemlediği ortam değişimi. */
export interface EnvDiff {
  writes: readonly string[]
  deletes: readonly string[]
  network: readonly NetworkRequest[]
}

// ---------------------------------------------------------------------------
// Kanıt — assertion motorunun tek girdisi
// ---------------------------------------------------------------------------

export interface CapturedFile {
  path: string
  bytes: Uint8Array
}

/**
 * Koşumdan toplanan kanıt. Her alan opsiyonel: toplanamamış olabilir.
 *
 * Değişmez #1'in tip seviyesinde zorlanması buradan gelir — bir assertion'ın
 * değerlendiricisi yalnızca ihtiyaç duyduğu alanlar *mevcutken* çağrılır
 * (bkz. assertions.ts). Eksik kanıt değerlendiriciye hiç ulaşmaz, dolayısıyla
 * veri yokluğunda `pass` üretmek yapısal olarak imkânsızdır.
 */
export interface Evidence {
  files?: readonly CapturedFile[]
  trace?: readonly TraceEvent[]
  exitCode?: number
  env?: EnvDiff
}

// ---------------------------------------------------------------------------
// Sonuç kayıtları
// ---------------------------------------------------------------------------

export interface AssertionResult extends VerdictDetail {
  assertion: Assertion
}

export interface Cost {
  inputTokens: number
  outputTokens: number
  /** Host maliyet vermiyorsa yok. Uydurulmaz. */
  usd?: number
}

/** Tek bir tekrar. `runs: 10` → vaka başına 10 Attempt. */
export interface Attempt {
  /** 0'dan başlayan tekrar sırası. */
  index: number
  caseId: string
  startedAt: string
  finishedAt: string
  trigger: TriggerObservation
  assertions: readonly AssertionResult[]
  /** Attempt'in bileşik sonucu. */
  verdict: Verdict
  reason: string
  latencyMs?: number
  cost?: Cost
  trace?: readonly TraceEvent[]
  env?: EnvDiff
}

/** Bir vakanın N tekrarının toplamı. */
export interface CaseResult {
  caseId: string
  attempts: readonly Attempt[]
  /** Değişmez #4: oran asla çıplak gösterilmez, bkz. Proportion. */
  passRate: Proportion
  passed: number
  failed: number
  unknown: number
}

/** Tek bir `assay run` koşumu. */
export interface Run {
  id: string
  startedAt: string
  finishedAt: string
  /** Adaptör kimliği — hangi host ortamı. */
  host: string
  pins: Pins
  /** Suite'te beyan edilen tekrar sayısı. */
  runs: number
  cases: readonly CaseResult[]
  verdict: Verdict
}

// ---------------------------------------------------------------------------
// Oran — değişmez #4
// ---------------------------------------------------------------------------

/**
 * Bir oran, N ve güven aralığı olmadan var olamaz. Tip bunu zorlar: `rate`
 * çıplak bir sayı değil, `n` ve `ci` ile aynı nesnede taşınır ve gözlem yoksa
 * `null` olur.
 */
export interface Proportion {
  successes: number
  n: number
  /** n === 0 iken null: gözlem olmadan oran yoktur. */
  rate: number | null
  /** Wilson skor aralığı. n === 0 iken null. */
  ci: { low: number; high: number; level: 0.95 } | null
}

/** %95 için normal dağılımın z değeri. */
const Z_95 = 1.959963984540054

/**
 * Wilson skor aralığı. Küçük N'de Wald aralığından çok daha dürüst davranır:
 * 10/10 başarıda Wald [1, 1] der, Wilson [0.72, 1] der.
 */
export function proportion(successes: number, n: number): Proportion {
  if (!Number.isInteger(successes) || !Number.isInteger(n) || successes < 0 || n < 0) {
    throw new RangeError('proportion needs non-negative integers')
  }
  if (successes > n) {
    throw new RangeError(`proportion: ${successes} successes out of ${n} is impossible`)
  }
  if (n === 0) return { successes, n, rate: null, ci: null }

  const p = successes / n
  const z2 = Z_95 * Z_95
  const denominator = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const margin = Z_95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))

  // ponytail: 12 basamağa yuvarlama, p=1 iken üst sınırın 0.9999999999999999
  // çıkmasını engelliyor. Rapor hassasiyeti hiçbir zaman bunun yakınına gelmez.
  const clamp = (value: number) =>
    Math.min(1, Math.max(0, Math.round(value * 1e12) / 1e12))

  return {
    successes,
    n,
    rate: p,
    ci: {
      low: clamp((centre - margin) / denominator),
      high: clamp((centre + margin) / denominator),
      level: 0.95,
    },
  }
}

/** İnsan okunur biçim. Oranı N ve aralık olmadan yazdırmanın tek meşru yolu yok. */
export function formatProportion(p: Proportion): string {
  if (p.rate === null || p.ci === null) return 'no observations (N=0)'
  const pct = (value: number) => `${(value * 100).toFixed(0)}%`
  return `${pct(p.rate)} (N=${p.n}, 95% CI ${pct(p.ci.low)}–${pct(p.ci.high)})`
}
