'use client'

import type { ReactNode } from 'react'

/**
 * Ölçüm bileşenleri.
 *
 * Bu dosyanın tek işi değişmez #4'ü **tip seviyesinde** zorlamak: bir oran,
 * gözlem sayısı ve güven aralığı olmadan render edilemez. `Measurement` tipi
 * üçünü birlikte taşır ve bileşenler yalnızca bu tipi kabul eder — çıplak bir
 * `number` geçirmenin yolu yok.
 *
 * `@assay/core`'daki `Proportion` bu tipe yapısal olarak uyar; paket bilerek
 * hiçbir Assay paketine bağlanmıyor (docs/stack.md), uyum
 * `tools/ui-contract.test.ts` ile denetleniyor.
 */

export type VerdictKind = 'pass' | 'fail' | 'unknown'

/**
 * Bir oran ve belirsizliği.
 *
 * `rate` ve `ci` birlikte `null` olabilir — gözlem yoksa oran da yoktur.
 * İkisinden yalnızca birinin `null` olduğu bir durum temsil edilemez.
 */
export interface Measurement {
  successes: number
  n: number
  rate: number | null
  ci: { low: number; high: number; level: 0.95 } | null
}

const pct = (value: number) => `${Math.round(value * 100)}%`

/** Oranın tek meşru metin biçimi. */
export function formatMeasurement(value: Measurement): string {
  if (value.rate === null || value.ci === null) return 'no observations (N=0)'
  return `${pct(value.rate)} (N=${value.n}, 95% CI ${pct(value.ci.low)}–${pct(value.ci.high)})`
}

// ---------------------------------------------------------------------------
// Verdict rozeti — renk tek taşıyıcı değil
// ---------------------------------------------------------------------------

const VERDICT: Record<VerdictKind, { glyph: string; label: string; tone: string }> = {
  pass: { glyph: '●', label: 'pass', tone: 'text-pass' },
  fail: { glyph: '✕', label: 'fail', tone: 'text-fail' },
  unknown: { glyph: '◐', label: 'unknown', tone: 'text-unknown' },
}

/**
 * Verdict rozeti.
 *
 * Dolgu yok, zemin yok. İşaret + küçük kapital sözcük. Renk körlüğünde
 * ayrışması için glif de farklı: dolu daire, çarpı, yarım daire.
 */
export function Badge({
  verdict,
  showLabel = true,
}: {
  verdict: VerdictKind
  showLabel?: boolean
}) {
  const mark = VERDICT[verdict]
  return (
    <span className={`mark ${mark.tone}`}>
      <span className="mark-glyph" aria-hidden="true">
        {mark.glyph}
      </span>
      {showLabel ? (
        <span>{mark.label}</span>
      ) : (
        <span className="sr-only">{mark.label}</span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Aralık çizimi
// ---------------------------------------------------------------------------

/**
 * Güven aralığı — çizilmiş bir açıklık.
 *
 * İlerleme çubuğu değil: uçlarında serif olan bir aralık ve içinde ölçülen
 * değeri gösteren bir işaret. Gözlem yoksa yalnızca boş eksen çizilir; bir
 * değer çizmek yalan olurdu.
 */
export function IntervalRule({
  value,
  tone = 'text-text-muted',
}: {
  value: Measurement
  tone?: string
}) {
  if (value.rate === null || value.ci === null) {
    return <div className="interval" aria-hidden="true" />
  }
  const low = value.ci.low * 100
  const high = value.ci.high * 100
  return (
    <div className={`interval ${tone}`} aria-hidden="true">
      <span
        className="interval-span"
        style={{ left: `${low}%`, width: `${Math.max(high - low, 0.6)}%` }}
      />
      <span className="interval-point" style={{ left: `${value.rate * 100}%` }} />
    </div>
  )
}

/**
 * Etiketli ölçüm satırı.
 *
 * `value` zorunlu ve `Measurement` tipinde. Bileşen aralığı sayıdan önce
 * çizer: okuyucu belirsizliğin genişliğini sayıyı okumadan görsün.
 */
export function MetricValue({
  label,
  value,
  tone,
}: {
  label: string
  value: Measurement
  tone?: string
}) {
  return (
    <div className="grid grid-cols-[9rem_1fr_auto] items-center gap-4 py-2">
      <span className="col-label">{label}</span>
      <IntervalRule value={value} {...(tone === undefined ? {} : { tone })} />
      <span className="whitespace-nowrap font-mono text-sm text-text-muted">
        {formatMeasurement(value)}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Boş ve hata durumları
// ---------------------------------------------------------------------------

/**
 * Veri yokken uydurma veri değil, yönlendirici boş durum.
 *
 * `action` bir sonraki adımı söyler; "henüz veri yok" tek başına kullanıcıyı
 * bir yere götürmez.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="border border-rule px-8 py-12 text-center">
      <p className="font-display text-xl">{title}</p>
      <p className="mx-auto mt-3 max-w-[46ch] text-sm text-text-muted">{description}</p>
      {action === undefined ? null : <div className="mt-6">{action}</div>}
    </div>
  )
}

/**
 * Hata durumu.
 *
 * Mesaj özür dilemez ve belirsiz olmaz: ne olduğunu ve ne yapılabileceğini
 * söyler.
 */
export function ErrorState({
  title,
  detail,
  action,
}: {
  title: string
  detail: string
  action?: ReactNode
}) {
  return (
    <div className="border border-fail-rule px-8 py-10">
      <p className="mark text-fail">
        <span className="mark-glyph" aria-hidden="true">
          ✕
        </span>
        <span>{title}</span>
      </p>
      <p className="mt-3 max-w-[60ch] text-sm text-text-muted">{detail}</p>
      {action === undefined ? null : <div className="mt-5">{action}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Uyarı kutusu
// ---------------------------------------------------------------------------

const CALLOUT = {
  info: { rule: 'border-rule', tone: 'text-text-muted', glyph: 'i' },
  warning: { rule: 'border-unknown-rule', tone: 'text-unknown', glyph: '◐' },
  danger: { rule: 'border-fail-rule', tone: 'text-fail', glyph: '✕' },
} as const

export type CalloutTone = keyof typeof CALLOUT

/**
 * Uyarı kutusu — info, warning, danger.
 *
 * Zemini yok; sol kenarında kalın bir çizgi ve bir glif var. Dolgulu renkli
 * kutu bu belgenin dili değil.
 */
export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: CalloutTone
  title: string
  children?: ReactNode
}) {
  const style = CALLOUT[tone]
  return (
    <div
      className={`border-l-2 ${style.rule} py-2 pl-4`}
      role={tone === 'info' ? undefined : 'note'}
    >
      <p className={`mark ${style.tone}`}>
        <span className="mark-glyph" aria-hidden="true">
          {style.glyph}
        </span>
        <span>{title}</span>
      </p>
      {children === undefined ? null : (
        <div className="mt-2 max-w-[64ch] text-sm text-text-muted">{children}</div>
      )}
    </div>
  )
}
