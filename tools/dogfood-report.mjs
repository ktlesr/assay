/**
 * Dogfooding raporunun tablolarını kayıtlardan üretir.
 *
 * Rapordaki hiçbir sayı elle yazılmıyor: hepsi `.assay/dogfood-out/<skill>/runs`
 * altındaki gerçek koşum kayıtlarından okunuyor (veri gerçekliği sözleşmesi).
 *
 * Kullanım: node tools/dogfood-report.mjs > /tmp/dogfood-tables.md
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { formatProportion, summarizeRun } from '../packages/core/dist/index.js'

const skills = process.argv.slice(2)
const targets = skills.length > 0 ? skills : ['docx', 'pdf', 'xlsx']

const runs = []
for (const skill of targets) {
  const dir = join('.assay/dogfood-out', skill, 'runs')
  if (!existsSync(dir)) {
    process.stderr.write(`no runs for ${skill}\n`)
    continue
  }
  const newest = readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .at(-1)
  if (newest === undefined) continue
  const { run } = JSON.parse(readFileSync(join(dir, newest), 'utf8'))
  runs.push({ skill, run, summary: summarizeRun(run) })
}

if (runs.length === 0) {
  process.stderr.write('no runs found\n')
  process.exit(1)
}

// --- Özet tablo -------------------------------------------------------------

line("## Ölçülen skill'ler")
line('')
line('| Skill | Verdict | Precision | Recall | F1 | Unknown | Maliyet | Süre |')
line('|---|---|---|---|---|---|---|---|')
for (const { skill, run, summary } of runs) {
  line(
    `| \`${skill}\` | ${run.verdict} | ${formatProportion(summary.trigger.precision)} | ` +
      `${formatProportion(summary.trigger.recall)} | ` +
      `${summary.trigger.f1 === null ? 'n/a' : summary.trigger.f1.toFixed(2)} | ` +
      `${summary.counts.unknown} | ` +
      `${summary.totals.usd === null ? 'n/a' : `$${summary.totals.usd.toFixed(2)}`} | ` +
      `${(summary.totals.durationMs / 1000 / 60).toFixed(1)} dk |`,
  )
}

// --- Vaka tabloları ---------------------------------------------------------

for (const { skill, run } of runs) {
  line('')
  line(`### \`${skill}\``)
  line('')
  line('| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |')
  line('|---|---|---|---|---|---|')
  for (const c of run.cases) {
    const expected =
      c.expectedTrigger === undefined
        ? '—'
        : c.expectedTrigger
          ? 'tetiklenmeli'
          : 'tetiklenmemeli'
    line(
      `| \`${c.caseId}\` | ${expected} | ${formatProportion(c.passRate)} | ` +
        `${c.passed} | ${c.failed} | ${c.unknown} |`,
    )
  }

  const failing = run.cases.flatMap((c) =>
    c.attempts.filter((a) => a.verdict !== 'pass').map((a) => ({ caseId: c.caseId, a })),
  )
  if (failing.length > 0) {
    line('')
    line('Geçmeyen attempt gerekçeleri (tekilleştirilmiş):')
    line('')
    const seen = new Set()
    for (const { caseId, a } of failing) {
      const key = `${caseId}:${a.reason}`
      if (seen.has(key)) continue
      seen.add(key)
      line(`- \`${caseId}\` — ${a.verdict}: ${a.reason.slice(0, 300)}`)
    }
  }
}

// --- Toplamlar --------------------------------------------------------------

const grand = runs.reduce(
  (acc, { summary }) => ({
    attempts: acc.attempts + summary.totals.attempts,
    usd: acc.usd + (summary.totals.usd ?? 0),
    ms: acc.ms + summary.totals.durationMs,
    toolCalls: acc.toolCalls + summary.totals.toolCalls,
    unknown: acc.unknown + summary.counts.unknown,
    fail: acc.fail + summary.counts.fail,
  }),
  { attempts: 0, usd: 0, ms: 0, toolCalls: 0, unknown: 0, fail: 0 },
)

line('')
line('## Toplam')
line('')
line(
  `${grand.attempts} attempt · ${grand.toolCalls} araç çağrısı · ` +
    `$${grand.usd.toFixed(2)} · ${(grand.ms / 1000 / 60).toFixed(0)} dakika ajan süresi · ` +
    `${grand.fail} fail · ${grand.unknown} unknown`,
)

function line(text) {
  process.stdout.write(`${text}\n`)
}
