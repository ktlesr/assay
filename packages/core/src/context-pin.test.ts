import { describe, expect, it } from 'vitest'
import { compareRuns } from './compare.js'
import { comparePins, proportion, type Pins, type Run } from './records.js'

/**
 * Bağlam pini (0.4.8) — ölçülmeyen bağlam karşılaştırmayı durdurur.
 *
 * Ölçülmüş kusur: `marketingskills` ifade bağlama deneyinin beş kolu aynı
 * suite hash'ini, aynı dört pini ve aynı ortam hash'ini taşıyordu; tek fark
 * çalışma dizininin üstündeki talimat dosyasının içeriğiydi ve hiçbir pin onu
 * taşımıyordu. `compare C D`, `compare D E` ve `compare C E` üçü de
 * `within_noise` diyordu — Assay üç kolun aynı koşulda ölçüldüğünü iddia
 * ediyordu.
 *
 * Etiketin (0.4.7) bunu çözmediği de burada: etiket bir not, pin değil.
 */

const measured: Pins = {
  skillSource: 'owner/repo@abc',
  skillHash: 'sha256:skill1',
  model: 'model-1',
  systemPromptHash: 'not-provided-by-host',
  suiteVersion: 3,
  suiteHash: 'sha256:suite1',
  environmentHash: 'sha256:env1',
  contextHash: 'sha256:context1',
}

/** 0.4.5 öncesi bir kayıt: bağlam ölçülmedi, alan hiç yok. */
const unmeasured: Pins = Object.fromEntries(
  Object.entries(measured).filter(([key]) => key !== 'contextHash'),
) as Pins

const run = (pins: Pins, label?: string): Run => ({
  id: 'r',
  startedAt: '',
  finishedAt: '',
  host: 'claude-code',
  skill: 'marketing-skills:product-marketing',
  ...(label === undefined ? {} : { label }),
  pins,
  runs: 10,
  cases: [
    {
      caseId: 'collide.cro.pricing_page',
      attempts: [],
      passRate: proportion(10, 10),
      passed: 10,
      failed: 0,
      unknown: 0,
    },
  ],
  verdict: 'pass',
})

describe('comparePins — bağlam ölçülmediyse karşılaştırma durur', () => {
  it('iki tarafta da ölçülmemişse `unavailable`, çünkü aynı olduğu BİLİNMİYOR', () => {
    const result = comparePins(unmeasured, { ...unmeasured })
    expect(result.comparable).toBe(false)
    expect(result.unavailable).toContain('contextHash')
  })

  it('yalnızca bir tarafta ölçülmüşse yine durur', () => {
    expect(comparePins(measured, unmeasured).unavailable).toContain('contextHash')
    expect(comparePins(unmeasured, measured).unavailable).toContain('contextHash')
  })

  it('iki tarafta ölçülmüş ve farklıysa kayma bu pinin ADIYLA raporlanır', () => {
    const other = { ...measured, contextHash: 'sha256:context2' }
    const result = comparePins(measured, other)
    expect(result.comparable).toBe(false)
    expect(result.drifted).toContain('contextHash')
    // Ortam hash'i kımıldamadı; bağlam kaymasını onun adına yazmak
    // 0.3.0-a'daki "yanlış adres" kusurunun aynısı olurdu.
    expect(result.drifted).not.toContain('environmentHash')
  })

  it('iki tarafta ölçülmüş ve aynıysa karşılaştırma açılır', () => {
    expect(comparePins(measured, { ...measured })).toEqual({
      comparable: true,
      drifted: [],
      unavailable: [],
    })
  })
})

describe('compareRuns — beş kolun kusuru', () => {
  it('bağlamı ölçülmemiş iki koşum artık within_noise vermiyor, unknown veriyor', () => {
    // 0.4.4 ile koşulmuş iki kol: bütün pinler eşit, bağlam ölçülmemiş.
    const result = compareRuns(run(unmeasured), run(unmeasured))
    expect(result.verdict).toBe('unknown')
    expect(result.comparable).toBe(false)
    expect(result.cases).toEqual([])
    expect(result.reason).toContain('contextHash')
  })

  it('etiket bu boşluğu kapatmıyor: farklı etiketli iki ölçülmemiş koşum da unknown', () => {
    // Etiket bir pin olsaydı bu vaka "çözülmüş" görünürdü — ve etiketsiz iki
    // kol yine sessizce karşılaştırılırdı. Koruma etikette değil, ölçümde.
    const result = compareRuns(run(unmeasured, 'arm C'), run(unmeasured, 'arm D'))
    expect(result.verdict).toBe('unknown')
    expect(result.reason).toContain('contextHash')
  })

  it('bağlamı ölçülmüş ve aynı olan iki koşum karşılaştırılır', () => {
    const result = compareRuns(run(measured), run(measured))
    expect(result.comparable).toBe(true)
    expect(result.cases).toHaveLength(1)
  })

  it('bağlamı ölçülmüş ama farklı olan iki koşum gerekçesinde bağlamı adlandırır', () => {
    const result = compareRuns(run(measured), run({ ...measured, contextHash: 'sha256:x' }))
    expect(result.comparable).toBe(false)
    expect(result.reason).toContain('contextHash changed')
  })
})
