import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { PrismaPg } from '@prisma/adapter-pg'
import { proportion, type Attempt, type Run, type Suite } from '@assay/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PrismaClient } from '../generated/client/client.js'
import { RunAlreadyStoredError, listRuns, loadRun, storeRun } from './store.js'

/**
 * Gidip gelen kayıt aynı kayıt mı?
 *
 * Hosted taraf SDK'nın kaydını **alır**, kendi formatını dayatmaz
 * (docs/product.md). Bu iddia ancak yazılan kaydın geri okunanla aynı olduğu
 * gösterilirse doğrudur; şema sürüklenmesi tam da burada sessizce başlar.
 *
 * PGlite gerçek Postgres motoru; soket sunucusu onu Prisma'nın bağlanabileceği
 * bir porta açıyor. Test hiçbir dış servise ihtiyaç duymuyor.
 */

const migration = readFileSync(
  fileURLToPath(
    new URL('../prisma/migrations/20260831000000_init/migration.sql', import.meta.url),
  ),
  'utf8',
)

const PORT = 5480 + Math.floor(Math.random() * 60)

let pglite: PGlite
let server: PGLiteSocketServer
let db: PrismaClient

beforeAll(async () => {
  pglite = new PGlite()
  await pglite.exec(migration)
  server = new PGLiteSocketServer({ db: pglite, port: PORT, host: '127.0.0.1' })
  await server.start()
  db = new PrismaClient({
    // PGlite tek bağlantı konuşuyor; havuz bir bağlantıya sabitlenmezse
    // sunucu ikinciyi kapatıyor.
    adapter: new PrismaPg({
      connectionString: `postgres://postgres@127.0.0.1:${PORT}/postgres`,
      max: 1,
    }),
  })
}, 120_000)

afterAll(async () => {
  await db.$disconnect()
  await server.stop()
  await pglite.close()
})

// ---------------------------------------------------------------------------
// Girdi
// ---------------------------------------------------------------------------

const SUITE: Suite = {
  version: 1,
  target: { skill: 'widget-manifest', source: 'assay@examples/widget-manifest' },
  environment: {
    host: 'claude-code',
    model: 'claude-haiku-4-5-20251001',
    system_prompt_hash: 'not-provided-by-host',
    active_skills: ['widget-manifest'],
  },
  runs: 2,
  cases: [
    {
      id: 'trigger.positive.explicit',
      prompt: 'write a widget manifest',
      expect: {
        triggered: true,
        assertions: [{ type: 'file_exists', path: 'out/manifest.json' }],
      },
    },
    {
      id: 'trigger.negative.near_neighbor.readme',
      prompt: 'write a readme',
      expect: { triggered: false },
    },
  ],
}

const attempt = (index: number, verdict: 'pass' | 'fail' | 'unknown'): Attempt => ({
  index,
  caseId: 'trigger.positive.explicit',
  startedAt: '2026-08-31T17:00:00.000Z',
  finishedAt: '2026-08-31T17:00:09.000Z',
  trigger: {
    available: true,
    triggered: true,
    skills: ['widget-manifest'],
    complete: true,
    via: 'Skill tool call in stream-json',
  },
  assertions: [
    {
      assertion: { type: 'file_exists', path: 'out/manifest.json' },
      verdict,
      reason: verdict === 'pass' ? 'out/manifest.json exists' : 'nothing matched',
    },
  ],
  verdict,
  reason: verdict === 'unknown' ? 'the host produced no result message' : 'all assertions held',
  latencyMs: 9000,
  cost: { inputTokens: 120, outputTokens: 900, usd: 0.0123 },
  trace: [
    { seq: 1, kind: 'skill_trigger', skill: 'widget-manifest' },
    { seq: 2, kind: 'tool_call', id: 'call_1', tool: 'Write', args: { path: 'out/manifest.json' } },
    { seq: 3, kind: 'tool_result', callId: 'call_1', tool: 'Write' },
    { seq: 4, kind: 'session_end', outcome: 'completed' },
  ],
  env: {
    writes: ['out/manifest.json'],
    deletes: [],
    network: [],
    unobserved: [],
  },
})

const makeRun = (id: string, verdict: 'pass' | 'fail' = 'pass'): Run => ({
  id,
  skill: 'widget-manifest',
  startedAt: '2026-08-31T17:00:00.000Z',
  finishedAt: '2026-08-31T17:05:00.000Z',
  host: 'claude-code',
  pins: {
    skillSource: 'assay@examples/widget-manifest',
    skillHash: 'sha256:aaa',
    model: 'claude-haiku-4-5-20251001',
    systemPromptHash: 'not-provided-by-host',
    suiteVersion: 1,
    suiteHash: 'sha256:bbb',
  },
  runs: 2,
  cases: [
    {
      caseId: 'trigger.positive.explicit',
      expectedTrigger: true,
      attempts: [attempt(0, 'pass'), attempt(1, verdict)],
      passRate: proportion(verdict === 'pass' ? 2 : 1, 2),
      passed: verdict === 'pass' ? 2 : 1,
      failed: verdict === 'pass' ? 0 : 1,
      unknown: 0,
    },
  ],
  verdict,
})

// ---------------------------------------------------------------------------

describe('storeRun', () => {
  it('yazılan kaydı aynı şekilde geri verir', async () => {
    const run = makeRun('run-roundtrip-1')
    await storeRun(db, { suite: SUITE, suiteHash: 'sha256:bbb', run })

    const loaded = await loadRun(db, run.id)
    expect(loaded).not.toBeNull()
    expect(loaded).toEqual(run)
  })

  it('izi, assertion sonuçlarını ve ortam farkını korur', async () => {
    const run = makeRun('run-roundtrip-2', 'fail')
    await storeRun(db, { suite: SUITE, suiteHash: 'sha256:bbb', run })

    const loaded = await loadRun(db, run.id)
    const first = loaded?.cases[0]?.attempts[0]
    expect(first?.trace?.map((e) => e.kind)).toEqual([
      'skill_trigger',
      'tool_call',
      'tool_result',
      'session_end',
    ])
    expect(first?.assertions[0]?.assertion).toEqual({
      type: 'file_exists',
      path: 'out/manifest.json',
    })
    expect(first?.env?.writes).toEqual(['out/manifest.json'])
  })

  it('aynı koşumu iki kez yazmaz', async () => {
    const run = makeRun('run-duplicate')
    await storeRun(db, { suite: SUITE, suiteHash: 'sha256:bbb', run })
    await expect(
      storeRun(db, { suite: SUITE, suiteHash: 'sha256:bbb', run }),
    ).rejects.toBeInstanceOf(RunAlreadyStoredError)
  })

  it('negatif vakası olmayan bir suite kaydedilmez (değişmez #5)', async () => {
    const onlyPositive: Suite = {
      ...SUITE,
      cases: [SUITE.cases[0] as (typeof SUITE.cases)[number]],
    }
    await expect(
      storeRun(db, {
        suite: onlyPositive,
        suiteHash: 'sha256:ccc',
        run: makeRun('run-no-negative'),
      }),
    ).rejects.toThrow(/negative/i)
  })

  it('koşumda olup suite\'te olmayan bir vaka reddedilir', async () => {
    const run = makeRun('run-mismatch')
    const strayCase = { ...(run.cases[0] as (typeof run.cases)[number]), caseId: 'trigger.positive.absent' }
    await expect(
      storeRun(db, {
        suite: SUITE,
        suiteHash: 'sha256:bbb',
        run: { ...run, cases: [strayCase] },
      }),
    ).rejects.toThrow(/do not belong together/)
  })

  it('listRuns koşumları yeniden eskiye verir ve izleri taşımaz', async () => {
    const runs = await listRuns(db)
    expect(runs.length).toBeGreaterThanOrEqual(2)
    expect(runs[0]?.cases[0]?.attempts[0]?.trace).toBeUndefined()
    expect(runs[0]?.cases[0]?.passRate.n).toBe(2)
  })
})
