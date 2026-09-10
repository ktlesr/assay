import { existsSync } from 'node:fs'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { proportion, summarizeRun, type Attempt, type Pins, type Run } from '@ktlsr/assay-core'
import { findJournals, RunJournal, RunStore } from '@ktlsr/assay-runner'
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
  // Host sistem promptu hash'ini vermiyor; ortam hash'i pin 3'ü kapsıyor ve
  // karşılaştırmayı açık tutuyor (comparePins, değişmez #2).
  environmentHash: 'sha256:env',
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
      : {
          available: true,
          triggered: true,
          skills: ['s'],
          refused: false,
          refusals: [],
          complete: true,
          via: 'test',
        },
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

  it('push adres olmadan koşmaz', async () => {
    expect(await main(['push'])).toBe(EXIT.usage)
    expect(err).toContain('--url or ASSAY_URL')
  })

  it('push token olmadan koşmaz', async () => {
    expect(await main(['push', '--url', 'http://localhost:3000'])).toBe(EXIT.usage)
    expect(err).toContain('ASSAY_TOKEN')
  })

  it('push vaka seti olmadan koşmaz', async () => {
    expect(
      await main(['push', '--url', 'http://localhost:3000', '--token', 'assay_x']),
    ).toBe(EXIT.usage)
    expect(err).toContain('--suite')
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

  it('dizin verilirse usage döner, çökmez', async () => {
    // Yardım metni argümanı dosya diye tarif ediyor; dizin verilince eskiden
    // writeFile yakalanmamış EISDIR fırlatıp yığın izi basıyordu.
    const dir = await scratch()
    expect(await main(['init', dir])).toBe(EXIT.usage)
    expect(err).toContain('is a directory')
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

/**
 * 0.2.0 — izin modu dışarı açıldı.
 *
 * `allowed-tools` beyan eden bir skill `acceptEdits` altında hiç aktive
 * olamıyor; mod hardcoded kaldığı sürece o skill ölçülemez. Varsayılan
 * DEĞİŞMEDİ: yalnızca seçilebilir oldu.
 *
 * Doğrulama gerçek koşumdan ÖNCE: yanlış yazılmış bir mod sessizce
 * varsayılana düşseydi kullanıcı ölçtüğünü sandığı şeyi ölçmemiş olurdu.
 */
describe('--permission-mode', () => {
  const validSuite = async () => {
    const dir = await scratch()
    const path = join(dir, 'ok.yaml')
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
  - id: trigger.negative.near_neighbor.b
    prompt: p
    expect: { triggered: false }
`,
      'utf8',
    )
    return { path, dir }
  }

  it('bilinmeyen mod sessizce varsayılana düşmez, usage ile reddedilir', async () => {
    const { path, dir } = await validSuite()
    expect(
      await main(['run', path, '--skill', dir, '--permission-mode', 'acceptedits']),
    ).toBe(EXIT.usage)
    expect(err).toContain('unknown --permission-mode')
    expect(err).toContain('acceptEdits')
  })

  it('bypassPermissions açık onay olmadan reddedilir', async () => {
    const { path, dir } = await validSuite()
    expect(
      await main(['run', path, '--skill', dir, '--permission-mode', 'bypassPermissions']),
    ).toBe(EXIT.usage)
    expect(err).toContain('--allow-bypass-permissions')
  })

  it('kullanım metni modları ve ölçüme etkisini yazıyor', async () => {
    await main(['--help'])
    expect(out).toContain('--permission-mode')
    expect(out).toContain('acceptEdits')
    expect(out).toContain('allowed-tools')
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

// ---------------------------------------------------------------------------
// recover — 0.3.0-b
// ---------------------------------------------------------------------------

describe('assay recover', () => {
  const header = (id: string) => ({
    id,
    startedAt: '2026-09-08T10:00:00.000Z',
    host: 'mock',
    skill: 'widget',
    runs: 6,
    pins,
  })

  const journalAttempt = (index: number) => ({
    caseId: 'trigger.positive.explicit',
    expectedTrigger: true,
    attempt: { ...attempt('trigger.positive.explicit', 'pass'), index },
  })

  it('yarim journal i kayda cevirir ve journal i siler', async () => {
    const root = await scratch()
    const store = new RunStore({ root })
    const journal = await RunJournal.open(store.directory, header('run-killed-1'))
    journal.append(journalAttempt(0))
    journal.append(journalAttempt(1))

    const code = await main(['recover', '--store', root])
    expect(code).toBe(EXIT.ok)
    expect(err).toContain('recovered run-killed-1')

    // Kayıt store'da ve yarım olduğunu söylüyor.
    const loaded = await store.load('run-killed-1')
    expect(loaded.partial?.reason).toContain('interrupted')
    expect(loaded.cases[0]?.passRate.n).toBe(2)
    // Journal'ın işi bitti.
    expect(await findJournals(store.directory)).toHaveLength(0)
  })

  it('kurtaracak bir sey yoksa hata degil', async () => {
    const root = await scratch()
    expect(await main(['recover', '--store', root])).toBe(EXIT.ok)
    expect(err).toContain('nothing to recover')
  })

  it('denemesiz journal silinmez — okunamayan bir dosya yok edilmez', async () => {
    const root = await scratch()
    const store = new RunStore({ root })
    const journal = await RunJournal.open(store.directory, header('run-empty'))

    expect(await main(['recover', '--store', root])).toBe(EXIT.usage)
    expect(err).toContain('carries no completed attempt')
    expect(existsSync(journal.path)).toBe(true)
  })

  it('rapor yarim kaydi manşette soyluyor', async () => {
    const run = {
      ...makeRun('run-partial-report', [['trigger.positive.explicit', 2, 0, 0]]),
      partial: {
        reason: 'the run was interrupted before it finished',
        recoveredAt: '2026-09-08T11:00:00.000Z',
        droppedLines: 1,
      },
    }
    const text = renderRun(run, summarizeRun(run))
    expect(text).toContain('incomplete run')
    expect(text).toContain('1 journal line(s) were unreadable')
    const html = renderHtmlReport(run, summarizeRun(run))
    expect(html).toContain('Incomplete run')
  })

  it('kosum baslangicinda yetim journal uyarisi verilir', async () => {
    const root = await scratch()
    const store = new RunStore({ root })
    await RunJournal.open(store.directory, header('run-orphan'))
    // Suite dosyası yok: komut kullanım hatasıyla düşecek, ama uyarı ondan
    // önce basılmalı mı? Hayır — uyarı suite yüklendikten sonra. Burada
    // yalnızca findJournals'ın yetimi gördüğü sabitleniyor.
    expect(await findJournals(store.directory)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// hızlı mod — 0.3.0-e
// ---------------------------------------------------------------------------

describe('hızlı mod raporu', () => {
  const fastRun = (): Run => {
    const base = makeRun('run-fast', [['trigger.positive.explicit', 3, 0, 0]])
    return {
      ...base,
      runs: 3,
      layers: ['trigger'],
      skipped: [
        { caseId: 'complete.only_artifact', reason: 'the case only declares assertions', cause: 'layer' },
      ],
      cases: base.cases.map((c) => ({
        ...c,
        attempts: c.attempts.map((a) => ({
          ...a,
          notEvaluated: [{ type: 'file_exists' as const, path: 'out/*' }],
        })),
      })),
    }
  }

  it('terminal raporu hizli modu manşette soyluyor', () => {
    const text = renderRun(fastRun(), summarizeRun(fastRun()))
    expect(text).toContain('fast mode — an early warning, not evidence')
    // Neyin ölçülmediği vaka altında adıyla.
    expect(text).toContain('file_exists  not evaluated in this mode')
    // Koşulmayan vaka sebebiyle.
    expect(text).toContain('complete.only_artifact')
    // Manşet oranların ÜSTÜNDE: uyarı, ilk vaka satırından önce gelmeli.
    expect(text.indexOf('fast mode')).toBeLessThan(text.indexOf('trigger.positive.explicit'))
  })

  it('HTML raporu da manşette soyluyor', () => {
    const html = renderHtmlReport(fastRun(), summarizeRun(fastRun()))
    expect(html).toContain('Fast mode — an early warning, not evidence')
    expect(html).toContain('complete.only_artifact')
  })

  it('HTML raporu degerlendirilmeyen assertion lari vakanin altinda adiyla gosteriyor', () => {
    // Gerçek hosttaki koşum gösterdi: manşet "bakılmadı" diyordu ama hangi
    // iddianın sınanmadığını yalnızca terminal söylüyordu.
    const html = renderHtmlReport(fastRun(), summarizeRun(fastRun()))
    const row = html.slice(html.indexOf('trigger.positive.explicit'), html.indexOf('</tr>', html.indexOf('trigger.positive.explicit')))
    expect(row).toContain('not evaluated in this mode: file_exists')
  })

  it('butce kesmesi HTML ve terminalde neden gecemedigini soyluyor, katman elemesi soylemiyor', () => {
    const cut: Run = {
      ...fastRun(),
      verdict: 'unknown',
      skipped: [
        { caseId: 'trigger.negative.near_neighbor.readme', reason: 'the attempt budget of 3 was reached before this case', cause: 'budget' },
      ],
    }
    const html = renderHtmlReport(cut, summarizeRun(cut))
    expect(html).toContain('The attempt budget cut 1 case(s) — this run cannot pass')
    expect(html).toContain('trigger.negative.near_neighbor.readme')
    expect(renderRun(cut, summarizeRun(cut))).toContain('The attempt budget cut 1 of them, so this run cannot pass')

    // Pozitif kontrol: yalnız katman elemesi olan koşumda bu cümle yok.
    const layerOnly = renderHtmlReport(fastRun(), summarizeRun(fastRun()))
    expect(layerOnly).toContain('1 case(s) were not run')
    expect(layerOnly).not.toContain('cannot pass')
  })

  it('ulasilamayan vaka ve yarim kayit raporda neden gecemedigini soyluyor', () => {
    const base = makeRun('run-interrupted', [['trigger.positive.explicit', 3, 0, 0]])
    const cut: Run = {
      ...base,
      verdict: 'unknown',
      partial: { reason: 'the run was interrupted', recoveredAt: '2026-09-10T00:00:00.000Z' },
      skipped: [
        { caseId: 'trigger.negative.x', reason: 'the run was interrupted before this case started', cause: 'interrupted' },
      ],
    }
    const html = renderHtmlReport(cut, summarizeRun(cut))
    expect(html).toContain('The run was interrupted before 1 case(s) started — this record cannot pass')
    expect(html).toContain('trigger.negative.x')
    expect(html).toContain('An incomplete record cannot pass')
    const text = renderRun(cut, summarizeRun(cut))
    expect(text).toContain('The run was interrupted before 1 of them started, so this record')
    expect(text).toContain('An incomplete record cannot pass')
  })

  it('hizli mod olmadan butceyle kesilen kosumun HTML raporu da kesilen vakalari listeliyor', () => {
    // İlk hâli atlanan vakaları yalnızca hızlı mod notunun içinde anıyordu.
    const base = makeRun('run-budget-full', [['trigger.positive.explicit', 3, 0, 0]])
    const cut: Run = {
      ...base,
      verdict: 'unknown',
      skipped: [{ caseId: 'trigger.negative.x', reason: 'the attempt budget of 3 was reached before this case', cause: 'budget' }],
    }
    const html = renderHtmlReport(cut, summarizeRun(cut))
    expect(html).not.toContain('Fast mode')
    expect(html).toContain('trigger.negative.x')
    expect(html).toContain('this run cannot pass')
  })

  it('tam modda hicbir hizli mod metni yok', () => {
    // Pozitif kontrol: metin moda bağlı, her rapora yapıştırılmış değil.
    const full = makeRun('run-full', [['trigger.positive.explicit', 5, 0, 0]])
    const text = renderRun(full, summarizeRun(full))
    expect(text).not.toContain('fast mode')
    expect(renderHtmlReport(full, summarizeRun(full))).not.toContain('Fast mode')
  })
})
