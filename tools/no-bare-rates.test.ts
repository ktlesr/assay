import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Değişmez #4'ün gösterim katmanındaki bekçisi.
 *
 * "Hiçbir oran N ve güven aralığı olmadan gösterilmez" bir kod incelemesi
 * kuralı olarak er geç aşınır: birinin bir tabloya `${Math.round(r*100)}%`
 * yazması yeterli. `Proportion` tipi üretimi koruyor, bu test gösterimi
 * koruyor.
 *
 * Kural: oranı yüzdeye çeviren tek meşru yer biçimlendiricilerdir
 * (`formatProportion` / `formatMeasurement`) ve aralığı çizen bileşendir.
 * Başka her yerde `* 100` yasak.
 */

const root = fileURLToPath(new URL('..', import.meta.url))

/** Yüzdeye çevirmenin meşru olduğu dosyalar. */
const ALLOWED = new Set([
  // Biçimlendiricinin kendisi ve aralığın çizimi.
  'packages/ui/src/measurement.tsx',
  'packages/core/src/records.ts',
  // Karşılaştırma farkı bir oran değil, iki oran arasındaki puan farkı; metin
  // zaten güven aralığından söz ediyor.
  'packages/core/src/compare.ts',
])

const ROOTS = ['apps/web', 'packages/ui/src', 'packages/cli/src', 'packages/core/src']

const PERCENT = /\*\s*100\b/

function sources(dir: string): string[] {
  const absolute = join(root, dir)
  const out: string[] = []
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      if (name === 'node_modules' || name === '.next' || name === 'dist') continue
      const path = join(current, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (['.ts', '.tsx'].includes(extname(path))) out.push(path)
    }
  }
  walk(absolute)
  return out
}

describe('çıplak oran yasağı', () => {
  const files = ROOTS.flatMap(sources)

  it('taranacak dosya bulundu', () => {
    // Tarama boşa düşerse test sessizce yeşile döner; o hâlde koruma yoktur.
    expect(files.length).toBeGreaterThan(20)
  })

  it('biçimlendirici dışında hiçbir yerde oran yüzdeye çevrilmiyor', () => {
    const offenders: string[] = []
    for (const file of files) {
      const rel = relative(root, file).replace(/\\/g, '/')
      if (ALLOWED.has(rel) || rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) {
        continue
      }
      const source = readFileSync(file, 'utf8')
      source.split('\n').forEach((line, index) => {
        if (PERCENT.test(line)) offenders.push(`${rel}:${index + 1} ${line.trim()}`)
      })
    }
    expect(offenders).toEqual([])
  })

  it('kural gerçekten yakalıyor', () => {
    expect(PERCENT.test('const shown = `${Math.round(rate * 100)}%`')).toBe(true)
    expect(PERCENT.test('formatProportion(value)')).toBe(false)
  })
})
