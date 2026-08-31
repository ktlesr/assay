import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

/**
 * 2026-08-31'de bir OAuth token'ı `.env.example` içine yazıldı ve commit'lendi.
 * Şablon dosyası "sır yok" varsayımıyla takip ediliyor; bu testler o varsayımı
 * denetler, iyi niyete bırakmaz.
 */

/** Bilinen sır önekleri. Değerin kendisi asla mesaja yazılmaz. */
const SECRET_PATTERNS: ReadonlyArray<[string, RegExp]> = [
  ['Anthropic API key', /sk-ant-api\w{2}-[\w-]{20,}/],
  ['Anthropic OAuth token', /sk-ant-oat\w{2}-[\w-]{20,}/],
  ['OpenAI key', /\bsk-proj-[\w-]{20,}/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
]

const tracked = execSync('git ls-files', { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)

describe('sır taraması', () => {
  it('git ls-files bir şey döndürüyor', () => {
    expect(tracked.length).toBeGreaterThan(10)
  })

  it('.env takip edilmiyor', () => {
    expect(tracked.filter((f) => f === '.env' || f.startsWith('.env.'))).toEqual([
      '.env.example',
    ])
  })

  it('.env.example içindeki her değer boş', () => {
    const filled = readFileSync('.env.example', 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^\s*[A-Z0-9_]+\s*=\s*\S/.test(line))
      .map((line) => line.split('=')[0]?.trim())
    expect(filled, 'şablona gerçek bir değer yazılmış').toEqual([])
  })

  it('takip edilen hiçbir dosyada sır deseni yok', () => {
    const hits: string[] = []
    for (const file of tracked) {
      let source: string
      try {
        source = readFileSync(file, 'utf8')
      } catch {
        continue // ikili dosya
      }
      for (const [label, pattern] of SECRET_PATTERNS) {
        // Kendi desen tanımlarımız eşleşmesin.
        if (file === 'tools/secrets.test.ts') continue
        if (pattern.test(source)) hits.push(`${file}: ${label}`)
      }
    }
    expect(hits).toEqual([])
  })
})
