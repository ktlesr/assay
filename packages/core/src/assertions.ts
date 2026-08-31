/**
 * Assertion motoru.
 *
 * Değişmez #1'in tip seviyesinde zorlanması buradadır: her assertion hangi
 * kanıta ihtiyaç duyduğunu bildirir, sevk katmanı kanıt eksikse değerlendiriciyi
 * *hiç çağırmaz* ve `unknown` üretir. Değerlendiricilerin girdi tipinde eksik
 * alan yoktur, dolayısıyla veri yokluğunda `pass` döndürmek yapısal olarak
 * imkânsızdır.
 *
 * LLM judge yok (değişmez #6). Tüm kararlar deterministiktir.
 */

import { Ajv, type ValidateFunction } from 'ajv'
import { parse as parseYaml } from 'yaml'
import { isWithin, matchGlob } from './glob.js'
import { evaluateNoSwallowedErrors } from './no-swallowed-errors.js'
import type {
  AssertionResult,
  CapturedFile,
  EnvDiff,
  Evidence,
  TraceEvent,
  VerdictDetail,
} from './records.js'
import type { Assertion } from './suite.js'

// ---------------------------------------------------------------------------
// Kanıt gereksinimleri
// ---------------------------------------------------------------------------

type EvidenceKey = keyof Evidence

/** Kanıt alanı yoksa `unknown` mesajında ne yazacağı. */
const EVIDENCE_LABEL: Record<EvidenceKey, string> = {
  files: 'no files were captured from the run',
  trace: 'no trace was captured from the run',
  exitCode: 'the host did not report an exit code',
  env: 'no environment diff was captured from the run',
}

const REQUIRES: Record<Assertion['type'], readonly EvidenceKey[]> = {
  file_exists: ['files'],
  file_valid: ['files'],
  json_schema: ['files'],
  file_content_matches: ['files'],
  exit_code: ['exitCode'],
  trace: ['trace'],
  side_effect: ['env'],
}

/** Değerlendiriciye giden kanıt: istenen alanlar kesinlikle mevcut. */
type Resolved<K extends EvidenceKey> = { [P in K]-?: NonNullable<Evidence[P]> }

/** Aynı vakadaki diğer assertion'lardan gelen bağlam. */
export interface AssertionContext {
  /** `file_valid` yolsuz yazıldığında kullanılacak glob'lar. */
  fileExistsGlobs: readonly string[]
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

const pass = (reason: string, detail?: Record<string, unknown>): VerdictDetail =>
  detail === undefined ? { verdict: 'pass', reason } : { verdict: 'pass', reason, detail }
const fail = (reason: string, detail?: Record<string, unknown>): VerdictDetail =>
  detail === undefined ? { verdict: 'fail', reason } : { verdict: 'fail', reason, detail }
const unknown = (reason: string, detail?: Record<string, unknown>): VerdictDetail =>
  detail === undefined ? { verdict: 'unknown', reason } : { verdict: 'unknown', reason, detail }

const decoder = new TextDecoder('utf-8', { fatal: false })
const text = (file: CapturedFile): string => decoder.decode(file.bytes)

/** Bayt dizisinde ASCII alt dizi arar. Zip girdi adlarını sınamak için. */
function bytesInclude(bytes: Uint8Array, ascii: string): boolean {
  const needle = ascii.split('').map((c) => c.charCodeAt(0))
  outer: for (let i = 0; i + needle.length <= bytes.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (bytes[i + j] !== needle[j]) continue outer
    }
    return true
  }
  return false
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]
const isZip = (bytes: Uint8Array) => ZIP_MAGIC.every((byte, i) => bytes[i] === byte)

const matching = (files: readonly CapturedFile[], glob: string) =>
  files.filter((file) => matchGlob(glob, file.path))

const ajv = new Ajv({ strict: false, allErrors: true })
const compiled = new Map<string, ValidateFunction>()

/** Aynı şema tekrar tekrar derlenmesin. Şema nesnesi anahtar olarak serileşir. */
function compile(schema: Readonly<Record<string, unknown>>): ValidateFunction | Error {
  const key = JSON.stringify(schema)
  const hit = compiled.get(key)
  if (hit !== undefined) return hit
  try {
    const validate = ajv.compile(schema as object)
    compiled.set(key, validate)
    return validate
  } catch (cause) {
    return cause instanceof Error ? cause : new Error(String(cause))
  }
}

// ---------------------------------------------------------------------------
// Dosya biçimi doğrulaması
// ---------------------------------------------------------------------------

/**
 * ponytail: yapısal koklama. docx/xlsx için zip sihirli baytları artı zorunlu
 * girdi adının varlığı; pdf için başlık ve fragman. XML'in iyi biçimli olduğunu
 * doğrulamaz — bunun için arşivi açmak gerekir, o da runner'ın işi ve bir
 * bağımlılık demek. Tavan bu; yükseltme yolu runner'da unzip.
 */
function checkFormat(file: CapturedFile, format: string): VerdictDetail {
  switch (format) {
    case 'json': {
      try {
        JSON.parse(text(file))
        return pass(`${file.path} parses as JSON`)
      } catch (cause) {
        return fail(`${file.path} is not valid JSON: ${(cause as Error).message}`)
      }
    }
    case 'yaml': {
      try {
        parseYaml(text(file))
        return pass(`${file.path} parses as YAML`)
      } catch (cause) {
        return fail(`${file.path} is not valid YAML: ${(cause as Error).message}`)
      }
    }
    case 'pdf': {
      const head = text({ path: file.path, bytes: file.bytes.slice(0, 8) })
      if (!head.startsWith('%PDF-')) return fail(`${file.path} has no %PDF- header`)
      if (!bytesInclude(file.bytes, '%%EOF')) return fail(`${file.path} has no %%EOF trailer`)
      return pass(`${file.path} has a PDF header and trailer`)
    }
    case 'docx':
    case 'xlsx': {
      const entry = format === 'docx' ? 'word/document.xml' : 'xl/workbook.xml'
      if (!isZip(file.bytes)) return fail(`${file.path} is not a zip archive`)
      if (!bytesInclude(file.bytes, entry)) {
        return fail(`${file.path} is a zip archive but contains no ${entry}`)
      }
      return pass(`${file.path} is a zip archive containing ${entry}`)
    }
    default:
      return unknown(`unsupported format "${format}"`)
  }
}

// ---------------------------------------------------------------------------
// Değerlendiriciler
// ---------------------------------------------------------------------------

function evaluateFiles(
  assertion: Extract<
    Assertion,
    { type: 'file_exists' | 'file_valid' | 'json_schema' | 'file_content_matches' }
  >,
  evidence: Resolved<'files'>,
  context: AssertionContext,
): VerdictDetail {
  const { files } = evidence

  if (assertion.type === 'file_exists') {
    const hits = matching(files, assertion.path)
    return hits.length > 0
      ? pass(`${hits.length} file(s) match ${assertion.path}`, {
          matched: hits.map((f) => f.path),
        })
      : fail(`no file matches ${assertion.path}`, { captured: files.map((f) => f.path) })
  }

  if (assertion.type === 'file_valid') {
    const globs = assertion.path === undefined ? context.fileExistsGlobs : [assertion.path]
    const targets = globs.flatMap((glob) => matching(files, glob))
    if (targets.length === 0) {
      return fail(`no file matches ${globs.join(', ')}, so nothing could be validated`, {
        captured: files.map((f) => f.path),
      })
    }
    const results = targets.map((file) => checkFormat(file, assertion.format))
    const bad = results.filter((r) => r.verdict !== 'pass')
    if (bad.length === 0) {
      return pass(`${targets.length} file(s) are valid ${assertion.format}`)
    }
    const unresolved = bad.filter((r) => r.verdict === 'unknown')
    return unresolved.length === bad.length
      ? unknown(bad.map((r) => r.reason).join('; '))
      : fail(
          bad
            .filter((r) => r.verdict === 'fail')
            .map((r) => r.reason)
            .join('; '),
        )
  }

  if (assertion.type === 'json_schema') {
    const targets = matching(files, assertion.path)
    if (targets.length === 0) return fail(`no file matches ${assertion.path}`)
    const validate = compile(assertion.schema)
    if (validate instanceof Error) {
      return unknown(`the assertion's JSON Schema could not be compiled: ${validate.message}`)
    }
    const failures: string[] = []
    for (const file of targets) {
      let parsed: unknown
      try {
        parsed = JSON.parse(text(file))
      } catch (cause) {
        failures.push(`${file.path} is not valid JSON: ${(cause as Error).message}`)
        continue
      }
      if (!validate(parsed)) {
        const errors = (validate.errors ?? [])
          .map((e) => `${e.instancePath === '' ? '/' : e.instancePath} ${e.message ?? ''}`.trim())
          .join('; ')
        failures.push(`${file.path} does not match the schema: ${errors}`)
      }
    }
    return failures.length === 0
      ? pass(`${targets.length} file(s) match the schema`)
      : fail(failures.join(' | '))
  }

  const targets = matching(files, assertion.path)
  if (targets.length === 0) return fail(`no file matches ${assertion.path}`)
  let pattern: RegExp
  try {
    pattern = new RegExp(assertion.matches, assertion.flags)
  } catch (cause) {
    return unknown(`the assertion's regex is invalid: ${(cause as Error).message}`)
  }
  const misses = targets.filter((file) => !pattern.test(text(file))).map((f) => f.path)
  return misses.length === 0
    ? pass(`${targets.length} file(s) match /${assertion.matches}/`)
    : fail(`${misses.join(', ')} do not match /${assertion.matches}/`)
}

function evaluateTrace(
  assertion: Extract<Assertion, { type: 'trace' }>,
  evidence: Resolved<'trace'>,
): VerdictDetail {
  const { trace } = evidence
  const calls = [...trace]
    .sort((a, b) => a.seq - b.seq)
    .filter((event: TraceEvent) => event.kind === 'tool_call')

  switch (assertion.rule) {
    case 'no_swallowed_errors':
      return evaluateNoSwallowedErrors(trace)

    case 'tool_called': {
      const wanted = assertion.tool
      if (wanted === undefined) return unknown('the assertion names no tool')
      const times = calls.filter((call) => call.tool === wanted).length
      const minimum = assertion.min_times ?? 1
      return times >= minimum
        ? pass(`${wanted} was called ${times} time(s), at least ${minimum} required`)
        : fail(`${wanted} was called ${times} time(s), at least ${minimum} required`, {
            calledTools: calls.map((c) => c.tool ?? null),
          })
    }

    case 'tool_sequence': {
      const wanted = assertion.tools ?? []
      let cursor = 0
      for (const call of calls) {
        if (call.tool === wanted[cursor]) cursor += 1
        if (cursor === wanted.length) break
      }
      return cursor === wanted.length
        ? pass(`the calls contain ${wanted.join(' → ')} in order`)
        : fail(
            `the calls do not contain ${wanted.join(' → ')} in order; stopped waiting for "${wanted[cursor] ?? ''}"`,
            { calledTools: calls.map((c) => c.tool ?? null) },
          )
    }

    case 'tool_args_valid': {
      const wanted = assertion.tool
      const schema = assertion.schema
      if (wanted === undefined || schema === undefined) {
        return unknown('the assertion names no tool or carries no schema')
      }
      const relevant = calls.filter((call) => call.tool === wanted)
      if (relevant.length === 0) return fail(`${wanted} was never called`)
      const validate = compile(schema)
      if (validate instanceof Error) {
        return unknown(`the assertion's JSON Schema could not be compiled: ${validate.message}`)
      }
      const failures = relevant
        .filter((call) => !validate(call.args ?? {}))
        .map((call) => `seq ${call.seq}: ${ajv.errorsText(validate.errors)}`)
      return failures.length === 0
        ? pass(`all ${relevant.length} call(s) to ${wanted} carry valid arguments`)
        : fail(failures.join(' | '))
    }
  }
}

function evaluateSideEffect(
  assertion: Extract<Assertion, { type: 'side_effect' }>,
  evidence: Resolved<'env'>,
): VerdictDetail {
  const env: EnvDiff = evidence.env
  const problems: string[] = []

  if (assertion.writes_within !== undefined) {
    const strays = env.writes.filter((path) => !isWithin(assertion.writes_within ?? [], path))
    if (strays.length > 0) {
      problems.push(
        `wrote outside ${assertion.writes_within.join(', ')}: ${strays.join(', ')}`,
      )
    }
  }

  if (assertion.network === 'deny') {
    const allowed = env.network.filter((request) => !request.blocked)
    if (allowed.length > 0) {
      problems.push(`network was denied but reached ${allowed.map((r) => r.host).join(', ')}`)
    }
  }

  return problems.length === 0
    ? pass('no side effect crossed the declared boundary', {
        writes: env.writes.length,
        networkRequests: env.network.length,
      })
    : fail(problems.join('; '), { writes: env.writes, network: env.network })
}

// ---------------------------------------------------------------------------
// Sevk
// ---------------------------------------------------------------------------

/**
 * Tek bir assertion'ı değerlendirir.
 *
 * Gerekli kanıt eksikse değerlendirici çağrılmaz; sonuç `unknown` olur ve hangi
 * sinyalin eksik olduğu yazılır.
 */
export function evaluateAssertion(
  assertion: Assertion,
  evidence: Evidence,
  context: AssertionContext = { fileExistsGlobs: [] },
): AssertionResult {
  for (const key of REQUIRES[assertion.type]) {
    if (evidence[key] === undefined) {
      return { assertion, ...unknown(EVIDENCE_LABEL[key]) }
    }
  }

  switch (assertion.type) {
    case 'exit_code': {
      const actual = evidence.exitCode as number
      return {
        assertion,
        ...(actual === assertion.equals
          ? pass(`the process exited with ${actual}`)
          : fail(`the process exited with ${actual}, expected ${assertion.equals}`)),
      }
    }
    case 'trace':
      return { assertion, ...evaluateTrace(assertion, { trace: evidence.trace as TraceEvent[] }) }
    case 'side_effect':
      return { assertion, ...evaluateSideEffect(assertion, { env: evidence.env as EnvDiff }) }
    default:
      return {
        assertion,
        ...evaluateFiles(
          assertion,
          { files: evidence.files as CapturedFile[] },
          context,
        ),
      }
  }
}

/**
 * Bir vakanın tüm assertion'larını değerlendirir.
 *
 * `file_valid` yolsuz yazıldığında aynı vakanın `file_exists` glob'larına
 * düşer; bağlam burada kurulur.
 */
export function evaluateAssertions(
  assertions: readonly Assertion[],
  evidence: Evidence,
): AssertionResult[] {
  const context: AssertionContext = {
    fileExistsGlobs: assertions
      .filter((a) => a.type === 'file_exists')
      .map((a) => (a as Extract<Assertion, { type: 'file_exists' }>).path),
  }
  return assertions.map((assertion) => evaluateAssertion(assertion, evidence, context))
}

/**
 * Assertion sonuçlarını tek bir verdict'e indirger.
 *
 * Bir `fail` varsa `fail`. Hiç `fail` yok ama `unknown` varsa `unknown` —
 * ölçülemeyen bir şey geçmiş sayılmaz. Hepsi `pass` ise `pass`.
 */
export function combineVerdicts(results: readonly VerdictDetail[]): VerdictDetail {
  const failed = results.filter((r) => r.verdict === 'fail')
  if (failed.length > 0) {
    return { verdict: 'fail', reason: failed.map((r) => r.reason).join(' | ') }
  }
  const unresolved = results.filter((r) => r.verdict === 'unknown')
  if (unresolved.length > 0) {
    return { verdict: 'unknown', reason: unresolved.map((r) => r.reason).join(' | ') }
  }
  if (results.length === 0) {
    return { verdict: 'unknown', reason: 'nothing was asserted' }
  }
  return { verdict: 'pass', reason: `all ${results.length} assertion(s) passed` }
}
