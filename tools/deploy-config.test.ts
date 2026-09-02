import { globSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Dağıtım yapılandırmasının hizası.
 *
 * 2026-09-02'de `ASSAY_PUBLIC_SITE` eklendi ama `docker-compose.yml`'a
 * yazılmadı: değişken Dokploy'a girilse bile konteynere ulaşmıyordu ve yayın
 * modu sessizce hiç açılmıyordu. Kod doğruydu, test yeşildi, özellik yoktu.
 *
 * Bu testler o boşluğu kapatıyor:
 *   1. Uygulamanın okuduğu her ortam değişkeni compose'da geçiriliyor mu?
 *   2. Compose'un beklediği her değişken `.env.example`'da belgeli mi?
 *
 * Birincisi otomatik: kaynaktaki `process.env` okumaları taranıyor, yani yeni
 * bir değişken eklendiğinde listeyi güncellemeyi hatırlamak gerekmiyor.
 */

const compose = readFileSync('docker-compose.yml', 'utf8')
const envExample = readFileSync('.env.example', 'utf8')

/** `.env.example` içinde belgelenmiş anahtarlar. */
const documented = new Set(
  [...envExample.matchAll(/^([A-Z0-9_]+)=/gm)].map((match) => match[1] as string),
)

/**
 * Çalışma zamanının kendi sağladıkları ve derleme sırasında gömülenler.
 * Bunlar dağıtım yapılandırmasına girmez.
 */
const RUNTIME_PROVIDED = new Set([
  'NODE_ENV',
  'NEXT_RUNTIME',
  'NEXT_STANDALONE',
  'PORT',
  'HOSTNAME',
])

/** `apps/web` kaynağında okunan ortam değişkenleri. */
function envReadsInWeb(): string[] {
  const files = [
    ...globSync('apps/web/app/**/*.{ts,tsx}'),
    ...globSync('apps/web/lib/**/*.ts'),
    'apps/web/middleware.ts',
    'apps/web/instrumentation.ts',
  ]

  const names = new Set<string>()
  for (const file of files) {
    let source: string
    try {
      source = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    // process.env['X'] ve process.env.X biçimlerinin ikisi de.
    for (const m of source.matchAll(/process\.env\[['"]([A-Z0-9_]+)['"]\]/g)) {
      names.add(m[1] as string)
    }
    for (const m of source.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      names.add(m[1] as string)
    }
  }
  return [...names]
    .filter((name) => !RUNTIME_PROVIDED.has(name))
    .filter((name) => !name.startsWith('NEXT_PUBLIC_'))
    .sort()
}

describe('dağıtım yapılandırması hizalı', () => {
  const read = envReadsInWeb()

  it('kaynakta okunan değişkenler bulundu', () => {
    // Tarama boşa düşerse aşağıdaki iddialar boş kümede geçer ve test
    // hiçbir şey kanıtlamaz.
    expect(read.length).toBeGreaterThan(3)
  })

  it.each(envReadsInWeb())('%s compose ile konteynere geçiriliyor', (name) => {
    expect(
      compose.includes(name),
      `apps/web ${name} okuyor ama docker-compose.yml onu geçirmiyor — ` +
        `değişken Dokploy'a girilse bile konteynere ulaşmaz`,
    ).toBe(true)
  })

  it.each(envReadsInWeb())('%s .env.example içinde belgeli', (name) => {
    expect(
      documented.has(name),
      `apps/web ${name} okuyor ama .env.example onu belgelemiyor`,
    ).toBe(true)
  })

  it('compose’un beklediği her değişken belgeli', () => {
    const referenced = [...compose.matchAll(/\$\{([A-Z0-9_]+)/g)].map(
      (match) => match[1] as string,
    )
    const undocumented = [...new Set(referenced)].filter((name) => !documented.has(name))
    expect(undocumented, 'compose bunları istiyor ama şablonda yoklar').toEqual([])
  })
})
