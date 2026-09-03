import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseSuite, type Suite } from '@ktlsr/assay-core'
import { beforeAll, describe, expect, it } from 'vitest'
import { runSuite, suiteHash } from './run.js'
import { RunStore } from './store.js'
import { BLIND_HOST, MockAdapter, type MockScenario } from './testing/mock-adapter.js'

const SUITE_SOURCE = `
version: 2
target: { skill: widget, source: local@abc123 }
environment:
  host: mock
  model: test-model-1
  system_prompt_hash: sha256:aaa
  active_skills: [widget, pdf]
runs: 3
cases:
  - id: trigger.positive.explicit
    prompt: Turn this draft into a widget.
    expect: { triggered: true }
  - id: trigger.negative.near_neighbor.readme
    prompt: Turn this draft into a README.
    expect: { triggered: false }
`

let suite: Suite
let skillPath: string

beforeAll(async () => {
  const parsed = parseSuite(SUITE_SOURCE)
  if (!parsed.ok) throw new Error(parsed.issues.map((i) => i.message).join('; '))
  suite = parsed.suite
  skillPath = await mkdtemp(join(tmpdir(), 'assay-skill-'))
})

const triggered = (skills: string[] = ['widget']): MockScenario => ({
  trigger: { available: true, triggered: true, skills, complete: true, via: 'mock' },
  trace: [
    { seq: 1, kind: 'skill_trigger', skill: 'widget' },
    { seq: 2, kind: 'session_end', outcome: 'completed' },
  ],
})

const notTriggered: MockScenario = {
  trigger: { available: true, triggered: false, skills: [], complete: true, via: 'mock' },
  trace: [{ seq: 1, kind: 'session_end', outcome: 'completed' }],
}

const run = (
  adapter: MockAdapter,
  overrides: Partial<Parameters<typeof runSuite>[2]> = {},
) => runSuite(suite, adapter, { source: SUITE_SOURCE, skillPath, ...overrides })

describe('runSuite — temel akış', () => {
  it('her vaka için suite.runs kadar attempt üretir', async () => {
    const result = await run(new MockAdapter({ scenarios: [triggered(), notTriggered] }))
    expect(result.runs).toBe(3)
    expect(result.cases).toHaveLength(2)
    for (const caseResult of result.cases) {
      expect(caseResult.attempts).toHaveLength(3)
      expect(caseResult.attempts.map((a) => a.index)).toEqual([0, 1, 2])
    }
  })

  it('adaptöre vaka istemini ve skill yolunu geçer', async () => {
    const adapter = new MockAdapter({ scenarios: [triggered()] })
    await run(adapter)
    expect(adapter.started).toHaveLength(6)
    expect(adapter.started[0]?.prompt).toContain('widget')
    // Ajana canlı skill dizini değil, kopyası verilir (1.3 güvenlik incelemesi).
    expect(adapter.started[0]?.skill.path).not.toBe(skillPath)
    expect(adapter.started[0]?.skill.path).toContain('assay-skill-')
    expect(adapter.started[0]?.model).toBe('test-model-1')
    expect(adapter.started[0]?.activeSkills).toEqual(['widget', 'pdf'])
  })

  it('her attempt kendi çalışma dizininde koşar', async () => {
    const adapter = new MockAdapter({ scenarios: [triggered()] })
    await run(adapter)
    const dirs = adapter.started.map((c) => c.workdir)
    expect(new Set(dirs).size).toBe(dirs.length)
  })

  it('ilerleme geri çağrısı her attempt için tetiklenir', async () => {
    const seen: string[] = []
    await run(new MockAdapter({ scenarios: [triggered(), notTriggered] }), {
      onProgress: (event) => seen.push(`${event.caseId}#${event.attempt}`),
    })
    expect(seen).toHaveLength(6)
    expect(seen[0]).toBe('trigger.positive.explicit#0')
  })

  it('repeat seçeneği suite.runs yerine geçer', async () => {
    const result = await run(new MockAdapter({ scenarios: [triggered()] }), { repeat: 1 })
    expect(result.runs).toBe(1)
    expect(result.cases[0]?.attempts).toHaveLength(1)
  })
})

describe('runSuite — verdict üretimi', () => {
  it('doğru tetiklenme pass verir', async () => {
    // Vaka 1 pozitif, vaka 2 negatif; senaryolar sırayla dönüyor.
    const result = await runSuite(
      { ...suite, cases: [suite.cases[0] as never] },
      new MockAdapter({ scenarios: [triggered()] }),
      { source: SUITE_SOURCE, skillPath },
    )
    expect(result.cases[0]?.passed).toBe(3)
    expect(result.verdict).toBe('pass')
  })

  it('yanlış tetiklenme fail verir', async () => {
    const result = await runSuite(
      { ...suite, cases: [suite.cases[0] as never] },
      new MockAdapter({ scenarios: [notTriggered] }),
      { source: SUITE_SOURCE, skillPath },
    )
    expect(result.cases[0]?.failed).toBe(3)
    expect(result.verdict).toBe('fail')
  })

  it('okunamayan sinyal unknown verir, pass değil', async () => {
    const result = await run(new MockAdapter({ scenarios: [BLIND_HOST] }))
    expect(result.verdict).toBe('unknown')
    for (const caseResult of result.cases) {
      expect(caseResult.unknown).toBe(3)
      expect(caseResult.passed).toBe(0)
    }
  })

  it('unknown attempt gerekçesini taşır', async () => {
    const result = await run(new MockAdapter({ scenarios: [BLIND_HOST] }))
    expect(result.cases[0]?.attempts[0]?.reason).toContain('could not be read')
  })
})

describe('runSuite — değişmez #4: oran N ve GA ile', () => {
  it('passRate Proportion tipinde ve aralık taşır', async () => {
    const result = await runSuite(
      { ...suite, cases: [suite.cases[0] as never] },
      new MockAdapter({ scenarios: [triggered()] }),
      { source: SUITE_SOURCE, skillPath },
    )
    const rate = result.cases[0]?.passRate
    expect(rate?.n).toBe(3)
    expect(rate?.rate).toBe(1)
    expect(rate?.ci?.low).toBeGreaterThan(0)
    expect(rate?.ci?.low).toBeLessThan(1)
  })

  it('hepsi unknown ise oran null — %0 ile karışmaz', async () => {
    const result = await run(new MockAdapter({ scenarios: [BLIND_HOST] }))
    expect(result.cases[0]?.passRate.n).toBe(0)
    expect(result.cases[0]?.passRate.rate).toBeNull()
    expect(result.cases[0]?.passRate.ci).toBeNull()
  })
})

describe('runSuite — adaptör çökerse', () => {
  it('start patlarsa attempt unknown olur, koşum devam eder', async () => {
    const result = await run(
      new MockAdapter({ scenarios: [{ failOnStart: 'host binary missing' }] }),
    )
    expect(result.cases).toHaveLength(2)
    expect(result.cases[0]?.attempts[0]?.verdict).toBe('unknown')
    expect(result.cases[0]?.attempts[0]?.reason).toContain('host binary missing')
  })

  it('readTrace patlarsa iz yok sayılır ama koşum düşmez', async () => {
    const result = await run(
      new MockAdapter({
        scenarios: [{ ...triggered(), failOnReadTrace: 'transcript gone' }],
      }),
    )
    expect(result.cases[0]?.attempts[0]?.verdict).toBe('pass')
    expect(result.cases[0]?.attempts[0]?.trace).toBeUndefined()
  })

  it('bir attempt çökse de diğerleri koşar', async () => {
    const result = await run(
      new MockAdapter({ scenarios: [{ failOnStart: 'boom' }, triggered()] }),
    )
    const verdicts = result.cases.flatMap((c) => c.attempts.map((a) => a.verdict))
    expect(verdicts).toContain('unknown')
    expect(verdicts).toContain('pass')
  })
})

describe('runSuite — skill dizini korunur', () => {
  it('tüm attempt"ler aynı kopyayı kullanır, kaynağa dokunulmaz', async () => {
    const adapter = new MockAdapter({ scenarios: [triggered()] })
    await run(adapter)
    const paths = new Set(adapter.started.map((c) => c.skill.path))
    expect(paths.size).toBe(1)
    expect([...paths][0]).not.toBe(skillPath)
  })
})

describe('runSuite — dört pin', () => {
  it('dört pin suite ve kaynaktan gelir', async () => {
    const result = await run(new MockAdapter({ scenarios: [triggered()] }))
    expect(result.pins).toMatchObject({
      skillSource: 'local@abc123',
      model: 'test-model-1',
      systemPromptHash: 'sha256:aaa',
      suiteVersion: 2,
    })
    expect(result.pins.suiteHash).toBe(suiteHash(SUITE_SOURCE))
  })

  it('suite içeriği değişince hash değişir, sürüm değişmese bile', () => {
    const edited = SUITE_SOURCE.replace(
      'Turn this draft into a widget.',
      'Make a widget.',
    )
    expect(suiteHash(edited)).not.toBe(suiteHash(SUITE_SOURCE))
  })

  it("satır sonu biçimi hash'i değiştirmez", () => {
    expect(suiteHash(SUITE_SOURCE.replace(/\n/g, '\r\n'))).toBe(suiteHash(SUITE_SOURCE))
  })
})

describe('RunStore', () => {
  it('koşumu yazar ve aynısını geri okur', async () => {
    const root = await mkdtemp(join(tmpdir(), 'assay-store-'))
    const store = new RunStore({ root })
    const result = await run(new MockAdapter({ scenarios: [triggered()] }))

    await store.save(result)
    const loaded = await store.load(result.id)
    expect(loaded.id).toBe(result.id)
    expect(loaded.pins).toEqual(result.pins)
    expect(loaded.cases[0]?.passRate).toEqual(result.cases[0]?.passRate)
  })

  it('koşumları listeler ve en sonuncuyu verir', async () => {
    const root = await mkdtemp(join(tmpdir(), 'assay-store-'))
    const store = new RunStore({ root })
    const first = await run(new MockAdapter({ scenarios: [triggered()] }))
    await store.save(first)
    expect(await store.list()).toEqual([first.id])
    expect((await store.latest())?.id).toBe(first.id)
  })

  it('boş store null döner, patlamaz', async () => {
    const root = await mkdtemp(join(tmpdir(), 'assay-store-'))
    expect(await new RunStore({ root }).latest()).toBeNull()
  })

  it('tanınmayan store sürümü reddedilir', async () => {
    const root = await mkdtemp(join(tmpdir(), 'assay-store-'))
    await mkdir(join(root, 'runs'), { recursive: true })
    await writeFile(
      join(root, 'runs', 'x.json'),
      JSON.stringify({ storeVersion: 999, run: {} }),
      'utf8',
    )
    await expect(new RunStore({ root }).load('x')).rejects.toThrow('store version 999')
  })
})

/**
 * Kayıt kendi içinde tutarlı olmalı.
 *
 * Kusur gerçek bir koşumda görüldü: tetiklenme vakalarında `assertions` boştu
 * ama `reason` "all 1 assertion(s) passed" diyordu; tamamlama vakasında dört
 * assertion listeleniyordu ve `reason` "all 5" diyordu. Tetiklenme kontrolü
 * sayıya giriyor ama hiçbir listede görünmüyordu.
 *
 * Bu JSON'u ileride başkaları okuyup rapor üretecek. Sayının neyi saydığı
 * kayıttan anlaşılabilir olmalı.
 */
describe('runSuite — kayıt kendi içinde tutarlı', () => {
  const countIn = (reason: string): number | null => {
    const match = /^all (\d+) check\(s\) passed$/.exec(reason)
    return match === null ? null : Number(match[1])
  }

  it('geçen attempt sayısı listelenen kontrollerle uyuşur', async () => {
    const result = await run(new MockAdapter({ scenarios: [triggered(), notTriggered] }))
    const attempts = result.cases.flatMap((c) => c.attempts)
    expect(attempts.length).toBeGreaterThan(0)

    for (const attempt of attempts) {
      if (attempt.verdict !== 'pass') continue
      const counted = countIn(attempt.reason)
      expect(counted).not.toBeNull()
      const listed = attempt.assertions.length + (attempt.triggerCheck === undefined ? 0 : 1)
      expect(counted).toBe(listed)
    }
  })

  it('tetiklenme kontrolü kendi alanında, assertions listesinde değil', async () => {
    const result = await run(new MockAdapter({ scenarios: [triggered(), notTriggered] }))
    const attempt = result.cases[0]?.attempts[0]
    // Vaka yalnızca `expect.triggered` beyan ediyor: assertion yok, kontrol var.
    expect(attempt?.assertions).toEqual([])
    expect(attempt?.triggerCheck?.verdict).toBe('pass')
    expect(attempt?.reason).toBe('all 1 check(s) passed')
  })
})

/**
 * Ölçülmeyen koşum ile ölçülüp boş çıkan koşum ayrı şeylerdir.
 *
 * Kusur gerçek bir koşumda görüldü: token iptal edilince tetiklenme `unknown`,
 * artefakt assertion'ları `fail`, `side_effect` ise `pass` dönüyordu. Üçü de
 * aynı olaydan. `fail` kullanıcıyı kırık skill aramaya gönderiyor; `pass` ise
 * değişmez #1'in doğrudan yasakladığı sessiz geçiş.
 *
 * Ayrımın iki yönü de burada sınanıyor, çünkü düzeltmenin fazla ileri gitmesi
 * de bir kusur olurdu: koşup hiçbir şey yazmayan bir ajan hâlâ `fail`
 * almalı.
 */
describe('runSuite — ölçülmeyen koşum her katmanda unknown', () => {
  const COMPLETION_SUITE = `
version: 1
target: { skill: widget, source: assay@test }
environment:
  host: mock
  model: test-model
  system_prompt_hash: sha256:test
# Değişmez #3: tekrar sayısı asla 1 olamaz — doğrulayıcı bu fixture'ı da
# reddetti, ki bu kuralın gerçekten zorlandığının kanıtı.
runs: 2
cases:
  - id: complete.writes_file
    prompt: Write the manifest.
    expect:
      triggered: true
      assertions:
        - { type: file_exists, path: 'out/manifest.json' }
        - { type: trace, rule: no_swallowed_errors }
        - { type: side_effect, writes_within: ['out/'], network: deny }
  - id: trigger.negative.near_neighbor.readme
    prompt: Write a README.
    expect: { triggered: false }
`

  let completionSuite: Suite

  beforeAll(() => {
    const parsed = parseSuite(COMPLETION_SUITE)
    if (!parsed.ok) throw new Error(parsed.issues.map((i) => i.message).join('; '))
    completionSuite = parsed.suite
  })

  const runCompletion = (adapter: MockAdapter) =>
    runSuite(completionSuite, adapter, { source: COMPLETION_SUITE, skillPath })

  /** Kimlik doğrulaması ölü: host oturumu hiç açamadı. */
  const deadSession: MockScenario = {
    trigger: {
      available: false,
      reason: 'the host reported an error: Not logged in · Please run /login',
    },
    result: { outcome: 'error' },
  }

  it('kimlik doğrulaması ölü oturumda hiçbir katman fail ya da pass vermez', async () => {
    const result = await runCompletion(new MockAdapter({ scenarios: [deadSession] }))
    const attempts = result.cases.flatMap((c) => c.attempts)

    for (const attempt of attempts) {
      expect(attempt.verdict).toBe('unknown')
      for (const assertion of attempt.assertions) {
        expect(assertion.verdict).toBe('unknown')
      }
    }

    // Özellikle bu üçü: eskiden ilki fail, üçüncüsü PASS veriyordu.
    const completion = result.cases.find((c) => c.caseId === 'complete.writes_file')
    const byType = (type: string) =>
      completion?.attempts[0]?.assertions.find((a) => a.assertion.type === type)
    expect(byType('file_exists')?.verdict).toBe('unknown')
    expect(byType('trace')?.verdict).toBe('unknown')
    expect(byType('side_effect')?.verdict).toBe('unknown')

    expect(result.verdict).toBe('unknown')
  })

  /**
   * Karşı yön. Ajan gerçekten koştu, oturum düzgün bitti, ama dosyayı
   * yazmadı — burada ölçüm VAR ve sonuç `fail` olmalı. Düzeltme bu vakayı
   * `unknown`a çevirseydi, ürünün ölçtüğü asıl şeyi kaybederdik.
   */
  it('koşan ama hiçbir şey yazmayan ajan file_exists"te fail vermeye devam eder', async () => {
    const ranButWroteNothing: MockScenario = {
      trigger: {
        available: true,
        triggered: true,
        skills: ['widget'],
        complete: true,
        via: 'mock',
      },
      trace: [
        { seq: 1, kind: 'skill_trigger', skill: 'widget' },
        { seq: 2, kind: 'session_end', outcome: 'completed' },
      ],
      result: { outcome: 'completed' },
    }

    const result = await runCompletion(
      new MockAdapter({ scenarios: [ranButWroteNothing] }),
    )
    const completion = result.cases.find((c) => c.caseId === 'complete.writes_file')
    const assertions = completion?.attempts[0]?.assertions ?? []
    const fileExists = assertions.find((a) => a.assertion.type === 'file_exists')

    expect(fileExists?.verdict).toBe('fail')
    expect(completion?.attempts[0]?.verdict).toBe('fail')
  })
})
