import { globSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseSuite } from '../packages/core/src/suite.js'

/**
 * examples/ ve suites/ altındaki suite dosyaları biçim referansıdır. Şema
 * değişip de örnekler güncellenmezse burası kırmızıya döner.
 */
const files = [
  ...globSync('examples/**/*.suite.yaml'),
  ...globSync('suites/**/*.suite.yaml'),
]

describe('örnek vaka setleri', () => {
  it('en az bir örnek var', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s şemadan geçer', (file) => {
    const result = parseSuite(readFileSync(file, 'utf8'))
    expect(result.issues.filter((i) => i.level === 'error')).toEqual([])
    expect(result.ok).toBe(true)
  })
})
