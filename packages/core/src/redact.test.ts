import { describe, expect, it } from 'vitest'
import { containsSecret, redact, redactDeep } from './redact.js'

/**
 * Koşum kayıtları CI artefaktı olarak yükleniyor. Ölçülen skill bir sırrı
 * ekrana basarsa iz üzerinden oraya sızar. Maskeleme ikinci savunma hattı;
 * birincisi ajana ortam değişkenlerini hiç vermemek.
 */

/**
 * Örnekler parça parça kuruluyor.
 *
 * Kaynakta düz yazılsalardı pre-commit sır tarayıcısı commit'i reddederdi —
 * ve haklı olurdu: bir tarayıcının "bu test verisi" diye ayrım yapması
 * beklenemez. Tarayıcıyı gevşetmek yerine test verisi çalışma zamanında
 * birleştiriliyor.
 */
const join = (...parts: string[]) => parts.join('')

const samples: ReadonlyArray<[string, string]> = [
  ['anthropic-api-key', join('sk-', 'ant-', 'api03-', 'A'.repeat(40))],
  ['anthropic-oauth-token', join('sk-', 'ant-', 'oat01-', 'B'.repeat(40))],
  ['openai-key', join('sk-', 'proj-', 'C'.repeat(40))],
  ['github-token', join('gh', 'p_', 'D'.repeat(36))],
  ['aws-access-key', join('AKI', 'A', 'IOSFODNN7EXAMPLE')],
  ['google-api-key', join('AI', 'za', 'E'.repeat(35))],
  ['slack-token', join('xo', 'xb-', '1'.repeat(20))],
  ['private-key', join('-----BEGIN ', 'RSA ', 'PRIVATE ', 'KEY-----')],
]

describe('redact', () => {
  it.each(samples)('%s maskelenir', (label, secret) => {
    const masked = redact(`token is ${secret} ok`)
    expect(masked).not.toContain(secret)
    expect(masked).toContain(`[redacted:${label}]`)
  })

  it('sırrın varlığını gizlemez, yalnızca değerini siler', () => {
    expect(redact(`x ${samples[0]?.[1] ?? ''} y`)).toBe(
      'x [redacted:anthropic-api-key] y',
    )
  })

  it('aynı metinde birden çok sır maskelenir', () => {
    const text = `${samples[0]?.[1]} and ${samples[3]?.[1]}`
    const masked = redact(text)
    expect(masked).toContain('[redacted:anthropic-api-key]')
    expect(masked).toContain('[redacted:github-token]')
  })

  it('sırasız metne dokunmaz', () => {
    const text = 'wrote out/manifest.json with two widgets'
    expect(redact(text)).toBe(text)
  })

  it('kısa benzer dizeler yanlışlıkla maskelenmez', () => {
    const short = join('sk-', 'ant-', 'api03-', 'short')
    expect(redact(short)).toBe(short)
  })
})

describe('containsSecret', () => {
  it.each(samples)('%s tanınır', (_label, secret) => {
    expect(containsSecret(secret)).toBe(true)
  })

  it('düz metin için false', () => {
    expect(containsSecret('nothing to see')).toBe(false)
  })
})

describe('redactDeep', () => {
  it('iç içe nesnelerde maskeler — araç argümanları böyle geliyor', () => {
    const trace = [
      {
        seq: 1,
        kind: 'tool_call',
        tool: 'Bash',
        args: { command: `curl -H "Authorization: ${samples[3]?.[1]}"` },
      },
      { seq: 2, kind: 'assistant_message', text: `used ${samples[0]?.[1]}` },
    ]
    const masked = redactDeep(trace)
    const serialized = JSON.stringify(masked)
    expect(serialized).not.toContain(join('gh', 'p_'))
    expect(serialized).not.toContain(join('sk-', 'ant-', 'api03-A'))
    expect(serialized).toContain('[redacted:github-token]')
  })

  it('sayı, boolean ve null olduğu gibi kalır', () => {
    expect(redactDeep({ a: 1, b: true, c: null })).toEqual({ a: 1, b: true, c: null })
  })

  it('dizi yapısını korur', () => {
    expect(redactDeep(['a', 'b'])).toEqual(['a', 'b'])
  })
})
