/**
 * Ölçüm metinleri — saf fonksiyonlar, çalışma zamanı yok.
 *
 * `measurement.tsx` bir istemci modülü (`'use client'`); oradan dışa verilen
 * bir fonksiyon sunucu bileşeninden **çağrılamıyor**, yalnızca render
 * edilebiliyor. Bu dosya o sınırın dışında duruyor ki sayfa sunucuda da aynı
 * cümleyi üretebilsin.
 */

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

export const pct = (value: number) => `${Math.round(value * 100)}%`

/** Oranın tek meşru metin biçimi. */
export function formatMeasurement(value: Measurement): string {
  if (value.rate === null || value.ci === null) return 'no observations (N=0)'
  return `${pct(value.rate)} (N=${value.n}, 95% CI ${pct(value.ci.low)}–${pct(value.ci.high)})`
}

/**
 * Sayımın düz cümlesi. Yüzdeyi okumadan önce okunan satır.
 *
 * "20 denemenin 14'ünde tetiklendi" cümlesi, istatistik bilmeyen okuyucuya
 * "%70"ten daha fazlasını söylüyor: paydayı da görüyor.
 */
export function countSentence(value: Measurement, verb = 'held'): string {
  if (value.n === 0) return 'not measured yet'
  return `${verb} in ${value.successes} of ${value.n} attempts`
}

/**
 * Aralığın genişliğinin ne anlama geldiği, tek cümlede.
 *
 * Geniş aralık kullanıcıya kusur gibi görünüyor; oysa ölçümün dürüstlüğü.
 * Cümle bunu söylüyor ve ne yapılacağını da söylüyor.
 */
export function intervalGloss(value: Measurement): string | null {
  if (value.rate === null || value.ci === null) return null
  const width = value.ci.high - value.ci.low
  if (width > 0.4) {
    return `${value.n} attempts leave this very unsettled — run more to narrow it.`
  }
  if (width > 0.2) {
    return `${value.n} attempts narrow it this far; more would narrow it further.`
  }
  return `${value.n} attempts settle it to a narrow range.`
}
