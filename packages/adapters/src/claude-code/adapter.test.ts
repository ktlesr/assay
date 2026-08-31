import { describe, expect, it } from 'vitest'
import {
  ClaudeCodeAdapter,
  environmentHash,
  passthroughEnv,
  skillMatches,
} from './adapter.js'
import type { ClaudeCodeSession } from './adapter.js'
import type { ParsedStream } from './stream.js'

/**
 * Adaptörün karar mantığı — gerçek koşum yapmadan. Akış ayrıştırması
 * stream.test.ts'te gerçek fixture'larla sınanıyor; burada sınanan şey,
 * ayrıştırılmış bir oturumdan hangi sinyalin üretildiği.
 */

const init: NonNullable<ParsedStream['init']> = {
  sessionId: 's1',
  model: 'claude-haiku-4-5-20251001',
  cwd: '/w',
  version: '2.1.251',
  permissionMode: 'dontAsk',
  outputStyle: 'default',
  tools: ['Read', 'Write'],
  skills: ['widget-manifest'],
  agents: [],
  plugins: [{ name: 'assay-probe', version: '0.0.1' }],
}

const healthyResult = {
  subtype: 'success',
  isError: false,
  numTurns: 2,
  terminalReason: 'completed',
  inputTokens: 10,
  outputTokens: 42,
  costUsd: 0.01,
}

function session(overrides: Partial<ClaudeCodeSession> = {}): ClaudeCodeSession {
  const parsed: ParsedStream = {
    init,
    result: healthyResult,
    trace: [{ seq: 1, kind: 'session_end', outcome: 'completed' }],
    triggeredSkills: [],
    malformed: 0,
    ...(overrides.parsed ?? {}),
  }
  return {
    id: 'claude-code-c-0-s1',
    adapter: 'claude-code',
    startedAt: new Date(0).toISOString(),
    targetSkill: 'widget-manifest',
    exitCode: 0,
    latencyMs: 1000,
    stderr: '',
    configDir: '/tmp/x',
    ...overrides,
    parsed,
  }
}

const adapter = new ClaudeCodeAdapter({ cleanup: false })

describe('skillMatches', () => {
  it.each([
    ['widget-manifest', 'widget-manifest', true],
    ['assay-probe:widget-manifest', 'widget-manifest', true],
    ['other:widget-manifest', 'widget-manifest', true],
    ['widget-manifest-v2', 'widget-manifest', false],
    ['assay-probe:other', 'widget-manifest', false],
    ['', 'widget-manifest', false],
  ])('%s vs %s → %s', (observed, target, expected) => {
    expect(skillMatches(observed, target)).toBe(expected)
  })
})

describe('readTriggerSignal — sağlam oturum', () => {
  it('Skill çağrısı varsa triggered true', async () => {
    const observation = await adapter.readTriggerSignal(
      session({
        parsed: { triggeredSkills: ['assay-probe:widget-manifest'] } as ParsedStream,
      }),
    )
    expect(observation).toMatchObject({
      available: true,
      triggered: true,
      complete: true,
    })
  })

  it('Skill çağrısı yoksa triggered false — bu bir gözlem, varsayım değil', async () => {
    const observation = await adapter.readTriggerSignal(session())
    expect(observation).toMatchObject({ available: true, triggered: false, skills: [] })
  })

  it('başka bir skill tetiklendiyse listede görünür ama triggered false', async () => {
    const observation = await adapter.readTriggerSignal(
      session({ parsed: { triggeredSkills: ['pdf'] } as ParsedStream }),
    )
    expect(observation).toMatchObject({
      available: true,
      triggered: false,
      skills: ['pdf'],
    })
  })

  it('via alanı sinyalin kaynağını söyler', async () => {
    const observation = await adapter.readTriggerSignal(session())
    expect(observation.available && observation.via).toContain('Skill tool call')
  })
})

describe('readTriggerSignal — çapraz kontrol düşerse okunamadı', () => {
  const broken: ReadonlyArray<[string, Partial<ClaudeCodeSession>, string]> = [
    [
      'result olayı hiç yok',
      { parsed: { result: undefined } as unknown as ParsedStream },
      'no result event',
    ],
    [
      'host hata bildirdi',
      { parsed: { result: { ...healthyResult, isError: true } } as ParsedStream },
      'reported an error',
    ],
    [
      'sıfır tur',
      { parsed: { result: { ...healthyResult, numTurns: 0 } } as ParsedStream },
      'zero turns',
    ],
    [
      'hiç çıktı token üretilmedi',
      { parsed: { result: { ...healthyResult, outputTokens: 0 } } as ParsedStream },
      'no output tokens',
    ],
    [
      'oturum completed değil',
      {
        parsed: {
          result: { ...healthyResult, terminalReason: 'api_error' },
        } as ParsedStream,
      },
      'ended as "api_error"',
    ],
    ['süreç hiç başlamadı', { spawnError: 'ENOENT' }, 'could not be started'],
  ]

  it.each(broken)('%s → available: false', async (_name, overrides, fragment) => {
    const observation = await adapter.readTriggerSignal(session(overrides))
    expect(observation.available).toBe(false)
    expect(!observation.available && observation.reason).toContain(fragment)
  })

  it('bozuk oturum asla triggered: false üretmez — "tetiklenmedi" ile karışmaz', async () => {
    for (const [, overrides] of broken) {
      const observation = await adapter.readTriggerSignal(session(overrides))
      expect(observation).not.toHaveProperty('triggered')
    }
  })

  it('init yoksa aktif skill seti bilinmiyor demektir', async () => {
    const observation = await adapter.readTriggerSignal(
      session({ parsed: { init: undefined } as unknown as ParsedStream }),
    )
    expect(observation.available).toBe(false)
    expect(!observation.available && observation.reason).toContain('no system/init')
  })
})

describe('readTrace', () => {
  it('iz varsa döner', async () => {
    expect(await adapter.readTrace(session())).toHaveLength(1)
  })

  it('süreç başlamadıysa undefined — boş dizi değil', async () => {
    expect(await adapter.readTrace(session({ spawnError: 'ENOENT' }))).toBeUndefined()
  })

  it('akış hiç gelmediyse undefined', async () => {
    const empty = session({
      parsed: { trace: [], result: undefined } as unknown as ParsedStream,
    })
    expect(await adapter.readTrace(empty)).toBeUndefined()
  })
})

describe('finalize', () => {
  it('sağlam oturum completed, maliyet ve gecikme taşır', async () => {
    const result = await adapter.finalize(session())
    expect(result.outcome).toBe('completed')
    expect(result.cost).toEqual({ inputTokens: 10, outputTokens: 42, usd: 0.01 })
  })

  it('sistem promptu hash alanı boş kalır — host vermiyor, uydurulmaz', async () => {
    const result = await adapter.finalize(session())
    expect(result.systemPromptHash).toBeUndefined()
  })

  it('ortam hash türetilir ve aktif skill seti raporlanır', async () => {
    const result = await adapter.finalize(session())
    expect(result.environmentHash).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(result.activeSkills).toEqual(['widget-manifest'])
  })

  it('çapraz kontrol düşerse outcome error', async () => {
    const result = await adapter.finalize(
      session({
        parsed: { result: { ...healthyResult, outputTokens: 0 } } as ParsedStream,
      }),
    )
    expect(result.outcome).toBe('error')
  })

  it('terminal_reason completed değilse aborted', async () => {
    const result = await adapter.finalize(
      session({
        parsed: {
          result: { ...healthyResult, terminalReason: 'interrupted' },
        } as ParsedStream,
      }),
    )
    expect(result.outcome).not.toBe('completed')
  })
})

describe('environmentHash', () => {
  it('aynı ortam aynı hash', () => {
    expect(environmentHash(init)).toBe(environmentHash({ ...init }))
  })

  it('liste sırası hash değiştirmez', () => {
    expect(environmentHash({ ...init, tools: ['Write', 'Read'] })).toBe(
      environmentHash(init),
    )
  })

  it.each([
    ['model', { model: 'other' }],
    ['sürüm', { version: '9.9.9' }],
    ['skill seti', { skills: ['widget-manifest', 'pdf'] }],
    ['araç seti', { tools: ['Read'] }],
    ['output style', { outputStyle: 'explanatory' }],
    ['plugin sürümü', { plugins: [{ name: 'assay-probe', version: '0.0.2' }] }],
  ])('%s değişince hash değişir', (_name, patch) => {
    expect(environmentHash({ ...init, ...patch })).not.toBe(environmentHash(init))
  })
})

describe('izin politikası', () => {
  it('varsayılan olarak ağ araçları reddedilir', () => {
    expect(new ClaudeCodeAdapter().deniedTools).toEqual(['WebFetch', 'WebSearch'])
  })

  it('çağıran listeyi değiştirebilir', () => {
    expect(new ClaudeCodeAdapter({ deniedTools: [] }).deniedTools).toEqual([])
  })
})

describe('güvenlik sınırları', () => {
  it('bypassPermissions bilerek istenmedikçe reddedilir', () => {
    expect(() => new ClaudeCodeAdapter({ permissionMode: 'bypassPermissions' })).toThrow(
      'removes every boundary',
    )
  })

  it('açıkça istenirse kabul edilir', () => {
    expect(
      () =>
        new ClaudeCodeAdapter({
          permissionMode: 'bypassPermissions',
          allowBypassPermissions: true,
        }),
    ).not.toThrow()
  })
})

describe('ortam allowlist"i — H1', () => {
  it('listede olmayan hiçbir değişken ajana geçmez', () => {
    process.env['ASSAY_TEST_SECRET'] = 'super-secret-value'
    process.env['GITHUB_TOKEN'] = 'ghp_should_not_leak'
    try {
      const passed = passthroughEnv()
      expect(passed['ASSAY_TEST_SECRET']).toBeUndefined()
      expect(passed['GITHUB_TOKEN']).toBeUndefined()
      expect(Object.values(passed)).not.toContain('super-secret-value')
    } finally {
      delete process.env['ASSAY_TEST_SECRET']
      delete process.env['GITHUB_TOKEN']
    }
  })

  it('sürecin çalışması için gerekenler geçer', () => {
    const passed = passthroughEnv()
    // PATH her platformda var; host onsuz çalışamaz.
    expect(passed['PATH'] ?? passed['Path']).toBeDefined()
  })

  it('tanımlı olmayan değişkenler boş string olarak sızmaz', () => {
    delete process.env['NODE_OPTIONS']
    expect('NODE_OPTIONS' in passthroughEnv()).toBe(false)
  })
})
