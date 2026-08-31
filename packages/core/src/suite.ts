/**
 * Vaka seti (suite) şeması ve doğrulayıcısı.
 *
 * Girdi bir YAML *metnidir*, dosya yolu değil: core I/O yapmaz. Dosyayı okumak
 * runner'ın işi.
 *
 * Doğrulama iki katman:
 *  1. Zod — biçim. Alan var mı, tipi doğru mu.
 *  2. Anlamsal geçiş — docs/invariants.md'nin dayattığı kurallar. Hata
 *     mesajları burada, çünkü zod'un ürettiği birleşim hataları eyleme dönük
 *     değil.
 *
 * Kullanıcıya görünen tüm metinler İngilizce: SDK Apache-2.0 ve uluslararası
 * skill yazarlarına hitap ediyor. Kod yorumları Türkçe (bkz. docs/decisions.md).
 */

import { parse as parseYaml } from 'yaml'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Şema
// ---------------------------------------------------------------------------

/** Hiyerarşik vaka kimliği: `trigger.negative.near_neighbor.pdf` */
const CASE_ID = /^[a-z0-9]+(?:\.[a-z0-9_]+)+$/

/** `near_neighbor` segmenti taşıyan negatif vaka, tetiklenme suite'inin asıl sinyali. */
const NEAR_NEIGHBOR_SEGMENT = 'near_neighbor'

export const FILE_FORMATS = ['docx', 'pdf', 'xlsx', 'json', 'yaml'] as const
export const TRACE_RULES = [
  'no_swallowed_errors',
  'tool_called',
  'tool_sequence',
  'tool_args_valid',
] as const

const caseIdSchema = z
  .string()
  .regex(
    CASE_ID,
    'case id must be hierarchical and lowercase, e.g. "trigger.positive.explicit"',
  )

const assertionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('file_exists'),
    /** Glob. `out/*.docx` gibi. */
    path: z.string().min(1),
  }),
  z.object({
    type: z.literal('file_valid'),
    /** Verilmezse, aynı vakadaki file_exists ile eşleşen tüm dosyalara uygulanır. */
    path: z.string().min(1).optional(),
    format: z.enum(FILE_FORMATS),
  }),
  z.object({
    type: z.literal('json_schema'),
    path: z.string().min(1),
    schema: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('exit_code'),
    equals: z.number().int(),
  }),
  z.object({
    type: z.literal('file_content_matches'),
    path: z.string().min(1),
    /** JavaScript regex kaynağı. */
    matches: z.string().min(1),
    flags: z.string().optional(),
  }),
  z.object({
    type: z.literal('trace'),
    rule: z.enum(TRACE_RULES),
    tool: z.string().min(1).optional(),
    tools: z.array(z.string().min(1)).optional(),
    schema: z.record(z.string(), z.unknown()).optional(),
    min_times: z.number().int().positive().optional(),
  }),
  z.object({
    type: z.literal('side_effect'),
    writes_within: z.array(z.string().min(1)).optional(),
    network: z.enum(['allow', 'deny']).optional(),
  }),
])

const expectSchema = z.object({
  triggered: z.boolean().optional(),
  /**
   * Coexistence: bu vakada tetiklenmemesi gereken diğer skill'ler.
   * v0'da opsiyonel; şemada bugün var, çünkü sonradan eklemek mevcut suite
   * dosyalarını bozar.
   */
  not_triggered: z.array(z.string().min(1)).optional(),
  assertions: z.array(assertionSchema).optional(),
})

const caseSchema = z.object({
  id: caseIdSchema,
  prompt: z.string().min(1, 'case prompt cannot be empty'),
  setup: z
    .object({
      fixtures: z.string().min(1).optional(),
      cwd: z.string().min(1).optional(),
    })
    .optional(),
  expect: expectSchema,
})

const environmentSchema = z.object({
  host: z.string().min(1, 'environment.host is required: which host runs this suite'),
  /** Pin 2 — tam model kimliği, "en son" değil. */
  model: z
    .string()
    .min(
      1,
      'environment.model is required (pin 2 of 4): use the exact model id, never "latest"',
    ),
  /** Pin 3 — host'un verdiği sistem promptunun hash'i. */
  system_prompt_hash: z
    .string()
    .min(1, 'environment.system_prompt_hash is required (pin 3 of 4)'),
  /** Coexistence için. v0'da opsiyonel. */
  active_skills: z.array(z.string().min(1)).optional(),
})

const targetSchema = z.object({
  skill: z.string().min(1, 'target.skill is required: which skill is under test'),
  /** Pin 1 — skill sürümü. `owner/repo@<commit-sha>` veya içerik hash'i. */
  source: z
    .string()
    .min(
      1,
      'target.source is required (pin 1 of 4): pin the skill version, e.g. "anthropics/skills@<commit-sha>"',
    ),
})

export const suiteSchema = z.object({
  /**
   * Pin 4 — vaka seti sürümü. Vakalar değiştiğinde artırılır.
   * Runner ayrıca suite kaynağının içerik hash'ini kaydeder; beyan edilen sürüm
   * unutulduğunda kayma bu hash'ten görülür.
   */
  version: z
    .number()
    .int()
    .positive(
      'version is required (pin 4 of 4): the case set version, bumped whenever cases change',
    ),
  target: targetSchema,
  environment: environmentSchema,
  /** Değişmez #3: tekrar varsayılanı asla 1 değil. */
  runs: z
    .number()
    .int()
    .min(
      2,
      'runs must be at least 2: a single attempt is an observation, not a measurement (invariant: the repeat count is never 1)',
    ),
  cases: z.array(caseSchema).min(1, 'cases cannot be empty'),
})

export type Suite = z.infer<typeof suiteSchema>
export type SuiteCase = z.infer<typeof caseSchema>
export type Assertion = z.infer<typeof assertionSchema>
export type TraceRule = (typeof TRACE_RULES)[number]
export type FileFormat = (typeof FILE_FORMATS)[number]

// ---------------------------------------------------------------------------
// Sonuç tipleri
// ---------------------------------------------------------------------------

export interface SuiteIssue {
  level: 'error' | 'warning'
  /** YAML içindeki konum: `cases[2].expect.assertions[0].tool` */
  path: string
  message: string
}

export type SuiteParseResult =
  | { ok: true; suite: Suite; issues: SuiteIssue[] }
  | { ok: false; suite?: undefined; issues: SuiteIssue[] }

// ---------------------------------------------------------------------------
// Anlamsal kurallar
// ---------------------------------------------------------------------------

const error = (path: string, message: string): SuiteIssue => ({
  level: 'error',
  path,
  message,
})
const warning = (path: string, message: string): SuiteIssue => ({
  level: 'warning',
  path,
  message,
})

/** Trace kuralı başına zorunlu alanlar. Zod birleşimi yerine burada: mesajlar eyleme dönük. */
const TRACE_REQUIREMENTS: Record<TraceRule, { field?: 'tool' | 'tools'; hint: string }> =
  {
    no_swallowed_errors: { hint: '' },
    tool_called: {
      field: 'tool',
      hint: 'name the tool that must be called, e.g. tool: Write',
    },
    tool_sequence: {
      field: 'tools',
      hint: 'list the tools in the order they must appear, e.g. tools: [Read, Write]',
    },
    tool_args_valid: { field: 'tool', hint: 'name the tool whose arguments are checked' },
  }

function checkAssertions(c: SuiteCase, index: number, issues: SuiteIssue[]): void {
  const assertions = c.expect.assertions ?? []
  const hasFileExists = assertions.some((a) => a.type === 'file_exists')

  assertions.forEach((assertion, i) => {
    const at = `cases[${index}].expect.assertions[${i}]`

    if (
      assertion.type === 'file_valid' &&
      assertion.path === undefined &&
      !hasFileExists
    ) {
      issues.push(
        error(
          `${at}.path`,
          "file_valid without a path falls back to the files matched by this case's file_exists assertions, but this case has none: add a path or a file_exists assertion",
        ),
      )
    }

    if (assertion.type === 'trace') {
      const requirement = TRACE_REQUIREMENTS[assertion.rule]
      const field = requirement.field
      if (field !== undefined && assertion[field] === undefined) {
        issues.push(
          error(
            `${at}.${field}`,
            `trace rule "${assertion.rule}" requires ${field}: ${requirement.hint}`,
          ),
        )
      }
      if (assertion.rule === 'tool_args_valid' && assertion.schema === undefined) {
        issues.push(
          error(
            `${at}.schema`,
            'trace rule "tool_args_valid" requires schema: a JSON Schema for the tool arguments',
          ),
        )
      }
      if (assertion.rule === 'tool_sequence' && (assertion.tools?.length ?? 0) < 2) {
        issues.push(
          error(
            `${at}.tools`,
            'trace rule "tool_sequence" needs at least two tools to describe an order',
          ),
        )
      }
    }

    if (assertion.type === 'file_content_matches') {
      try {
        new RegExp(assertion.matches, assertion.flags)
      } catch (cause) {
        issues.push(
          error(
            `${at}.matches`,
            `file_content_matches carries an invalid regex: ${(cause as Error).message}`,
          ),
        )
      }
    }

    if (
      assertion.type === 'side_effect' &&
      assertion.writes_within === undefined &&
      assertion.network === undefined
    ) {
      issues.push(
        error(at, 'side_effect asserts nothing: set writes_within, network, or both'),
      )
    }
  })
}

function checkCases(suite: Suite, issues: SuiteIssue[]): void {
  const seen = new Map<string, number>()
  const activeSkills = new Set(suite.environment.active_skills ?? [])
  let negatives = 0
  let nearNeighbours = 0

  suite.cases.forEach((c, index) => {
    const at = `cases[${index}]`

    const firstSeen = seen.get(c.id)
    if (firstSeen !== undefined) {
      issues.push(
        error(
          `${at}.id`,
          `duplicate case id "${c.id}", first defined at cases[${firstSeen}]: ids must be unique`,
        ),
      )
    } else {
      seen.set(c.id, index)
    }

    const { triggered, not_triggered: notTriggered, assertions } = c.expect

    if (
      triggered === undefined &&
      (assertions?.length ?? 0) === 0 &&
      (notTriggered?.length ?? 0) === 0
    ) {
      issues.push(
        error(
          `${at}.expect`,
          `case "${c.id}" measures nothing: set expect.triggered, or add assertions`,
        ),
      )
    }

    if (triggered === false) {
      negatives += 1
      if (c.id.split('.').includes(NEAR_NEIGHBOR_SEGMENT)) nearNeighbours += 1
    }

    if (notTriggered !== undefined && notTriggered.length > 0) {
      if (activeSkills.size === 0) {
        issues.push(
          error(
            `${at}.expect.not_triggered`,
            `case "${c.id}" asserts other skills must not trigger, but environment.active_skills is empty: declare the skills installed alongside "${suite.target.skill}"`,
          ),
        )
      } else {
        for (const skill of notTriggered) {
          if (!activeSkills.has(skill)) {
            issues.push(
              error(
                `${at}.expect.not_triggered`,
                `case "${c.id}" expects "${skill}" not to trigger, but it is not listed in environment.active_skills`,
              ),
            )
          }
        }
      }
    }

    checkAssertions(c, index, issues)
  })

  // Değişmez #5: negatif vakası olmayan tetiklenme suite'i geçersizdir.
  if (negatives === 0) {
    issues.push(
      error(
        'cases',
        'no negative case: a suite where every case expects triggered: true cannot detect a skill that triggers on everything — add at least one case with expect.triggered: false',
      ),
    )
  } else if (nearNeighbours === 0) {
    issues.push(
      warning(
        'cases',
        `no near-neighbour case: negative cases exist but none is marked "${NEAR_NEIGHBOR_SEGMENT}" in its id — an unrelated negative is easy to pass, the discriminating signal comes from requests that resemble the skill's scope`,
      ),
    )
  }
}

// ---------------------------------------------------------------------------
// Giriş noktaları
// ---------------------------------------------------------------------------

/** Zod hata yolunu `cases[2].expect.triggered` biçimine çevirir. */
function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path.reduce<string>((acc, segment) => {
    if (typeof segment === 'number') return `${acc}[${segment}]`
    return acc === '' ? String(segment) : `${acc}.${String(segment)}`
  }, '')
}

/** Şemadan geçmiş bir nesneyi anlamsal kurallara sokar. */
export function validateSuite(suite: Suite): SuiteIssue[] {
  const issues: SuiteIssue[] = []
  checkCases(suite, issues)
  return issues
}

/**
 * YAML metnini okur, şemadan ve anlamsal kurallardan geçirir.
 *
 * `ok: true` yalnızca hiç `error` seviyesinde sorun yoksa döner; uyarılar
 * `issues` içinde taşınır ve koşumu engellemez.
 */
export function parseSuite(source: string): SuiteParseResult {
  let raw: unknown
  try {
    raw = parseYaml(source)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return { ok: false, issues: [error('', `suite is not valid YAML: ${message}`)] }
  }

  if (raw === null || raw === undefined) {
    return { ok: false, issues: [error('', 'suite is empty')] }
  }

  const parsed = suiteSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) =>
        error(formatPath(issue.path), issue.message),
      ),
    }
  }

  const issues = validateSuite(parsed.data)
  if (issues.some((issue) => issue.level === 'error')) {
    return { ok: false, issues }
  }
  return { ok: true, suite: parsed.data, issues }
}
