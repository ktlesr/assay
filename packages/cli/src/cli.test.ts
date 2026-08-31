import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { proportion, summarizeRun, type Attempt, type Pins, type Run } from '@assay/core'
import { RunStore } from '@assay/runner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EXIT, main } from './cli.js'
import { renderHtmlReport } from './html.js'
import { renderRun } from './terminal.js'

// ---------------------------------------------------------------------------
// Çıktı yakalama
// ---------------------------------------------------------------------------

let out = ''
let err = ''

beforeEach(() => {
  out = ''
  err = ''
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    out += String(chunk)
    return true
  })
  vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    err += String(chunk)
    return true
  })
})
afterEach(() => vi.restoreAllMocks())

const scratch = () => mkdtemp(join(tmpdir(), 'assay-cli-'))

// ---------------------------------------------------------------------------
// Kayıt üretimi (test verisi)
// ---------------------------------------------------------------------------

const pins: Pins = {
  skillSource: 'owner/repo@abc',
  skillHash: 'sha256:skill1',
  model: 'claude-haiku-4-5-20251001',
  systemPromptHash: 'not-provided-by-host',
  suiteVersion: 1,
  suiteHash: 'sha256:suite1',
}

const attempt = (caseId: string, verdict: Attempt['verdict']): Attempt => ({
  index: 0,
  caseId,
  startedAt: '2026-08-31T00:00:00.000Z',
  finishedAt: '2026-08-31T00:00:01.000Z',
  trigger:
    verdict === 'unknown'
      ? { available: false, reason: 'the trigger signal could not be read' }
      : { available: true, triggered: true, skills: ['s'], complete: true, via: 'test' },
  assertions: [],
  verdict,
  reason: verdict === 'unknown' ? 'the trigger signal could not be read' : 'ok',
  latencyMs: 1000,
  cost: { inputTokens: 10, outputTokens: 20, usd: 0.01 },
})

function makeRun(
  id: string,
  cases: ReadonlyArray<[string, number, number, number]>,
  overrides: Partial<Pins> = {},
): Run {
  return {
    id,
    startedAt: '2026-08-31T00:00:00.000Z',
    finishedAt: '2026-08-31T00:01:00.000Z',
    host: 'mock',
    skill: 'widget',
    pins: { ...pins, ...overrides },
    runs: 5,
    cases: cases.map(([caseId, passed, failed, unknown]) => ({
      caseId,
      expectedTrigger: true,
      attempts: [
        ...Array.from({ length: passed }, () => attempt(caseId, 'pass')),
        ...Array.from({ length: failed }, () => attempt(caseId, 'fail')),
        ...Array.from({ length: unknown }, () => attempt(caseId, 'unknown')),
      ],
      passRate: proportion(passed, passed + failed),
      passed,
      failed,
      unknown,
    })),
    verdict: cases.some(([, , f]) => f > 0)
      ? 'fail'
      : cases.some(([, , , u]) => u > 0)
        ? 'unknown'
        : 'pass',
  }
}

const summaryOf = (run: Run) => summarizeRun(run)

// ---------------------------------------------------------------------------

describe('kullanım', () => {
  it('komutsuz çağrı kullanımı basar ve usage koduyla çıkar', async () => {
    expect(await main([])).toBe(EXIT.usage)
    expect(out).toContain('assay — a CI test runner for Agent Skills')
  })

  it('--help başarıyla çıkar', async () => {
    expect(await main(['--help'])).toBe(EXIT.ok)
  })

  it('bilinmeyen komut usage koduyla reddedilir', async () => {
    expect(await main(['fly'])).toBe(EXIT.usage)
    expect(err).toContain('unknown command "fly"')
  })

  it('geçersiz bayrak usage koduyla reddedilir', async () => {
    expect(await main(['run', '--nope'])).toBe(EXIT.usage)
  })

  it('push Faz 2 diyor ama CLI"nın çalıştığını söylüyor', async () => {
    expect(await main(['push'])).toBe(EXIT.usage)
    expect(err).toContain('phase 2')
    expect(err).toContain('fully usable without it')
  })
})

describe('init', () => {
  it('şablon yazar ve şablon geçerli bir suite', async () => {
    const dir = await scratch()
    const path = join(dir, 'a.suite.yaml')
    expect(await main(['init', path])).toBe(EXIT.ok)
    const written = await readFile(path, 'utf8')
    expect(written).toContain('runs: 5')
    expect(written).toContain('trigger.negative.near_neighbor')
  })

  it('var olan dosyanın üzerine yazmaz', async () => {
    const dir = await scratch()
    const path = join(dir, 'a.suite.yaml')
    await main(['init', path])
    expect(await main(['init', path])).toBe(EXIT.usage)
    expect(err).toContain('already exists')
  })

  it('üretilen şablon doğrulamadan geçer', async () => {
    const dir = await scratch()
    const path = join(dir, 'a.suite.yaml')
    await main(['init', path])
    expect(await main(['validate', path])).toBe(EXIT.ok)
  })
})

describe('validate', () => {
  it('dosya yoksa usage', async () => {
    expect(await main(['validate', join(tmpdir(), 'yok.yaml')])).toBe(EXIT.usage)
    expect(err).toContain('cannot read')
  })

  it('suite yoluyla çağrılmazsa usage', async () => {
    expect(await main(['validate'])).toBe(EXIT.usage)
  })

  it('negatif vakası olmayan suite reddedilir ve gerekçe basılır', async () => {
    const dir = await scratch()
    const path = join(dir, 'bad.yaml')
    await writeFile(
      path,
      `version: 1
target: { skill: s, source: o/r@1 }
environment: { host: h, model: m, system_prompt_hash: x }
runs: 3
cases:
  - id: trigger.positive.a
    prompt: p
    expect: { triggered: true }
`,
      'utf8',
    )
    expect(await main(['validate', path])).toBe(EXIT.usage)
    expect(err).toContain('no negative case')
  })
})

describe('report', () => {
  it('kayıt yoksa açıklayıcı hata', async () => {
    const root = await scratch()
    expect(await main(['report', '--store', root])).toBe(EXIT.usage)
    expect(err).toContain('no runs found')
  })

  it('en son koşumu basar', async () => {
    const root = await scratch()
    await new RunStore({ root }).save(makeRun('run-1', [['a', 5, 0, 0]]))
    expect(await main(['report', '--store', root])).toBe(EXIT.ok)
    expect(out).toContain('run-1')
    expect(out).toContain('N=5')
  })

  it('--json ham kaydı verir', async () => {
    const root = await scratch()
    await new RunStore({ root }).save(makeRun('run-1', [['a', 5, 0, 0]]))
    await main(['report', 'run-1', '--store', root, '--json'])
    const parsed = JSON.parse(out) as { run: Run }
    expect(parsed.run.id).toBe('run-1')
  })

  it('--html tek dosyalık rapor yazar', async () => {
    const root = await scratch()
    await new RunStore({ root }).save(makeRun('run-1', [['a', 5, 0, 0]]))
    const html = join(root, 'r.html')
    await main(['report', 'run-1', '--store', root, '--html', html])
    const written = await readFile(html, 'utf8')
    expect(written).toContain('<!doctype html>')
    expect(written).not.toContain('<script')
    expect(written).not.toContain('http://')
  })
})

describe('compare', () => {
  it('iki kimlik gerektirir', async () => {
    expect(await main(['compare', 'only-one'])).toBe(EXIT.usage)
  })

  it('pin kaymışsa karşılaştırma üretmez ve hangi pin olduğunu söyler', async () => {
    const root = await scratch()
    const store = new RunStore({ root })
    await store.save(makeRun('a', [['c', 5, 0, 0]]))
    await store.save(makeRun('b', [['c', 0, 5, 0]], { skillHash: 'sha256:other' }))
    expect(await main(['compare', 'a', 'b', '--store', root])).toBe(EXIT.unknown)
    expect(out).toContain('cannot compare')
    expect(out).toContain('skillHash')
  })

  it('regresyon fail koduyla çıkar', async () => {
    const root = await scratch()
    const store = new RunStore({ root })
    await store.save(makeRun('a', [['c', 20, 0, 0]]))
    await store.save(makeRun('b', [['c', 0, 20, 0]]))
    expect(await main(['compare', 'a', 'b', '--store', root])).toBe(EXIT.failed)
    expect(out).toContain('regressed')
  })

  it('gürültü içindeki fark regresyon sayılmaz', async () => {
    const root = await scratch()
    const store = new RunStore({ root })
    await store.save(makeRun('a', [['c', 3, 0, 0]]))
    await store.save(makeRun('b', [['c', 0, 3, 0]]))
    expect(await main(['compare', 'a', 'b', '--store', root])).toBe(EXIT.ok)
    expect(out).toContain('within_noise')
  })
})

describe('değişmez #4 — hiçbir oran çıplak basılmaz', () => {
  const run = makeRun('run-x', [
    ['trigger.positive.a', 8, 2, 0],
    ['trigger.negative.b', 0, 0, 5],
  ])

  it('terminal çıktısında yüzde içeren her satır N de taşır', () => {
    const text = renderRun(run, summaryOf(run))
    for (const line of text.split('\n')) {
      if (!line.includes('%')) continue
      expect(line, `N'siz oran satırı: ${line}`).toContain('N=')
    }
  })

  it('HTML raporunda yüzde içeren her satır N de taşır', () => {
    // CSS'te de yüzde geçiyor (`width: 100%`); stil bloğu taranmaz.
    const html = renderHtmlReport(run, summaryOf(run)).replace(
      /<style>[\s\S]*?<\/style>/,
      '',
    )
    for (const line of html.split('\n')) {
      // Açıklama metinleri ("95% Wilson confidence interval") oran değil.
      if (!/\d+%/.test(line) || line.includes('class="note"')) continue
      expect(line, `N'siz oran satırı: ${line}`).toContain('N=')
    }
  })

  it('ölçülemeyen vakada oran yerine "no observations" yazar', () => {
    const text = renderRun(run, summaryOf(run))
    expect(text).toContain('no observations (N=0)')
  })
})

describe('unknown ayrı ve görünür', () => {
  const run = makeRun('run-u', [['trigger.positive.a', 2, 0, 3]])

  it('terminal unknown"ları ayrı sayar ve gerekçelerini listeler', () => {
    const text = renderRun(run, summaryOf(run))
    expect(text).toContain('3 unknown')
    expect(text).toContain('could not be measured')
    expect(text).toContain('the trigger signal could not be read')
  })

  it('HTML unknown"lar için ayrı bölüm açar', () => {
    const html = renderHtmlReport(run, summaryOf(run))
    expect(html).toContain('Not measured')
    expect(html).toContain('an unmeasured attempt is not a passing one')
  })

  it('HTML dört pini de gösterir', () => {
    const html = renderHtmlReport(run, summaryOf(run))
    for (const label of [
      'Skill version',
      'Skill hash',
      'Model',
      'System prompt hash',
      'Case set version',
    ]) {
      expect(html).toContain(label)
    }
  })
})
