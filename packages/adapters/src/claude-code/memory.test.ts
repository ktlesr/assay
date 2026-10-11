import { spawnSync } from 'node:child_process'
import { appendFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ancestorExcludes,
  ClaudeCodeAdapter,
  environmentHash,
  memoryEntries,
  readMemoryProbe,
  writeMemoryProbe,
} from './adapter.js'
import type { ClaudeCodeSession } from './adapter.js'
import type { ParsedStream } from './stream.js'

/**
 * Talimat dosyası sızıntısı — kesim ve ölçüm (0.4.5).
 *
 * Host çalışma dizininden köke kadar her dizinde CLAUDE.md arıyor; Windows'ta
 * `%TEMP%` ev dizininin altında olduğu için kullanıcının `~/.claude/CLAUDE.md`'si
 * her denemede yükleniyordu. Burada sınanan: üst dizinlerin dışlanması, host'un
 * ölçüm kancasının gerçekten çalışan bir betik olması ve günlüğün doğru okunması.
 * Host'un kendisiyle uçtan uca doğrulama `tools/probe-host-memory.mjs`te
 * (ücretsiz: sahte anahtar + yerel yakalayıcı).
 */

const slash = (path: string) => path.split('\\').join('/')
const cleanup: string[] = []
afterEach(async () => {
  for (const dir of cleanup.splice(0)) await rm(dir, { recursive: true, force: true })
})

describe('ancestorExcludes', () => {
  const workdir = resolve(tmpdir(), 'assay-a', 'assay-b', 'work')

  it('calisma dizininin her ust dizinindeki talimat yerlerini dislar', () => {
    const excludes = ancestorExcludes(workdir)
    let dir = dirname(workdir)
    for (;;) {
      const base = slash(dir).replace(/\/$/, '')
      expect(excludes).toContain(`${base}/CLAUDE.md`)
      expect(excludes).toContain(`${base}/.claude/**`)
      expect(excludes).toContain(`${base}/CLAUDE.local.md`)
      if (dirname(dir) === dir) break
      dir = dirname(dir)
    }
  })

  it('calisma dizininin kendisini dislamaz — oradaki CLAUDE.md fixture', () => {
    expect(ancestorExcludes(workdir)).not.toContain(`${slash(workdir)}/CLAUDE.md`)
  })
})

describe('writeMemoryProbe', () => {
  it('dislamayi ve iki kancayi config dizinine yazar; kanca gercekten calisir', async () => {
    const configDir = await mkdtemp(join(tmpdir(), 'assay-cc-test-'))
    const workdir = await mkdtemp(join(tmpdir(), 'assay-work-test-'))
    cleanup.push(configDir, workdir)
    await writeMemoryProbe(configDir, workdir)

    const settings = JSON.parse(await readFile(join(configDir, 'settings.json'), 'utf8')) as {
      claudeMdExcludes: string[]
      hooks: Record<string, Array<{ hooks: Array<{ command: string }> }>>
    }
    expect(settings.claudeMdExcludes).toEqual(ancestorExcludes(workdir))
    const command = settings.hooks['InstructionsLoaded']?.[0]?.hooks[0]?.command ?? ''
    expect(settings.hooks['UserPromptSubmit']?.[0]?.hooks[0]?.command).toBe(command)

    // Host'un yapacağı gibi: komutu çalıştır, olayı stdin'den ver.
    const [bin, script, log] = [...command.matchAll(/"([^"]+)"/g)].map((m) => m[1] as string)
    const fire = (event: object) =>
      spawnSync(bin as string, [script as string, log as string], { input: JSON.stringify(event) })
    const leaked = join(workdir, '..', 'CLAUDE.md')
    fire({ hook_event_name: 'InstructionsLoaded', file_path: leaked, memory_type: 'Project', load_reason: 'session_start' })
    const out = fire({ hook_event_name: 'UserPromptSubmit', prompt: 'x' })
    // Kanarya bağlama bir şey eklememeli: UserPromptSubmit stdout'u isteme girer.
    expect(out.stdout.toString()).toBe('')

    const entries = memoryEntries(await readFile(log as string, 'utf8'), workdir, new Map())
    expect(entries).toEqual([`Project ${leaked} unreadable`])
  })
})

describe('talimat dosyasi YUKLEME aninda hash leniyor (0.5.0)', () => {
  /*
   * Ölçülen kusur: hash deneme bittikten sonra alınıyordu. Ajan talimat
   * dosyasını düzenlerse o denemenin ortam kaydı diğerlerinden ayrışıyor ve
   * BÜTÜN koşum `environment` ile `contextHash`ini kaybediyordu. Gerçek
   * ölçümde (arm H, 2026-10-11) 200 denemenin 1'i `CLAUDE.md`'yi yazdı ve
   * koşumun bağlam pini düştü.
   */
  const probe = async () => {
    const configDir = await mkdtemp(join(tmpdir(), 'assay-cc-test-'))
    const workdir = await mkdtemp(join(tmpdir(), 'assay-work-test-'))
    cleanup.push(configDir, workdir)
    await writeMemoryProbe(configDir, workdir)
    const settings = JSON.parse(await readFile(join(configDir, 'settings.json'), 'utf8')) as {
      hooks: Record<string, Array<{ hooks: Array<{ command: string }> }>>
    }
    const command = settings.hooks['InstructionsLoaded']?.[0]?.hooks[0]?.command ?? ''
    const [bin, script, log] = [...command.matchAll(/"([^"]+)"/g)].map((m) => m[1] as string)
    const fire = (event: object) =>
      spawnSync(bin as string, [script as string, log as string], {
        input: JSON.stringify(event),
      })
    return { configDir, workdir, log: log as string, fire }
  }

  const loaded = (file: string) => ({
    hook_event_name: 'InstructionsLoaded',
    file_path: file,
    memory_type: 'Project',
    load_reason: 'session_start',
  })

  it('deneme sirasinda DUZENLENEN dosya yukleme anindaki hash i koruyor', async () => {
    const { configDir, workdir, fire } = await probe()
    const file = join(workdir, 'CLAUDE.md')
    await writeFile(file, 'as loaded', 'utf8')

    fire(loaded(file))
    fire({ hook_event_name: 'UserPromptSubmit', prompt: 'x' })
    const atLoad = await readMemoryProbe(configDir, workdir)

    // Ajan dosyayı denemenin ortasında değiştiriyor.
    await writeFile(file, 'edited by the measured agent', 'utf8')
    const afterEdit = await readMemoryProbe(configDir, workdir)

    expect(atLoad).toHaveLength(1)
    expect(afterEdit).toEqual(atLoad)
    expect(atLoad?.[0]).toContain('./CLAUDE.md sha256:')
    expect(atLoad?.[0]).not.toContain('unreadable')
  })

  it('iki dosya ayri ayri hash leniyor ve icerik hash i degisince giris degisiyor', async () => {
    const one = await probe()
    await writeFile(join(one.workdir, 'CLAUDE.md'), 'table A', 'utf8')
    one.fire(loaded(join(one.workdir, 'CLAUDE.md')))
    one.fire({ hook_event_name: 'UserPromptSubmit', prompt: 'x' })

    const two = await probe()
    await writeFile(join(two.workdir, 'CLAUDE.md'), 'table B', 'utf8')
    two.fire(loaded(join(two.workdir, 'CLAUDE.md')))
    two.fire({ hook_event_name: 'UserPromptSubmit', prompt: 'x' })

    expect(await readMemoryProbe(one.configDir, one.workdir)).not.toEqual(
      await readMemoryProbe(two.configDir, two.workdir),
    )
  })

  it('hash alinamayan dosya unreadable; simdi okunup bosluk DOLDURULMUYOR', async () => {
    const { configDir, workdir, fire } = await probe()
    const file = join(workdir, 'CLAUDE.md')
    // Yükleme anında dosya yok: kanca hash alamıyor.
    fire(loaded(file))
    fire({ hook_event_name: 'UserPromptSubmit', prompt: 'x' })
    // Sonradan ortaya çıkıyor — okuma anı bunu kullanmamalı.
    await writeFile(file, 'appeared after the load', 'utf8')

    expect(await readMemoryProbe(configDir, workdir)).toEqual(['Project ./CLAUDE.md unreadable'])
  })

  it('hash ALANI HIC YOKKEN de dosya simdi okunmuyor', async () => {
    // Kancanın yazamadığı (ya da eski bir üreticinin bıraktığı) bir satır:
    // yükleme anındaki içerik bilinmiyor. Dosya şimdi diskte duruyor olabilir
    // ama onu okumak, bilinmeyeni bilinen gibi göstermek olurdu.
    const { configDir, workdir, log, fire } = await probe()
    const file = join(workdir, 'CLAUDE.md')
    await writeFile(file, 'present on disk right now', 'utf8')
    await appendFile(
      log,
      `${JSON.stringify({ ...loaded(file) })}${String.fromCharCode(10)}`,
      'utf8',
    )
    fire({ hook_event_name: 'UserPromptSubmit', prompt: 'x' })

    expect(await readMemoryProbe(configDir, workdir)).toEqual(['Project ./CLAUDE.md unreadable'])
  })

  it('kanarya yoksa yine olculmedi: hash degisikligi bu kurali bozmuyor', async () => {
    const { configDir, workdir, fire } = await probe()
    const file = join(workdir, 'CLAUDE.md')
    await writeFile(file, 'x', 'utf8')
    fire(loaded(file))
    expect(await readMemoryProbe(configDir, workdir)).toBeUndefined()
  })
})

describe('memoryEntries', () => {
  const workdir = resolve(tmpdir(), 'assay-work-x')
  const line = (event: object) => JSON.stringify(event)
  const canary = line({ hook_event_name: 'UserPromptSubmit' })
  const loaded = (file_path: string, load_reason = 'session_start') =>
    line({ hook_event_name: 'InstructionsLoaded', file_path, memory_type: 'Project', load_reason })

  it('kanarya yoksa olculmedi — "yuklenmedi" degil', () => {
    expect(memoryEntries('', workdir, new Map())).toBeUndefined()
    expect(memoryEntries(loaded(join(workdir, 'CLAUDE.md')), workdir, new Map())).toBeUndefined()
  })

  it('kanarya var, yukleme yok: olculdu ve temiz', () => {
    expect(memoryEntries(canary, workdir, new Map())).toEqual([])
  })

  it('disaridan yuklenen her dosya sebebi ne olursa olsun girer', () => {
    const outside = resolve(tmpdir(), 'CLAUDE.md')
    const hashes = new Map([[outside, 'sha256:aaaa']])
    expect(memoryEntries([canary, loaded(outside, 'nested_traversal')].join('\n'), workdir, hashes)).toEqual([
      `Project ${outside} sha256:aaaa`,
    ])
  })

  it('iceriden yalniz oturum basinda yuklenenler, goreli yolla', () => {
    const inside = join(workdir, 'CLAUDE.md')
    const nested = join(workdir, 'sub', 'CLAUDE.md')
    const log = [canary, loaded(inside), loaded(nested, 'nested_traversal')].join('\n')
    expect(memoryEntries(log, workdir, new Map([[inside, 'sha256:bbbb']]))).toEqual([
      'Project ./CLAUDE.md sha256:bbbb',
    ])
  })

  it('bozuk satir atlanir, olcum dusmez', () => {
    expect(memoryEntries(`${canary}\n{yarım`, workdir, new Map())).toEqual([])
  })
})

describe('finalize — memory ortam kaydinda ve hash te', () => {
  const init: NonNullable<ParsedStream['init']> = {
    sessionId: 's1',
    model: 'claude-haiku-4-5-20251001',
    cwd: '/w',
    version: '2.1.270',
    permissionMode: 'acceptEdits',
    outputStyle: 'default',
    tools: ['Read'],
    skills: ['s'],
    agents: [],
    plugins: [],
  }
  const session = (memory?: readonly string[]): ClaudeCodeSession => ({
    id: 'x',
    adapter: 'claude-code',
    startedAt: new Date(0).toISOString(),
    targetSkill: 's',
    exitCode: 0,
    latencyMs: 1,
    stderr: '',
    configDir: '/nonexistent',
    ...(memory === undefined ? {} : { memory }),
    parsed: {
      init,
      result: {
        subtype: 'success',
        isError: false,
        numTurns: 1,
        terminalReason: 'completed',
        inputTokens: 1,
        outputTokens: 1,
        permissionDenials: [],
      },
      trace: [],
      triggeredSkills: [],
      refusals: [],
      malformed: 0,
    },
  })
  const adapter = new ClaudeCodeAdapter({ cleanup: false })

  it('olculmus bellek kayda girer ama ORTAM hash ini degistirmez (0.4.8)', async () => {
    // Bağlamın kendi pini var (`contextHash`). Ortam hash'i host ortamını
    // söylüyor ve o kımıldamadı; bağlam kaymasını onun adına yazmak, 0.3.0-a'da
    // düzeltilen "doğru karar, yanlış adres" kusurunun aynısı olurdu.
    const leaked = await adapter.finalize(session(['Project C:/Users/u/.claude/CLAUDE.md sha256:aa']))
    const clean = await adapter.finalize(session([]))
    expect(leaked.environment?.memory).toEqual(['Project C:/Users/u/.claude/CLAUDE.md sha256:aa'])
    expect(clean.environment?.memory).toEqual([])
    expect(leaked.environmentHash).toBe(clean.environmentHash)
  })

  it('olculmemis oturumda alan yazilmaz ve hash olculmus oturumunkiyle ayni kalir', async () => {
    // Ortam hash'i artık bağlamdan bağımsız: ölçülmüş ve ölçülmemiş oturum
    // AYNI ortam hash'ini alıyor. Aralarındaki farkı `contextHash` söylüyor —
    // ölçülmemiş olanda o alan hiç yok ve karşılaştırma durur.
    const unmeasured = await adapter.finalize(session())
    const clean = await adapter.finalize(session([]))
    expect(unmeasured.environment?.memory).toBeUndefined()
    expect(unmeasured.environmentHash).toBe(environmentHash(init))
    expect(unmeasured.environmentHash).toBe(clean.environmentHash)
  })
})
