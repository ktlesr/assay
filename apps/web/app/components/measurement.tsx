import type { Proportion, Verdict } from '@assay/core'
import { formatProportion } from '@assay/core'

/**
 * Ölçüm gösterimi — bu arayüzün imzası.
 *
 * Güven aralığı bir ilerleme çubuğu değil: uçlarında serif olan çizilmiş bir
 * açıklık, bir kumpas gibi. Okuyucu sayıyı okumadan önce belirsizliğin
 * genişliğini görür — kasıtlı, çünkü N=3'teki bir %100 ile N=200'deki bir %100
 * aynı şey değil.
 *
 * Değişmez #4: oran N ve aralık olmadan render EDİLEMEZ. `Proportion` tipi
 * üçünü birlikte taşıyor, bu bileşen de üçünü birlikte çiziyor.
 */

const MARK: Record<Verdict, { glyph: string; label: string; className: string }> = {
  // Renk tek taşıyıcı değil: şekiller de ayrışıyor.
  pass: { glyph: '●', label: 'pass', className: 'text-pass' },
  fail: { glyph: '✕', label: 'fail', className: 'text-fail' },
  unknown: { glyph: '◐', label: 'unknown', className: 'text-unknown' },
}

export function VerdictMark({ verdict }: { verdict: Verdict }) {
  const mark = MARK[verdict]
  return (
    <span className={`mark ${mark.className}`}>
      <span className="mark-glyph" aria-hidden="true">
        {mark.glyph}
      </span>
      <span>{mark.label}</span>
    </span>
  )
}

export function VerdictGlyph({ verdict }: { verdict: Verdict }) {
  const mark = MARK[verdict]
  return (
    <span className={`mark-glyph ${mark.className}`} title={mark.label}>
      <span aria-hidden="true">{mark.glyph}</span>
      <span className="sr-only">{mark.label}</span>
    </span>
  )
}

/**
 * Aralık çizimi.
 *
 * Eksen 0–100. Açıklık aralığın kendisi, içindeki eşkenar işaret ölçülen
 * değer. Gözlem yoksa hiçbir şey çizilmez — boş bir eksen, "%0" değil.
 */
export function IntervalRule({
  value,
  tone = 'text-text-muted',
}: {
  value: Proportion
  tone?: string
}) {
  if (value.rate === null || value.ci === null) {
    return (
      <div className="interval" aria-hidden="true">
        {/* gözlem yok: yalnızca eksen. Bir değer çizmek yalan olurdu. */}
      </div>
    )
  }
  const low = value.ci.low * 100
  const high = value.ci.high * 100
  const point = value.rate * 100
  return (
    <div className={`interval ${tone}`} aria-hidden="true">
      <span
        className="interval-span"
        style={{ left: `${low}%`, width: `${Math.max(high - low, 0.6)}%` }}
      />
      <span className="interval-point" style={{ left: `${point}%` }} />
    </div>
  )
}

/**
 * Etiket + değer + aralık.
 *
 * `label` ve `value` zorunlu; `value` bir `Proportion`, yani N ve aralık
 * yapısal olarak yanında. Çıplak bir sayı geçirmenin yolu yok.
 */
export function Measurement({
  label,
  value,
  tone,
}: {
  label: string
  value: Proportion
  tone?: string
}) {
  return (
    <div className="grid grid-cols-[10rem_1fr_auto] items-center gap-4 py-2">
      <span className="col-label">{label}</span>
      <IntervalRule value={value} {...(tone === undefined ? {} : { tone })} />
      <span className="font-mono text-sm text-text-muted whitespace-nowrap">
        {formatProportion(value)}
      </span>
    </div>
  )
}
