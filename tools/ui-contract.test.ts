import { proportion, type Proportion } from '@ktlsr/assay-core'
import type { Measurement } from '@ktlsr/assay-ui'
import { describe, expect, it } from 'vitest'
import { formatBounds, formatMeasurement } from '@ktlsr/assay-ui'
import { formatProportion } from '@ktlsr/assay-core'

/**
 * `@ktlsr/assay-ui` bilerek hiçbir Assay paketine bağlanmıyor: tasarım sistemi
 * kendi başına kullanılabilir olmalı. Ama `Measurement` tipi core'daki
 * `Proportion` ile **yapısal olarak** uyumlu kalmak zorunda, yoksa ekranlar
 * ölçümü taşıyamaz.
 *
 * Bu test uyumu tip seviyesinde ve davranış seviyesinde denetliyor.
 */

describe('ui ⇄ core sözleşmesi', () => {
  it('core Proportion, ui Measurement olarak kullanılabilir', () => {
    // Derleme zamanı kontrolü: atama tutmuyorsa typecheck kırılır.
    const fromCore: Proportion = proportion(8, 10)
    const asMeasurement: Measurement = fromCore
    expect(asMeasurement.n).toBe(10)
  })

  it('gözlemsiz oran da atanabilir', () => {
    const empty: Measurement = proportion(0, 0)
    expect(empty.rate).toBeNull()
    expect(empty.ci).toBeNull()
  })

  it('iki biçimlendirici aynı metni üretir', () => {
    for (const [successes, n] of [
      [8, 10],
      [20, 20],
      [0, 0],
      [4, 10],
      [0, 10],
    ] as const) {
      const value = proportion(successes, n)
      expect(formatMeasurement(value), `${successes}/${n}`).toBe(formatProportion(value))
    }
  })

  it('ui paketi hiçbir Assay paketine bağımlı değil', async () => {
    const { readFileSync } = await import('node:fs')
    const pkg = JSON.parse(readFileSync('packages/ui/package.json', 'utf8')) as {
      dependencies?: Record<string, string>
      peerDependencies?: Record<string, string>
    }
    const assayDeps = Object.keys({
      ...(pkg.dependencies ?? {}),
      ...(pkg.peerDependencies ?? {}),
    }).filter((d) => d.startsWith('@ktlsr/assay'))
    expect(assayDeps).toEqual([])
  })
})

/**
 * Aralık etiketi tek parça.
 *
 * Uçlar ayrı ayrı konumlandığında dar aralıkta üst üste biniyorlardı ve dar
 * aralık tam da sayının en çok okunmak istendiği yer. Eşikle çözülemez: aynı
 * bileşen 6rem'lik bir satırda da, geniş bir karnede de kullanılıyor.
 */
describe('aralık uç etiketi', () => {
  const measurement = (low: number, high: number) => ({
    successes: 1,
    n: 1,
    rate: (low + high) / 2,
    ci: { low, high, level: 0.95 as const },
  })

  it('iki ucu tek etikette birleştirir', () => {
    expect(formatBounds(measurement(0.89, 1))).toBe('89%–100%')
  })

  it('dar aralıkta da tek etiket üretir — çakışacak iki etiket yok', () => {
    expect(formatBounds(measurement(0.72, 0.74))).toBe('72%–74%')
  })

  it('ölçüm yoksa etiket de yok', () => {
    expect(formatBounds({ successes: 0, n: 0, rate: null, ci: null })).toBeNull()
  })
})
