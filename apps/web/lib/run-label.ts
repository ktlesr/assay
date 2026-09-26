import { labelProblem } from '@ktlsr/assay-core'

/**
 * Yöneticinin girdiği adın ne anlama geldiği (0.4.7-d).
 *
 * Etiket kaydın **tek** değiştirilebilir alanı, o yüzden kuralı tek bir yerde
 * duruyor ve sınanıyor: sunucu eylemi yalnızca bunu çağırıp yazıyor.
 *
 * Şekil denetimi CLI'ınkiyle aynı fonksiyondan geliyor; iki yüzeyin ayrı
 * kuralları olsaydı biri diğerinin kabul ettiği etiketi reddederdi.
 */
export type LabelEdit =
  /** Değer değişmedi — yazma yok, denetim kaydı yok. */
  | { kind: 'unchanged' }
  /** `null` "adı kaldır" demek. */
  | { kind: 'set'; value: string | null }
  | { kind: 'error'; message: string }

export function labelEdit(current: string | null, input: string): LabelEdit {
  const trimmed = input.trim()
  // Boş kutu adı kaldırıyor. Boş bir etiket KAYDEDİLMİYOR: null ile aynı şeyi
  // söyleyip farklı görünürdü ve veritabanı kısıtı da onu reddediyor.
  const next = trimmed === '' ? null : trimmed
  if (next === current) return { kind: 'unchanged' }
  if (next !== null) {
    const problem = labelProblem(next)
    if (problem !== null) return { kind: 'error', message: problem }
  }
  return { kind: 'set', value: next }
}
