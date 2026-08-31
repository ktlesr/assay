/**
 * Uçtan uca koşum — 1.2'nin sınavı.
 *
 * Gerçek suite, gerçek skill, gerçek host. Sonuç yerel store'a yazılır.
 * Gerçek para harcar.
 *
 * Kullanım: node tools/e2e-run.mjs [suite.yaml]
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ClaudeCodeAdapter } from '../packages/adapters/dist/index.js'
import { parseSuite, formatProportion, summarize } from '../packages/core/dist/index.js'
import { RunStore, runSuite } from '../packages/runner/dist/index.js'

const suitePath = process.argv[2] ?? 'examples/widget-manifest.suite.yaml'
const source = readFileSync(suitePath, 'utf8')
const parsed = parseSuite(source)
if (!parsed.ok) {
  for (const issue of parsed.issues)
    console.error(`${issue.level} ${issue.path}: ${issue.message}`)
  process.exit(1)
}
for (const issue of parsed.issues) console.warn(`warning ${issue.path}: ${issue.message}`)

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .map((l) => /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
)

const adapter = new ClaudeCodeAdapter({
  credentials: { oauthToken: env['CLAUDE_CODE_OAUTH_TOKEN'] },
})

console.log(`suite: ${suitePath}`)
console.log(
  `skill: ${parsed.suite.target.skill} · model: ${parsed.suite.environment.model}`,
)
console.log(`cases: ${parsed.suite.cases.length} × ${parsed.suite.runs} runs\n`)

const run = await runSuite(parsed.suite, adapter, {
  source,
  suitePath,
  skillPath: resolve('examples/widget-manifest'),
  onProgress: (event) => {
    const mark = { pass: '✓', fail: '✗', unknown: '?' }[event.verdict]
    console.log(`  ${mark} ${event.caseId} #${event.attempt + 1}/${event.attempts}`)
    if (event.verdict !== 'pass') console.log(`      ${event.reason.slice(0, 160)}`)
  },
})

const store = new RunStore()
const path = await store.save(run)

const expected = new Map(parsed.suite.cases.map((c) => [c.id, c.expect.triggered]))
const summary = summarize(
  run.cases.flatMap((c) => c.attempts),
  (id) => expected.get(id),
)

console.log(`\n${'─'.repeat(70)}`)
console.log(`run ${run.id} → ${run.verdict.toUpperCase()}`)
console.log(`saved: ${path}\n`)
for (const caseResult of run.cases) {
  console.log(
    `  ${caseResult.caseId.padEnd(45)} ${formatProportion(caseResult.passRate)}` +
      (caseResult.unknown > 0 ? `  unknown=${caseResult.unknown}` : ''),
  )
}
console.log(`\ntrigger precision ${formatProportion(summary.trigger.precision)}`)
console.log(`trigger recall    ${formatProportion(summary.trigger.recall)}`)
console.log(
  `f1                ${summary.trigger.f1 === null ? 'n/a' : summary.trigger.f1.toFixed(2)}`,
)
console.log(`unknown triggers  ${summary.trigger.unknown}`)
console.log(
  `\ntotals: ${summary.totals.attempts} attempts · ${summary.totals.toolCalls} tool calls · ` +
    `${summary.totals.inputTokens}/${summary.totals.outputTokens} tokens · ` +
    `${summary.totals.usd === null ? 'cost n/a' : `$${summary.totals.usd.toFixed(4)}`} · ` +
    `${(summary.totals.durationMs / 1000).toFixed(1)}s`,
)
