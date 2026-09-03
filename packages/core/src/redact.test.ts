import { describe, expect, it } from 'vitest'
import { containsHomePath, containsSecret, redact, redactDeep } from './redact.js'

describe('sır maskeleme', () => {
  it('bilinen anahtar biçimlerini maskeler', () => {
    // Desen kaynakta düz yazılmıyor: `tools/scan-history.mjs` takip edilen
    // dosyalarda sır deseni arıyor ve kendi testimizi sızıntı sanıyordu.
    const text = `key=${['sk', 'ant', 'api01'].join('-')}-abcdefghijklmnopqrstuvwxyz012345`
    expect(redact(text)).toBe('key=[redacted:anthropic-api-key]')
    expect(containsSecret(text)).toBe(true)
  })
})

/**
 * Ev dizini yolları.
 *
 * Kayıt CI artefaktı olarak yükleniyor, HTML raporuna basılıyor ve hosted
 * tarafta yayımlanabiliyor. İz metinleri mutlak yollarla dolu ve o yollar
 * işletim sistemi kullanıcı adını taşıyor — yani bir skill yazarı kendi
 * koşumunu paylaştığında makine kullanıcı adını da paylaşıyor.
 */
describe('ev dizini maskeleme', () => {
  it('Windows kullanıcı adını maskeler, yolun geri kalanını korur', () => {
    const text = String.raw`Base directory: C:\Users\ada\AppData\Local\Temp\assay-skill-Mbz\skills`
    expect(redact(text)).toBe(
      String.raw`Base directory: C:\Users\<user>\AppData\Local\Temp\assay-skill-Mbz\skills`,
    )
  })

  it('Windows yolunu eğik çizgiyle yazılmış hâlinde de yakalar', () => {
    expect(redact('python C:/Users/ada/Temp/out/test.py')).toBe(
      'python C:/Users/<user>/Temp/out/test.py',
    )
  })

  it('macOS ve Linux ev dizinlerini maskeler', () => {
    expect(redact('open /Users/ada/projects/app/index.html')).toBe(
      'open /Users/<user>/projects/app/index.html',
    )
    expect(redact('cd /home/ada/work && ls')).toBe('cd /home/<user>/work && ls')
  })

  // CI koşucusu bir kimlik değil; maskelemek yolu okunmaz yapar, kimseyi korumaz.
  it('genel hesap adlarına dokunmaz', () => {
    const ci = '/home/runner/work/assay/assay'
    expect(redact(ci)).toBe(ci)
    expect(containsHomePath(ci)).toBe(false)
  })

  it('maskelenmiş metni yeniden maskelemez', () => {
    const once = redact(String.raw`C:\Users\ada\x`)
    expect(redact(once)).toBe(once)
  })

  it('sızıntıyı tespit eder ve maskeledikten sonra tespit etmez', () => {
    const text = 'ran /Users/ada/bin/tool'
    expect(containsHomePath(text)).toBe(true)
    expect(containsHomePath(redact(text))).toBe(false)
  })

  // Asıl sızıntı yüzeyi: iz olaylarının metni ve araç argümanları.
  it('iç içe iz nesnelerinde de maskeler', () => {
    const trace = [
      {
        kind: 'tool_call',
        tool: 'Read',
        args: { file_path: String.raw`C:\Users\ada\Temp\app\index.html` },
      },
      { kind: 'assistant_message', text: 'I read /home/ada/notes.md first.' },
    ]
    const clean = redactDeep(trace)
    expect(JSON.stringify(clean)).not.toContain('ada')
    expect(clean[0]?.args?.file_path).toBe(
      String.raw`C:\Users\<user>\Temp\app\index.html`,
    )
    expect(clean[1]?.text).toBe('I read /home/<user>/notes.md first.')
  })
})
