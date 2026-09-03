/**
 * `assay` komut satırı aracı.
 *
 * Platform olmadan tam çalışır: hiçbir komut ağa çıkmaz, hesap istemez.
 * `push` Faz 2'de gelecek ve isteğe bağlı bir eklenti gibi davranacak.
 *
 * Argüman ayrıştırması `node:util.parseArgs` ile — bağımlılık eklemeye değmez.
 */

import { readFile, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { ClaudeCodeAdapter } from '@ktlsr/assay-adapters'
import { compareRuns, parseSuite, summarizeRun, type Run, type Suite } from '@ktlsr/assay-core'
import { RunStore, runSuite, suiteHash } from '@ktlsr/assay-runner'
import { renderHtmlReport } from './html.js'
import {
  renderComparison,
  renderIssues,
  renderRun,
  style,
  verdictLabel,
} from './terminal.js'

/** CI'ın okuduğu çıkış kodları. */
export const EXIT = {
  ok: 0,
  /** Ölçüm yapıldı ve bir vaka düştü. */
  failed: 1,
  /** Kullanım hatası: geçersiz suite, eksik dosya, bilinmeyen komut. */
  usage: 2,
  /** Ölçüm yapılamadı. Başarısızlıktan ayrı tutulur (değişmez #1). */
  unknown: 3,
} as const

const USAGE = `assay — a CI test runner for Agent Skills

Usage
  assay init [file]                 write an example suite file
  assay validate <suite.yaml>       check a suite without running it
  assay run <suite.yaml>            run the suite and store the result
  assay report [run-id]             print a stored run, newest by default
  assay compare <run-a> <run-b>     compare two stored runs, pins checked
  assay ci <suite.yaml>             run and exit non-zero on failure
  assay push [run-id]               upload a stored run to a hosted instance

Options
  --skill <dir>       the skill or plugin directory under test
  --repeat <n>        override the suite's run count (never defaults to 1)
  --html <file>       also write a self-contained HTML report
  --store <dir>       run store root (default: .assay)
  --model <id>        override the suite's model
  --allow-unknown     do not fail CI when attempts could not be measured
  --json              print the run record as JSON instead of a summary
  --suite <file>      the case set the run was measured with (push)
  --url <base>        hosted instance base URL (push, or ASSAY_URL)
  --token <token>     API token (push, or ASSAY_TOKEN — prefer the variable)
  -h, --help          show this text

Exit codes
  0 ok · 1 a case failed · 2 usage error · 3 nothing could be measured
`

type Options = Record<string, unknown>

export async function main(argv: readonly string[]): Promise<number> {
  let parsed
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        skill: { type: 'string' },
        repeat: { type: 'string' },
        html: { type: 'string' },
        store: { type: 'string' },
        model: { type: 'string' },
        'allow-unknown': { type: 'boolean' },
        json: { type: 'boolean' },
        suite: { type: 'string' },
        url: { type: 'string' },
        token: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
    })
  } catch (cause) {
    process.stderr.write(`${style.red('error')} ${message(cause)}\n\n${USAGE}`)
    return EXIT.usage
  }

  const [command, ...positionals] = parsed.positionals
  if (parsed.values.help === true || command === undefined) {
    process.stdout.write(USAGE)
    return command === undefined && parsed.values.help !== true ? EXIT.usage : EXIT.ok
  }

  switch (command) {
    case 'init':
      return init(positionals[0])
    case 'validate':
      return validate(positionals[0])
    case 'run':
      return run(positionals[0], parsed.values, false)
    case 'ci':
      return run(positionals[0], parsed.values, true)
    case 'report':
      return report(positionals[0], parsed.values)
    case 'compare':
      return compare(positionals[0], positionals[1], parsed.values)
    case 'push':
      return push(positionals[0], parsed.values)
    default:
      process.stderr.write(
        `${style.red('error')} unknown command "${command}"\n\n${USAGE}`,
      )
      return EXIT.usage
  }
}

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

const TEMPLATE = `# Assay case set. Run with: assay run this-file.yaml --skill ./path/to/skill
#
# A trigger suite without a negative case is rejected: a skill that fires on
# every request would pass every positive case and look perfect.

version: 1

target:
  skill: your-skill
  # Pin 1 — pin the skill version you measured.
  source: owner/repo@commit-sha

environment:
  host: claude-code
  # Pin 2 — the exact model id, never "latest".
  model: claude-haiku-4-5-20251001
  # Pin 3 — Claude Code does not expose this; the run record keeps an
  # environment hash instead.
  system_prompt_hash: not-provided-by-host
  active_skills: [your-skill]

# Never 1: a single attempt is an observation, not a measurement.
runs: 5

cases:
  - id: trigger.positive.explicit
    prompt: A request that should clearly reach this skill.
    expect: { triggered: true }

  # The discriminating signal: a request that looks similar but is out of scope.
  - id: trigger.negative.near_neighbor.example
    prompt: A request that resembles the one above but is not this skill's job.
    expect: { triggered: false }

  - id: trigger.negative.unrelated
    prompt: A request that has nothing to do with this skill.
    expect: { triggered: false }

  - id: complete.produces_artifact
    prompt: A request that should make the skill produce a file.
    expect:
      triggered: true
      assertions:
        - { type: file_exists, path: 'out/*' }
        - { type: trace, rule: no_swallowed_errors }
        - { type: side_effect, writes_within: ['out/'], network: deny }
`

async function init(target?: string): Promise<number> {
  const path = target ?? 'assay.suite.yaml'
  // Argüman yazılacak DOSYA. Dizin verilirse `writeFile` EISDIR fırlatır;
  // yakalanmazsa yığın izi basar, oysa kullanım hatası tek satır olmalı.
  const existing = await stat(path).catch(() => null)
  if (existing?.isDirectory() === true) {
    process.stderr.write(
      `${style.red('error')} ${path} is a directory; pass the suite file to write, ` +
        `e.g. ${path}/assay.suite.yaml\n`,
    )
    return EXIT.usage
  }
  if (existing !== null) {
    process.stderr.write(`${style.red('error')} ${path} already exists\n`)
    return EXIT.usage
  }
  await writeFile(path, TEMPLATE, 'utf8')
  process.stdout.write(
    `${style.green('created')} ${path}\n` +
      `${style.grey('Fill in the skill name, source and prompts, then:')}\n` +
      `  assay validate ${path}\n`,
  )
  return EXIT.ok
}

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

async function loadSuite(
  path: string | undefined,
): Promise<{ suite: Suite; source: string; path: string } | number> {
  if (path === undefined) {
    process.stderr.write(`${style.red('error')} a suite file is required\n\n${USAGE}`)
    return EXIT.usage
  }
  const source = await readFile(path, 'utf8').catch(() => null)
  if (source === null) {
    process.stderr.write(`${style.red('error')} cannot read ${path}\n`)
    return EXIT.usage
  }
  const parsed = parseSuite(source)
  process.stderr.write(renderIssues(parsed.issues))
  if (!parsed.ok) return EXIT.usage
  return { suite: parsed.suite, source, path }
}

async function validate(path: string | undefined): Promise<number> {
  const loaded = await loadSuite(path)
  if (typeof loaded === 'number') return loaded
  const { suite } = loaded
  process.stdout.write(
    `${style.green('valid')} ${loaded.path}\n` +
      style.grey(
        `  ${suite.cases.length} cases · ${suite.runs} runs each · skill ${suite.target.skill}\n`,
      ),
  )
  return EXIT.ok
}

// ---------------------------------------------------------------------------
// run / ci
// ---------------------------------------------------------------------------

async function run(
  path: string | undefined,
  options: Options,
  ci: boolean,
): Promise<number> {
  const loaded = await loadSuite(path)
  if (typeof loaded === 'number') return loaded
  const { suite, source } = loaded

  const skillPath = typeof options['skill'] === 'string' ? options['skill'] : undefined
  if (skillPath === undefined) {
    process.stderr.write(
      `${style.red('error')} --skill <dir> is required: Assay loads that directory into an isolated session\n`,
    )
    return EXIT.usage
  }

  const repeat = parseRepeat(options['repeat'])
  if (repeat === 'invalid') {
    process.stderr.write(`${style.red('error')} --repeat must be a positive integer\n`)
    return EXIT.usage
  }
  if (repeat === 1) {
    process.stderr.write(
      `${style.yellow('warning')} --repeat 1 measures nothing about stability; the result carries no flakiness signal\n`,
    )
  }

  const model = typeof options['model'] === 'string' ? options['model'] : undefined
  const effective: Suite =
    model === undefined
      ? suite
      : { ...suite, environment: { ...suite.environment, model } }

  const adapter = new ClaudeCodeAdapter()
  const record = await runSuite(effective, adapter, {
    source,
    suitePath: loaded.path,
    skillPath: resolve(skillPath),
    ...(repeat === undefined ? {} : { repeat }),
    onProgress: (event) => {
      if (options['json'] === true) return
      const mark = {
        pass: style.green('✓'),
        fail: style.red('✗'),
        unknown: style.yellow('?'),
      }[event.verdict]
      process.stderr.write(
        `  ${mark} ${event.caseId} ${style.grey(`${event.attempt + 1}/${event.attempts}`)}\n`,
      )
      if (event.verdict !== 'pass') {
        process.stderr.write(`      ${style.grey(event.reason.slice(0, 200))}\n`)
      }
    },
  })

  const store = new RunStore(storeOptions(options))
  const savedTo = await store.save(record)
  await emit(record, options)
  process.stderr.write(style.grey(`  stored ${savedTo}\n`))

  if (!ci) return EXIT.ok
  if (record.verdict === 'fail') return EXIT.failed
  if (record.verdict === 'unknown') {
    return options['allow-unknown'] === true ? EXIT.ok : EXIT.unknown
  }
  return EXIT.ok
}

function parseRepeat(value: unknown): number | undefined | 'invalid' {
  if (typeof value !== 'string') return undefined
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return 'invalid'
  return parsed
}

// ---------------------------------------------------------------------------
// report / compare
// ---------------------------------------------------------------------------

async function report(runId: string | undefined, options: Options): Promise<number> {
  const store = new RunStore(storeOptions(options))
  const record =
    runId === undefined ? await store.latest() : await store.load(runId).catch(() => null)
  if (record === null) {
    process.stderr.write(
      `${style.red('error')} ${runId === undefined ? `no runs found in ${store.directory}` : `no run ${runId}`}\n`,
    )
    return EXIT.usage
  }
  await emit(record, options)
  return EXIT.ok
}

async function compare(
  a: string | undefined,
  b: string | undefined,
  options: Options,
): Promise<number> {
  if (a === undefined || b === undefined) {
    process.stderr.write(`${style.red('error')} compare needs two run ids\n\n${USAGE}`)
    return EXIT.usage
  }
  const store = new RunStore(storeOptions(options))
  const before = await store.load(a).catch(() => null)
  const after = await store.load(b).catch(() => null)
  if (before === null || after === null) {
    process.stderr.write(`${style.red('error')} cannot load ${before === null ? a : b}\n`)
    return EXIT.usage
  }

  const comparison = compareRuns(before, after)
  if (options['json'] === true) {
    process.stdout.write(`${JSON.stringify(comparison, null, 2)}\n`)
  } else {
    process.stdout.write(renderComparison(comparison))
  }
  return comparison.verdict === 'fail'
    ? EXIT.failed
    : comparison.verdict === 'unknown'
      ? EXIT.unknown
      : EXIT.ok
}

// ---------------------------------------------------------------------------
// Ortak
// ---------------------------------------------------------------------------

function storeOptions(options: Options): { root?: string } {
  const root = options['store']
  return typeof root === 'string' ? { root } : {}
}

async function emit(record: Run, options: Options): Promise<void> {
  // Beklentiler kaydın içinde; rapor suite dosyasına ihtiyaç duymuyor.
  const summary = summarizeRun(record)

  if (options['json'] === true) {
    process.stdout.write(`${JSON.stringify({ run: record, summary }, null, 2)}\n`)
  } else {
    process.stdout.write(renderRun(record, summary))
  }

  const html = options['html']
  if (typeof html === 'string') {
    await writeFile(html, renderHtmlReport(record, summary), 'utf8')
    process.stderr.write(
      style.grey(`  report ${resolve(dirname(html), basename(html))}\n`),
    )
  }
}

const message = (cause: unknown) =>
  cause instanceof Error ? cause.message : String(cause)

export { verdictLabel }

// ---------------------------------------------------------------------------
// push
// ---------------------------------------------------------------------------

/**
 * Kayıtlı bir koşumu hosted örneğe yükler.
 *
 * Ölçüm burada yapılmaz ve tekrarlanmaz: yerel kayıt olduğu gibi gönderilir.
 * Vaka seti kaynağı da gider, çünkü hosted taraf vakaların metnini kayıttan
 * türetemez.
 *
 * Token argümanla verilebilir ama `ASSAY_TOKEN` tercih edilir: argüman kabuk
 * geçmişine ve süreç listesine düşer.
 */
async function push(runId: string | undefined, options: Options): Promise<number> {
  const base = (options['url'] as string | undefined) ?? process.env['ASSAY_URL']
  const token = (options['token'] as string | undefined) ?? process.env['ASSAY_TOKEN']
  const suitePath = options['suite'] as string | undefined

  if (base === undefined || base === '') {
    process.stderr.write(
      `${style.red('error')} push needs --url or ASSAY_URL, the base URL of a hosted instance
`,
    )
    return EXIT.usage
  }
  if (token === undefined || token === '') {
    process.stderr.write(
      `${style.red('error')} push needs ASSAY_TOKEN (or --token), created under Settings → API tokens
`,
    )
    return EXIT.usage
  }
  if (suitePath === undefined) {
    process.stderr.write(
      `${style.red('error')} push needs --suite: the hosted side stores the case set alongside the run
`,
    )
    return EXIT.usage
  }

  const store = new RunStore(storeOptions(options))
  const record =
    runId === undefined ? await store.latest() : await store.load(runId).catch(() => null)
  if (record === null) {
    process.stderr.write(
      `${style.red('error')} ${runId === undefined ? `no runs found in ${store.directory}` : `no run ${runId}`}
`,
    )
    return EXIT.usage
  }

  let suiteSource: string
  try {
    suiteSource = await readFile(resolve(suitePath), 'utf8')
  } catch {
    process.stderr.write(`${style.red('error')} cannot read ${suitePath}
`)
    return EXIT.usage
  }

  // Pin 4'ün denetçisi: gönderilen vaka seti, ölçümde kullanılandan farklıysa
  // yükleme yapılmaz. Aksi hâlde hosted tarafta koşumla eşleşmeyen bir vaka
  // seti dururdu ve sonraki karşılaştırmalar sessizce yanlış olurdu.
  const localHash = suiteHash(suiteSource)
  if (localHash !== record.pins.suiteHash) {
    process.stderr.write(
      `${style.red('error')} ${suitePath} is not the case set this run was measured with
` +
        `  run:  ${record.pins.suiteHash}
  file: ${localHash}
`,
    )
    return EXIT.usage
  }

  let response: Response
  try {
    response = await fetch(new URL('/api/runs', base), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ suiteSource, run: record }),
    })
  } catch (cause) {
    process.stderr.write(`${style.red('error')} cannot reach ${base}: ${message(cause)}
`)
    return EXIT.usage
  }

  const body = (await response.json().catch(() => ({}))) as {
    error?: string
    runId?: string
  }

  if (response.status === 201) {
    process.stdout.write(
      `${style.green('uploaded')} ${record.id}
  ${new URL(`/runs/${record.id}`, base).href}
`,
    )
    return EXIT.ok
  }
  if (response.status === 409) {
    process.stdout.write(`${style.yellow('already stored')} ${record.id}
`)
    return EXIT.ok
  }
  process.stderr.write(
    `${style.red('error')} ${response.status} ${body.error ?? 'the upload was rejected'}
`,
  )
  return EXIT.usage
}
