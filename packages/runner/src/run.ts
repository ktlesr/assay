/**
 * Koşum motoru.
 *
 * Akış: suite → her vaka için N attempt → temiz sandbox → adaptörle koş →
 * kanıt topla → assertion'ları uygula → verdict → kayıt.
 *
 * Motorun tek işi kanıt toplayıp `core`'a vermek. Değerlendirmenin tamamı
 * `core`'da; runner karar vermez. Bu ayrım sayesinde aynı kayıt ileride
 * yeniden değerlendirilebilir.
 */

import { randomUUID } from 'node:crypto'
import { createHash } from 'node:crypto'
import {
  combineVerdicts,
  evaluateAssertions,
  evaluateTrigger,
  proportion,
  type AgentSession,
  type Attempt,
  type AssertionResult,
  type CaseResult,
  type Evidence,
  type HostAdapter,
  type Pins,
  type Run,
  type Suite,
  type SuiteCase,
  type TraceEvent,
  type TriggerObservation,
  type Verdict,
  type VerdictDetail,
} from '@assay/core'
import {
  captureFiles,
  createWorkspace,
  destroyWorkspace,
  envDiff,
  snapshot,
} from './sandbox.js'

export interface RunOptions {
  /** Suite'in ham kaynağı — pin 4'ün denetçisi olan içerik hash'i için. */
  source: string
  /** Suite'in yolu; `setup.fixtures` bunun yanından çözülür. */
  suitePath?: string
  /** Test edilen skill'in (plugin'in) yerel dizini. */
  skillPath: string
  /** `suite.runs` yerine geçer. Kullanıcı açıkça isterse 1 olabilir. */
  repeat?: number
  /** Vaka ve attempt ilerledikçe çağrılır. */
  onProgress?: (event: ProgressEvent) => void
  /** Zaman kaynağı — testlerde sabitlenebilir. */
  now?: () => Date
}

export interface ProgressEvent {
  caseId: string
  attempt: number
  attempts: number
  verdict: Verdict
  reason: string
}

/** Suite kaynağının içerik hash'i. Beyan edilen sürüm unutulursa bu yakalar. */
export function suiteHash(source: string): string {
  return `sha256:${createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex')}`
}

/**
 * Bir suite'i koşar.
 *
 * Adaptörün her çağrısı ayrı ayrı korunur: bir attempt çökerse koşum devam
 * eder ve o attempt `unknown` olur. Bir adaptör hatası tüm koşumu düşürmez,
 * ama sessizce `pass` da üretmez.
 */
export async function runSuite<S extends AgentSession>(
  suite: Suite,
  adapter: HostAdapter<S>,
  options: RunOptions,
): Promise<Run> {
  const now = options.now ?? (() => new Date())
  const repeat = options.repeat ?? suite.runs
  const startedAt = now().toISOString()
  const cases: CaseResult[] = []

  for (const testCase of suite.cases) {
    const attempts: Attempt[] = []
    for (let index = 0; index < repeat; index += 1) {
      const attempt = await runAttempt(suite, testCase, index, adapter, options, now)
      attempts.push(attempt)
      options.onProgress?.({
        caseId: testCase.id,
        attempt: index,
        attempts: repeat,
        verdict: attempt.verdict,
        reason: attempt.reason,
      })
    }
    cases.push(summarizeCase(testCase.id, attempts))
  }

  const allVerdicts = cases.flatMap((c) => c.attempts.map((a) => a.verdict))

  return {
    id: `run-${now().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`,
    startedAt,
    finishedAt: now().toISOString(),
    host: adapter.id,
    pins: pinsOf(suite, options.source),
    runs: repeat,
    cases,
    verdict: allVerdicts.includes('fail')
      ? 'fail'
      : allVerdicts.includes('unknown')
        ? 'unknown'
        : 'pass',
  }
}

export function pinsOf(suite: Suite, source: string): Pins {
  return {
    skillSource: suite.target.source,
    model: suite.environment.model,
    systemPromptHash: suite.environment.system_prompt_hash,
    suiteVersion: suite.version,
    suiteHash: suiteHash(source),
  }
}

function summarizeCase(caseId: string, attempts: readonly Attempt[]): CaseResult {
  const passed = attempts.filter((a) => a.verdict === 'pass').length
  const failed = attempts.filter((a) => a.verdict === 'fail').length
  const unknown = attempts.filter((a) => a.verdict === 'unknown').length
  return {
    caseId,
    attempts,
    // Değişmez #4: unknown'lar paydadan çıkar, ayrıca sayılır.
    passRate: proportion(passed, passed + failed),
    passed,
    failed,
    unknown,
  }
}

// ---------------------------------------------------------------------------
// Tek attempt
// ---------------------------------------------------------------------------

async function runAttempt<S extends AgentSession>(
  suite: Suite,
  testCase: SuiteCase,
  index: number,
  adapter: HostAdapter<S>,
  options: RunOptions,
  now: () => Date,
): Promise<Attempt> {
  const startedAt = now().toISOString()
  const began = Date.now()

  let workspace: Awaited<ReturnType<typeof createWorkspace>> | undefined
  try {
    workspace = await createWorkspace({
      fixtures: resolveFixtures(testCase, options.suitePath),
      prefix: 'assay-attempt-',
    })
  } catch (cause) {
    // Sandbox kurulamadıysa ölçüm yapılmadı; sessiz pass üretilemez.
    return unknownAttempt(
      testCase,
      index,
      startedAt,
      now,
      began,
      `the sandbox could not be prepared: ${message(cause)}`,
    )
  }

  let session: S | undefined
  let trigger: TriggerObservation = {
    available: false,
    reason: 'the adapter was never asked for a trigger signal',
  }
  let trace: readonly TraceEvent[] | undefined
  let evidence: Evidence = {}
  let latencyMs: number | undefined
  let cost: Attempt['cost']
  let adapterFailure: string | null = null

  try {
    session = await adapter.start({
      caseId: testCase.id,
      attempt: index,
      prompt: testCase.prompt,
      skill: {
        name: suite.target.skill,
        source: suite.target.source,
        path: options.skillPath,
      },
      model: suite.environment.model,
      activeSkills: suite.environment.active_skills ?? [],
      workdir: workspace.dir,
      ...(testCase.setup?.fixtures === undefined
        ? {}
        : { fixtures: testCase.setup.fixtures }),
    })

    trigger = await safely(
      () => adapter.readTriggerSignal(session as S),
      (reason): TriggerObservation => ({
        available: false,
        reason: `the adapter failed to read the trigger signal: ${reason}`,
      }),
    )
    trace = await safely(
      () => adapter.readTrace(session as S),
      () => undefined,
    )

    const result = await adapter.finalize(session)
    latencyMs = result.latencyMs
    cost = result.cost

    const after = await snapshot(workspace.dir)
    evidence = {
      files: result.files ?? (await captureFiles(workspace.dir)),
      ...(trace === undefined ? {} : { trace }),
      ...(result.exitCode === undefined ? {} : { exitCode: result.exitCode }),
      env:
        result.env ??
        envDiff({
          workdir: workspace.dir,
          before: workspace.before,
          after,
          trace,
          ...(deniedTools(adapter) === undefined
            ? {}
            : { deniedTools: deniedTools(adapter) as readonly string[] }),
        }),
    }
  } catch (cause) {
    adapterFailure = message(cause)
  } finally {
    if (workspace !== undefined) await destroyWorkspace(workspace)
  }

  if (adapterFailure !== null) {
    return unknownAttempt(
      testCase,
      index,
      startedAt,
      now,
      began,
      `the host adapter failed: ${adapterFailure}`,
      trigger,
      trace,
    )
  }

  const assertions: AssertionResult[] = evaluateAssertions(
    testCase.expect.assertions ?? [],
    evidence,
  )
  const triggerVerdict = evaluateTrigger(trigger, {
    triggered: testCase.expect.triggered,
    notTriggered: testCase.expect.not_triggered,
  })

  const parts: VerdictDetail[] = [
    ...(triggerVerdict === null ? [] : [triggerVerdict]),
    ...assertions,
  ]
  const combined = combineVerdicts(parts)

  return {
    index,
    caseId: testCase.id,
    startedAt,
    finishedAt: now().toISOString(),
    trigger,
    assertions,
    verdict: combined.verdict,
    reason: combined.reason,
    latencyMs: latencyMs ?? Date.now() - began,
    ...(cost === undefined ? {} : { cost }),
    ...(trace === undefined ? {} : { trace }),
    ...(evidence.env === undefined ? {} : { env: evidence.env }),
  }
}

function unknownAttempt(
  testCase: SuiteCase,
  index: number,
  startedAt: string,
  now: () => Date,
  began: number,
  reason: string,
  trigger?: TriggerObservation,
  trace?: readonly TraceEvent[],
): Attempt {
  return {
    index,
    caseId: testCase.id,
    startedAt,
    finishedAt: now().toISOString(),
    trigger: trigger ?? { available: false, reason },
    assertions: [],
    verdict: 'unknown',
    reason,
    latencyMs: Date.now() - began,
    ...(trace === undefined ? {} : { trace }),
  }
}

function resolveFixtures(testCase: SuiteCase, suitePath?: string): string | undefined {
  const fixtures = testCase.setup?.fixtures
  if (fixtures === undefined) return undefined
  if (suitePath === undefined) return fixtures
  const dir = suitePath.replace(/[\\/][^\\/]*$/, '')
  return `${dir}/${fixtures.replace(/^\.\//, '')}`
}

async function safely<T>(
  operation: () => Promise<T>,
  onFailure: (reason: string) => T,
): Promise<T> {
  try {
    return await operation()
  } catch (cause) {
    return onFailure(message(cause))
  }
}

/** Adaptör reddettiği araçları bildiriyorsa ağ iddiası buna göre işaretlenir. */
function deniedTools(adapter: unknown): readonly string[] | undefined {
  const value = (adapter as { deniedTools?: unknown }).deniedTools
  return Array.isArray(value) ? (value as readonly string[]) : undefined
}

const message = (cause: unknown) =>
  cause instanceof Error ? cause.message : String(cause)
