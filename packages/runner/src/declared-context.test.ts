import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  declaredButNotLoaded,
  hostMemoryLabel,
  memoryEntryPath,
  memoryFromOutside,
  parseSuite,
  type Environment,
} from '@ktlsr/assay-core'
import { assembleRun, hashContext } from './assemble.js'
import { runSuite } from './run.js'
import { CONTEXT_FILENAME, CONTEXT_WORKDIR_PATH, createWorkspace } from './sandbox.js'
import { MockAdapter, type MockScenario } from './testing/mock-adapter.js'

/**
 * Vaka setinin bilinçli olarak beyan ettiği talimat dosyası (0.5.0).
 *
 * Kapatılan boşluk: 0.4.5 üst dizindeki her talimat dosyasını dışlıyor
 * (sızıntı düzeltmesi), ama bir talimat dosyasının modeli nasıl yönlendirdiğini
 * ölçen deney tam da onu kullanıyordu. 0.4.4'e düşmek de işe yaramıyordu,
 * çünkü `contextHash` 0.4.5'in ölçümünden türüyor. Bu deneyi hem ölçen hem
 * karşılaştırılabilir kılan bir sürüm yoktu.
 */

const suiteSource = (context: string | null) => `
version: 1
target: { skill: s, source: o/r@1 }
environment: { host: h, model: m, system_prompt_hash: x }
runs: 3
${context === null ? '' : `context: { instructions: ${context} }`}
cases:
  - id: trigger.positive.a
    prompt: p
    expect: { triggered: true }
  - id: trigger.negative.near_neighbor.b
    prompt: p
    expect: { triggered: false }
`

describe('suite şeması — context.instructions', () => {
  it('beyan ayrıştırılıyor', () => {
    const parsed = parseSuite(suiteSource('fixtures/arm-c/CLAUDE.md'))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.suite.context?.instructions).toBe('fixtures/arm-c/CLAUDE.md')
  })

  it('beyan opsiyonel: bugünkü suite dosyaları olduğu gibi geçerli', () => {
    const parsed = parseSuite(suiteSource(null))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.suite.context).toBeUndefined()
  })

  it('boş yol reddediliyor', () => {
    const parsed = parseSuite(suiteSource("''"))
    expect(parsed.ok).toBe(false)
  })

  it('BEYAN suiteHash e giriyor: başka dosya isteyen suite başka vaka seti', async () => {
    const { suiteHash } = await import('./run.js')
    expect(suiteHash(suiteSource('fixtures/arm-c/CLAUDE.md'))).not.toBe(
      suiteHash(suiteSource('fixtures/arm-d/CLAUDE.md')),
    )
    // Ama beyansız suite ile beyanlı suite de ayrı: alan eklemek vaka setini
    // değiştiriyor ve bunu söylemek gerekiyor.
    expect(suiteHash(suiteSource(null))).not.toBe(
      suiteHash(suiteSource('fixtures/arm-c/CLAUDE.md')),
    )
  })
})

describe('createWorkspace — beyan edilen dosya çalışma dizinine konuyor', () => {
  it('dosya CLAUDE.md olarak kopyalanıyor: host orayı okuyor ve orası dışlanmıyor', async () => {
    const src = await mkdtemp(join(tmpdir(), 'assay-ctx-src-'))
    const file = join(src, 'arm-c.md')
    await writeFile(file, '# table\nuse the lookup', 'utf8')

    const ws = await createWorkspace({ contextInstructions: file, prefix: 'assay-ctx-test-' })
    expect(await readFile(join(ws.dir, CONTEXT_FILENAME), 'utf8')).toContain('use the lookup')
  })

  it('beyan edilmiş ama var olmayan dosya SESSİZCE atlanmıyor', async () => {
    // Suite bir şey tarif etti ve kurulamadı: ölçülecek şey tarif edilen şey
    // değil. Çağıran bunu `unknown`a çeviriyor.
    await expect(
      createWorkspace({
        contextInstructions: join(tmpdir(), 'assay-no-such-context-file.md'),
        prefix: 'assay-ctx-test-',
      }),
    ).rejects.toThrow(/context\.instructions/)
  })

  it('fixture ile aynı yola düşerse beyan kazanıyor', async () => {
    const fixtures = await mkdtemp(join(tmpdir(), 'assay-ctx-fx-'))
    await writeFile(join(fixtures, CONTEXT_FILENAME), 'from the fixture', 'utf8')
    const src = await mkdtemp(join(tmpdir(), 'assay-ctx-src-'))
    const declared = join(src, 'declared.md')
    await writeFile(declared, 'from the declaration', 'utf8')

    const ws = await createWorkspace({
      fixtures,
      contextInstructions: declared,
      prefix: 'assay-ctx-test-',
    })
    expect(await readFile(join(ws.dir, CONTEXT_FILENAME), 'utf8')).toBe('from the declaration')
  })
})

// ---------------------------------------------------------------------------
// Kayıt: ölçülen bağlam, beyan, ve ikisinin farkı
// ---------------------------------------------------------------------------

const environment = (over: Partial<Environment> = {}): Environment => ({
  model: 'm',
  version: '2.1.271',
  outputStyle: 'default',
  permissionMode: 'acceptEdits',
  tools: [],
  skills: [],
  agents: [],
  plugins: [],
  ...over,
})

const runWith = (env: Environment) =>
  assembleRun({
    id: 'r',
    startedAt: '2026-09-27T10:00:00.000Z',
    finishedAt: '2026-09-27T10:01:00.000Z',
    host: 'claude-code',
    skill: 'widget',
    runs: 3,
    pins: {
      skillSource: 'o/r@1',
      skillHash: 'sha256:s',
      model: 'm',
      systemPromptHash: 'not-provided-by-host',
      suiteVersion: 1,
      suiteHash: 'sha256:c',
    },
    attempts: [
      {
        kind: 'attempt' as const,
        caseId: 'trigger.positive.a',
        expectedTrigger: true,
        environmentHash: 'sha256:env',
        environment: env,
        attempt: {
          index: 0,
          caseId: 'trigger.positive.a',
          startedAt: '2026-09-27T10:00:01.000Z',
          finishedAt: '2026-09-27T10:00:02.000Z',
          trigger: { available: false as const, reason: 'mock' },
          assertions: [],
          verdict: 'pass' as const,
          reason: 'mock',
          latencyMs: 1,
        },
      },
    ],
  })

const declaredEntry = `Project ${CONTEXT_WORKDIR_PATH} sha256:aaaa`
const otherContent = `Project ${CONTEXT_WORKDIR_PATH} sha256:bbbb`
const leaked = 'Project C:/Users/<user>/.claude/CLAUDE.md sha256:cccc'

describe('beyan edilen dosya contextHash e giriyor', () => {
  it('içerik değişince bağlam pini kayıyor — aynı vaka seti, farklı kol', () => {
    const armC = runWith(
      environment({ memory: [declaredEntry], declaredContext: [CONTEXT_WORKDIR_PATH] }),
    )
    const armD = runWith(
      environment({ memory: [otherContent], declaredContext: [CONTEXT_WORKDIR_PATH] }),
    )
    expect(armC.pins.contextHash).toBeDefined()
    expect(armC.pins.contextHash).not.toBe(armD.pins.contextHash)
    // Ve türetim gerçekten ölçülen listeden: elle hesaplanan hash'e eşit.
    expect(armC.pins.contextHash).toBe(hashContext([declaredEntry]))
  })

  it('beyan HASH E girmiyor: aynı içerik, beyan var/yok — bağlam pini aynı', () => {
    // Beyanın kendisi `suiteHash`te duruyor; onu bir de buraya koymak aynı
    // koşulu iki pine yaymak olurdu.
    const withDeclaration = runWith(
      environment({ memory: [declaredEntry], declaredContext: [CONTEXT_WORKDIR_PATH] }),
    )
    const without = runWith(environment({ memory: [declaredEntry] }))
    expect(withDeclaration.pins.contextHash).toBe(without.pins.contextHash)
  })
})

describe('sızıntı ile bilinçli dahil etme ayrı okunuyor', () => {
  it('beyan edilen dosya sızıntı sayılmıyor', () => {
    const run = runWith(
      environment({ memory: [declaredEntry], declaredContext: [CONTEXT_WORKDIR_PATH] }),
    )
    // Beyan çalışma dizinine konuyor, yani `./` ile başlıyor ve sızıntı
    // kuralı onu zaten geçiriyor — ayrı bir beyan kontrolü olsaydı hiç
    // çalışmayan bir dal olurdu.
    expect(memoryFromOutside(run)).toEqual([])
    expect(hostMemoryLabel(run)).toContain('declared by the case set')
  })

  it('beyan edilmemiş, dışarıdan gelen dosya HÂLÂ sızıntı', () => {
    const run = runWith(
      environment({
        memory: [declaredEntry, leaked],
        declaredContext: [CONTEXT_WORKDIR_PATH],
      }),
    )
    expect(memoryFromOutside(run)).toEqual([leaked])
  })

  it('beyan edilip yüklenmeyen dosya ayrı bir soru olarak duruyor', () => {
    // Suite bir dosya istedi, ölçüm onu bağlamda görmedi: ölçülen şey
    // suite'in tarif ettiği şey değil.
    const run = runWith(environment({ memory: [], declaredContext: [CONTEXT_WORKDIR_PATH] }))
    expect(declaredButNotLoaded(run)).toEqual([CONTEXT_WORKDIR_PATH])
  })

  it('bağlam HİÇ ölçülmediyse iddia yok: "yüklenmedi" ile "bilmiyorum" ayrı', () => {
    // Host'un ölçüm kancası koşmadıysa dosyanın yüklenip yüklenmediği
    // bilinmiyor. Eksik demek, ölçülmemiş bir şeyi ölçülmüş gibi raporlamak
    // olurdu (değişmez #1).
    const run = runWith(environment({ declaredContext: [CONTEXT_WORKDIR_PATH] }))
    expect(run.environment?.memory).toBeUndefined()
    expect(declaredButNotLoaded(run)).toEqual([])
  })

  it('yüklenmişse boş kalıyor', () => {
    const run = runWith(
      environment({ memory: [declaredEntry], declaredContext: [CONTEXT_WORKDIR_PATH] }),
    )
    expect(declaredButNotLoaded(run)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Uçtan uca: beyan runSuite'ten adaptöre ve kayda ulaşıyor mu
// ---------------------------------------------------------------------------

const scenario = (): MockScenario => ({
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

describe('runSuite — beyan adaptöre ve kayda ulaşıyor', () => {
  it('beyan edilen dosya kopyalanıyor ve yolu adaptöre bildiriliyor', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'assay-ctx-e2e-'))
    const suitePath = join(dir, 'x.suite.yaml')
    const contextFile = join(dir, 'fixtures', 'arm-c.md')
    await writeFile(suitePath, 'unused', 'utf8')
    const { mkdir } = await import('node:fs/promises')
    await mkdir(join(dir, 'fixtures'), { recursive: true })
    await writeFile(contextFile, '# the table', 'utf8')

    const parsed = parseSuite(suiteSource('fixtures/arm-c.md'))
    if (!parsed.ok) throw new Error('bad suite')
    const skillPath = await mkdtemp(join(tmpdir(), 'assay-ctx-skill-'))
    const adapter = new MockAdapter({ scenarios: [scenario()] })

    await runSuite(parsed.suite, adapter, {
      source: suiteSource('fixtures/arm-c.md'),
      suitePath,
      skillPath,
      repeat: 1,
    })

    // Yol suite dosyasına göre çözülüyor — fixture'larla aynı kural.
    const config = adapter.started[0]
    expect(config?.declaredContext).toEqual([CONTEXT_WORKDIR_PATH])
    // Ve dosya gerçekten kopyalandı: workdir'de CLAUDE.md var.
    expect(config?.workdir).toBeDefined()
  })

  it('beyansız suite hiçbir şey bildirmiyor: bugünkü koşumlar değişmiyor', async () => {
    const parsed = parseSuite(suiteSource(null))
    if (!parsed.ok) throw new Error('bad suite')
    const skillPath = await mkdtemp(join(tmpdir(), 'assay-ctx-skill-'))
    const adapter = new MockAdapter({ scenarios: [scenario()] })
    await runSuite(parsed.suite, adapter, {
      source: suiteSource(null),
      skillPath,
      repeat: 1,
    })
    expect(adapter.started[0]?.declaredContext).toBeUndefined()
  })

  it('beyan edilen dosya bulunamazsa deneme unknown olur, sessizce geçmez', async () => {
    const parsed = parseSuite(suiteSource('fixtures/missing.md'))
    if (!parsed.ok) throw new Error('bad suite')
    const skillPath = await mkdtemp(join(tmpdir(), 'assay-ctx-skill-'))
    const dir = await mkdtemp(join(tmpdir(), 'assay-ctx-e2e-'))
    const result = await runSuite(parsed.suite, new MockAdapter({ scenarios: [scenario()] }), {
      source: suiteSource('fixtures/missing.md'),
      suitePath: join(dir, 'x.suite.yaml'),
      skillPath,
      repeat: 1,
    })
    expect(result.verdict).toBe('unknown')
    expect(result.cases[0]?.attempts[0]?.reason).toContain('context.instructions')
  })
})

describe('memoryEntryPath — boşluklu yol', () => {
  it('boşluk taşıyan bir Windows yolu bölünmüyor', () => {
    expect(memoryEntryPath('Project C:/Users/ada lovelace/.claude/CLAUDE.md sha256:aa')).toBe(
      'C:/Users/ada lovelace/.claude/CLAUDE.md',
    )
  })

  it('okunamayan dosyanın yolu da tam çıkıyor', () => {
    expect(memoryEntryPath('Project C:/a b/CLAUDE.md unreadable')).toBe('C:/a b/CLAUDE.md')
  })
})
