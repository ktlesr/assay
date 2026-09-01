import { proportion, type Proportion } from '@ktlsr/assay-core'
import type { Measurement } from '@ktlsr/assay-ui'
import { describe, expect, it } from 'vitest'
import { formatMeasurement } from '@ktlsr/assay-ui'
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
