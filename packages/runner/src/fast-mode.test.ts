/**
 * 0.3.0-e — hızlı mod.
 *
 * Kural: **yarım vaka üretme.** Hızlı mod dar bir ölçüm, eksik bir ölçüm
 * değil. Sınananlar:
 *   - ölçülen katmanlar kayda yazılıyor
 *   - yalnızca artefakt ölçen vaka hiç koşulmuyor ve sebebiyle kayda giriyor
 *   - koşulan vakada assertion'lar `unknown`a çevrilmiyor, ayrı listede
 *   - bütçe tavanı dolunca kalan vakalar sebebiyle kayda giriyor
 *
 * Her iddianın yanında bir **pozitif kontrol** var: "atlandı" diyen bir test,
 * hiçbir şey koşulmadığında da yeşil kalabilir. Bu tuzağa 0.3.0-c ve -d'de iki
 * kez düşüldü; burada baştan kapatılıyor.
 */

import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSuite, type Suite } from '@ktlsr/assay-core'
import { beforeAll, describe, expect, it } from 'vitest'
import { runSuite } from './run.js'
import { MockAdapter, type MockScenario } from './testing/mock-adapter.js'

/**
 * Üç vaka: tetiklenme + assertion, yalnız tetiklenme, yalnız assertion.
 * Üçüncüsü hızlı modda ölçülecek hiçbir şey taşımıyor.
 */
const SUITE_SOURCE = `
version: 1
target: { skill: widget, source: local@abc123 }
environment:
  host: mock
  model: test-model-1
  system_prompt_hash: sha256:aaa
runs: 5
cases:
  - id: trigger.positive.explicit
    prompt: one
    expect:
      triggered: true
      assertions:
        - { type: file_exists, path: 'out/*' }
        - { type: side_effect, network: deny }
  - id: trigger.negative.near_neighbor.readme
    prompt: two
    expect: { triggered: false }
  - id: complete.only_artifact
    prompt: three
    expect:
      assertions:
        - { type: file_exists, path: 'out/manifest.json' }
`

const triggered = (): MockScenario => ({
  trigger: {
    available: true,
    triggered: true,
    skills: ['widget'],
    refused: false,
    refusals: [],
    complete: true,
    via: 'mock',
  },
  trace: [{ seq: 1, kind: 'session_end', outcome: 'completed' }],
})

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const envAdapter = join(repoRoot, 'tools/fixtures/env-adapter.mjs')

let suite: Suite
let skillPath: string

beforeAll(async () => {
  const parsed = parseSuite(SUITE_SOURCE)
  if (!parsed.ok) throw new Error(parsed.issues.map((i) => i.message).join('; '))
  suite = parsed.suite
  skillPath = await mkdtemp(join(tmpdir(), 'assay-skill-'))
  await writeFile(join(skillPath, 'SKILL.md'), '# widget\n')
  // Worker derlenmiş `dist`ten koşuyor; bayat `dist` eski kodu ölçer.
  execFileSync(process.execPath, [join(repoRoot, 'node_modules/typescript/bin/tsc'), '-b'], {
    cwd: repoRoot,
    stdio: 'inherit',
  })
}, 180_000)

const fastRun = (extra: Record<string, unknown> = {}) =>
  runSuite(suite, new MockAdapter({ scenarios: [triggered()] }), {
    source: SUITE_SOURCE,
    skillPath,
    repeat: 3,
    layers: ['trigger'],
    ...extra,
  })

describe('ölçülen katman kayda giriyor', () => {
  it('hizli modda layers yaziliyor, tam modda yazilmiyor', async () => {
    const fast = await fastRun()
    expect(fast.layers).toEqual(['trigger'])

    // Pozitif kontrol: tam modda alan yok, yani `layers` gerçekten moda bağlı.
    const full = await runSuite(suite, new MockAdapter({ scenarios: [triggered()] }), {
      source: SUITE_SOURCE,
      skillPath,
      repeat: 2,
    })
    expect(full.layers).toBeUndefined()
  })
})

describe('yalnızca artefakt ölçen vaka koşulmuyor', () => {
  it('atlanan vaka sebebiyle kayda giriyor; digerleri KOSULUYOR', async () => {
    const record = await fastRun()

    // Pozitif kontrol önce: bir şeyler gerçekten koşmuş olmalı. Bu satır
    // olmadan "hiçbir şey koşmadı" hâli de testi geçerdi.
    expect(record.cases.map((c) => c.caseId)).toEqual([
      'trigger.positive.explicit',
      'trigger.negative.near_neighbor.readme',
    ])
    expect(record.cases.every((c) => c.attempts.length === 3)).toBe(true)

    // Ve atlanan vaka kayıtta, sebebiyle.
    expect(record.skipped).toEqual([
      {
        caseId: 'complete.only_artifact',
        reason:
          'the case only declares assertions, and this run measured the trigger layer only',
      },
    ])
  })

  it('atlanan vaka cases icinde SIFIR denemeyle gorunmuyor', async () => {
    // "Koşulmadı" ile "koşuldu, karar çıkmadı" ayrı şeyler; N=0'lık bir satır
    // ikincisi gibi okunurdu.
    const record = await fastRun()
    expect(record.cases.some((c) => c.caseId === 'complete.only_artifact')).toBe(false)
  })

  it('tam modda o vaka da kosuluyor', async () => {
    // Pozitif kontrol: vakayı eleyen şey hızlı mod, vakanın kendisi değil.
    const full = await runSuite(suite, new MockAdapter({ scenarios: [triggered()] }), {
      source: SUITE_SOURCE,
      skillPath,
      repeat: 2,
    })
    expect(full.cases.map((c) => c.caseId)).toContain('complete.only_artifact')
    expect(full.skipped).toBeUndefined()
  })
})

describe('assertionlar unknowna çevrilmiyor', () => {
  it('degerlendirilmeyen assertionlar ayri listede ve verdict unknown DEGIL', async () => {
    const record = await fastRun()
    const withAssertions = record.cases.find(
      (c) => c.caseId === 'trigger.positive.explicit',
    )
    const attempt = withAssertions?.attempts[0]

    // Beyan edilen iki assertion listeleniyor…
    expect(attempt?.notEvaluated?.map((a) => a.type)).toEqual([
      'file_exists',
      'side_effect',
    ])
    // …sonuç listesinde değiller…
    expect(attempt?.assertions).toEqual([])
    // …ve koşum ölçülemez ilan edilmiyor: hiçbir deneme `unknown` değil.
    expect(attempt?.verdict).toBe('pass')
    expect(record.cases.every((c) => c.unknown === 0)).toBe(true)

    /*
     * Pozitif kontrol: koşum gerçekten ölçüm yapıyor.
     *
     * Sahte adaptör her vakada tetikliyor, yani negatif vaka DÜŞMELİ. Koşum
     * verdict'i `fail` — ve bu iyi haber: `unknown` olmaması, hiçbir şey
     * ölçülmediği için değil, ölçülüp karar verildiği için.
     */
    expect(record.verdict).toBe('fail')
    const negative = record.cases.find(
      (c) => c.caseId === 'trigger.negative.near_neighbor.readme',
    )
    expect(negative?.failed).toBe(3)
  })

  it('tam modda ayni assertionlar degerlendiriliyor', async () => {
    // Pozitif kontrol: `notEvaluated` moda bağlı, assertion'ın kendisine değil.
    const full = await runSuite(suite, new MockAdapter({ scenarios: [triggered()] }), {
      source: SUITE_SOURCE,
      skillPath,
      repeat: 1,
    })
    const attempt = full.cases[0]?.attempts[0]
    expect(attempt?.notEvaluated).toBeUndefined()
    expect(attempt?.assertions.length).toBe(2)
  })
})

describe('bütçe tavanı', () => {
  it('tavan dolunca kalan vaka sebebiyle kayda giriyor', async () => {
    // Tavan 3: ilk vaka (3 deneme) koşar, ikincisi sığmaz.
    const record = await fastRun({ maxAttempts: 3 })
    expect(record.cases.map((c) => c.caseId)).toEqual(['trigger.positive.explicit'])
    expect(record.skipped?.map((s) => s.caseId)).toContain(
      'trigger.negative.near_neighbor.readme',
    )
    expect(record.skipped?.find((s) => s.caseId === 'trigger.negative.near_neighbor.readme')?.reason).toContain(
      'attempt budget of 3',
    )
  })

  it('tavan genisse hicbir vaka bu sebeple atlanmiyor', async () => {
    // Pozitif kontrol: tavan gerçekten sınır, sabit bir davranış değil.
    const record = await fastRun({ maxAttempts: 100 })
    expect(record.skipped?.every((s) => !s.reason.includes('budget'))).toBe(true)
  })
})

/**
 * Süreç sınırını geçen hızlı mod.
 *
 * Bu testin varlık sebebi gerçek bir kusur: `layers` worker payload'ında yoktu
 * ve izole koşumda (CLI'ın varsayılanı) assertion'lar yine değerlendiriliyordu.
 * Süreç içi birim testleri sınırı geçmediği için hepsi yeşildi; kusuru uçtan
 * uca duman testi gösterdi. Artık burada kilitli.
 */
describe('hızlı mod izolasyonla birlikte', () => {
  it('worker da katman filtresini uyguluyor', async () => {
    const record = await runSuite(suite, new MockAdapter({ scenarios: [triggered()] }), {
      source: SUITE_SOURCE,
      skillPath,
      repeat: 1,
      layers: ['trigger'],
      isolate: { module: envAdapter, export: 'EnvReportingAdapter' },
      attemptTimeoutMs: 60_000,
    })

    const withAssertions = record.cases.find(
      (c) => c.caseId === 'trigger.positive.explicit',
    )
    const attempt = withAssertions?.attempts[0]
    // Pozitif kontrol: deneme gerçekten worker'da koştu (fixture adaptörün izi).
    expect(attempt?.trigger.available && attempt.trigger.via).toContain('PORT=')
    // Ve assertion'lar değerlendirilmedi.
    expect(attempt?.assertions).toEqual([])
    expect(attempt?.notEvaluated?.map((a) => a.type)).toEqual(['file_exists', 'side_effect'])
  }, 120_000)
})
