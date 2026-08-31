/**
 * Koşum kaydının veritabanına yazılması ve geri okunması.
 *
 * Platform ölçmez, hatırlar (docs/product.md). Bu dosya hatırlamanın tamamı:
 * SDK'nın ürettiği kanonik kaydı alır, satırlara açar, aynı kaydı geri kurar.
 * Kendi formatını dayatmaz — geri okunan `Run`, yazılan `Run`'dır.
 */

import type { Assertion, AssertionResult, Attempt, Run, Suite, Verdict } from '@assay/core'
import type { PrismaClient } from '../generated/client/client.js'
import {
  assertSuiteStorable,
  fromAttemptRow,
  fromCaseResultRow,
  fromRunRow,
  toAttemptRow,
  toCaseResultRow,
  toCaseRow,
  toEnvDiffRow,
  toRunRow,
  toSuiteRow,
  toTraceEventRow,
} from './mapping.js'

const VERDICT_TO_DB = { pass: 'PASS', fail: 'FAIL', unknown: 'UNKNOWN' } as const
const VERDICT_FROM_DB: Record<string, Verdict> = {
  PASS: 'pass',
  FAIL: 'fail',
  UNKNOWN: 'unknown',
}

export class RunAlreadyStoredError extends Error {
  constructor(id: string) {
    super(`run ${id} is already stored`)
    this.name = 'RunAlreadyStoredError'
  }
}

/**
 * Bir koşumu ve ait olduğu vaka setini yazar.
 *
 * Tek bir işlem: yarım yazılmış bir koşum, ölçülmemiş bir vakayı "hiç
 * koşulmamış" gibi gösterirdi. Suite aynı içerikle daha önce yazıldıysa
 * yeniden kullanılır — pin 4 zaten içeriği kimliklendiriyor.
 */
export async function storeRun(
  db: PrismaClient,
  input: { suite: Suite; suiteHash: string; run: Run; ownerId?: string | undefined },
): Promise<{ runId: string; suiteId: string }> {
  assertSuiteStorable(input.suite)

  const existing = await db.run.findUnique({ where: { id: input.run.id } })
  if (existing !== null) throw new RunAlreadyStoredError(input.run.id)

  const suiteRow = toSuiteRow(input.suite, input.suiteHash)
  const runRow = toRunRow(input.run)

  return db.$transaction(async (tx) => {
    const suite = await tx.suite.upsert({
      where: {
        skill_version_hash: {
          skill: suiteRow.skill,
          version: suiteRow.version,
          hash: suiteRow.hash,
        },
      },
      update: {},
      create: {
        ...suiteRow,
        ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      },
    })

    for (const testCase of input.suite.cases) {
      const row = toCaseRow(testCase)
      await tx.case.upsert({
        where: { suiteId_caseId: { suiteId: suite.id, caseId: row.caseId } },
        update: {},
        create: { ...row, suiteId: suite.id, assertions: row.assertions as never },
      })
    }

    const cases = await tx.case.findMany({ where: { suiteId: suite.id } })
    const caseIdByName = new Map(cases.map((c) => [c.caseId, c.id]))

    await tx.run.create({
      data: {
        ...runRow,
        verdict: runRow.verdict as 'PASS' | 'FAIL' | 'UNKNOWN',
        suiteId: suite.id,
        ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      },
    })

    for (const result of input.run.cases) {
      const caseRowId = caseIdByName.get(result.caseId)
      if (caseRowId === undefined) {
        // Kayıtta olup suite'te olmayan bir vaka: suite ile koşum eşleşmiyor.
        throw new Error(
          `case ${result.caseId} is in the run but not in the case set — the two do not belong together`,
        )
      }
      const resultRow = toCaseResultRow(result)
      const stored = await tx.caseResult.create({
        data: {
          ...resultRow,
          runId: input.run.id,
          caseId: caseRowId,
        },
      })

      for (const attempt of result.attempts) {
        const attemptRow = toAttemptRow(attempt)
        const storedAttempt = await tx.attempt.create({
          data: {
            ...attemptRow,
            verdict: attemptRow.verdict as 'PASS' | 'FAIL' | 'UNKNOWN',
            caseResultId: stored.id,
          },
        })

        if (attempt.trace !== undefined && attempt.trace.length > 0) {
          await tx.traceEvent.createMany({
            data: attempt.trace.map((event) => {
              const row = toTraceEventRow(event)
              return {
                ...row,
                kind: row.kind as never,
                outcome: row.outcome as never,
                args: row.args as never,
                attemptId: storedAttempt.id,
              }
            }),
          })
        }

        if (attempt.assertions.length > 0) {
          await tx.assertionResult.createMany({
            data: attempt.assertions.map((result_) => ({
              attemptId: storedAttempt.id,
              assertion: result_.assertion as never,
              verdict: VERDICT_TO_DB[result_.verdict],
              reason: result_.reason,
              detail: (result_.detail ?? null) as never,
            })),
          })
        }

        if (attempt.env !== undefined) {
          const envRow = toEnvDiffRow(attempt.env)
          await tx.envDiff.create({
            data: { ...envRow, network: envRow.network as never, attemptId: storedAttempt.id },
          })
        }
      }
    }

    return { runId: input.run.id, suiteId: suite.id }
  })
}

// ---------------------------------------------------------------------------
// Okuma
// ---------------------------------------------------------------------------

/**
 * Kimin neyi görebildiği.
 *
 * Bir koşum kaydı istem metinlerini, araç argümanlarını ve dosya yollarını
 * taşıyor; varsayılan gizli. Görünürlük sorgunun içinde, çağıranın elinde
 * değil: filtrelemeyi çağırana bırakmak, bir ekranda unutulunca sessiz bir
 * sızıntı olur.
 */
export type RunScope =
  /** Yalnızca herkese açık işaretlenmiş vaka setleri. Oturumsuz ziyaretçi. */
  | { kind: 'public' }
  /** Kendi koşumları ve herkese açık olanlar. */
  | { kind: 'viewer'; userId: string }
  /** Her şey. Yalnızca yönetici. */
  | { kind: 'all' }

function scopeWhere(scope: RunScope) {
  if (scope.kind === 'all') return {}
  if (scope.kind === 'public') return { suite: { public: true } }
  return { OR: [{ ownerId: scope.userId }, { suite: { public: true } }] }
}

/**
 * Koşum listesi — iz ve kanıt olmadan.
 *
 * Skorlama attempt'lerin verdict'i, tetiklenmesi ve maliyetiyle yapılıyor;
 * liste ekranı için izleri taşımak boşuna trafik.
 */
export async function listRuns(
  db: PrismaClient,
  scope: RunScope,
  limit = 200,
): Promise<Run[]> {
  const rows = await db.run.findMany({
    where: scopeWhere(scope),
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: { cases: { include: { attempts: true, case: true } } },
  })
  return rows.map((row) =>
    fromRunRow(row, row.cases.map((c) => buildCaseResult(c, undefined))),
  )
}

/** Tek koşum — izler, assertion sonuçları ve ortam farkıyla birlikte. */
export async function loadRun(
  db: PrismaClient,
  id: string,
  scope: RunScope,
): Promise<Run | null> {
  const row = await db.run.findFirst({
    where: { id, ...scopeWhere(scope) },
    include: {
      cases: {
        include: {
          case: true,
          attempts: {
            include: { events: { orderBy: { seq: 'asc' } }, assertions: true, envDiff: true },
          },
        },
      },
    },
  })
  if (row === null) return null
  return fromRunRow(row, row.cases.map((c) => buildCaseResult(c, 'full')))
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma'nın include tipleri burada yalnızca satır şeklini tarif ediyor. */
function buildCaseResult(caseRow: any, depth: 'full' | undefined) {
  const attempts: Attempt[] = caseRow.attempts.map((attempt: any) => {
    const base = fromAttemptRow(
      { ...attempt, costUsd: attempt.costUsd === null ? null : String(attempt.costUsd) },
      caseRow.case.caseId,
      depth === 'full' ? attempt.events : undefined,
      depth === 'full' ? (attempt.envDiff ?? undefined) : undefined,
    )
    if (depth !== 'full') return base
    const assertions: AssertionResult[] = attempt.assertions.map((row: any) => ({
      assertion: row.assertion as Assertion,
      verdict: VERDICT_FROM_DB[row.verdict] ?? 'unknown',
      reason: row.reason,
      ...(row.detail === null ? {} : { detail: row.detail as Record<string, unknown> }),
    }))
    return { ...base, assertions }
  })
  attempts.sort((a, b) => a.index - b.index)
  return fromCaseResultRow({ ...caseRow, caseId: caseRow.case.caseId }, attempts)
}
/* eslint-enable @typescript-eslint/no-explicit-any */
