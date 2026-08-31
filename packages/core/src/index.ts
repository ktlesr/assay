/**
 * @assay/core — şema tipleri, kanonik kayıt, assertion motoru, skorlama.
 *
 * Bu paket başka bir Assay paketine bağlanmaz ve I/O yapmaz: dosya sistemi,
 * ağ, süreç yok. Kural eslint.config.js içinde makine seviyesinde zorlanır.
 */

export {
  parseSuite,
  validateSuite,
  suiteSchema,
  FILE_FORMATS,
  TRACE_RULES,
  type Suite,
  type SuiteCase,
  type Assertion,
  type SuiteIssue,
  type SuiteParseResult,
  type TraceRule,
  type FileFormat,
} from './suite.js'

export {
  comparePins,
  proportion,
  formatProportion,
  type Verdict,
  type VerdictDetail,
  type Pins,
  type PinComparison,
  type TraceEvent,
  type TraceEventKind,
  type SessionOutcome,
  type TriggerObservation,
  type NetworkRequest,
  type EnvDiff,
  type CapturedFile,
  type Evidence,
  type AssertionResult,
  type Cost,
  type Attempt,
  type CaseResult,
  type Run,
  type Proportion,
} from './records.js'

export {
  evaluateAssertion,
  evaluateAssertions,
  combineVerdicts,
  type AssertionContext,
} from './assertions.js'

export { evaluateNoSwallowedErrors } from './no-swallowed-errors.js'

export { evaluateTrigger, type TriggerExpectation } from './trigger.js'

export {
  countVerdicts,
  decidedRate,
  triggerAccuracy,
  flakiness,
  totals,
  summarize,
  type VerdictCounts,
  type TriggerObservationPoint,
  type TriggerAccuracy,
  type Flakiness,
  type Totals,
  type RunSummary,
} from './scoring.js'

export type { HostAdapter, AgentSession, RunConfig, SessionResult } from './adapter.js'

export {
  compareRuns,
  type ChangeStatus,
  type CaseComparison,
  type RunComparison,
} from './compare.js'

export { matchGlob, globToRegExp, normalizePath, isWithin } from './glob.js'
