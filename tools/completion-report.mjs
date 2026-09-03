/**
 * docs/measurements.md'nin TAMAMLAMA bölümündeki tabloları gerçek koşum
 * kayıtlarından üretir. Kardeşi tools/measurement-report.mjs tetiklenme
 * setleri için aynı işi yapıyor; ikisi ayrı, çünkü sordukları soru ayrı:
 * orada "doğru istekte devreye girdi mi", burada "devreye girdikten sonra iş
 * bitti mi".
 *
 * Rapordaki hiçbir sayı elle yazılmıyor.
 *
 * Kullanım: node tools/completion-report.mjs <root> <skill...>
 *   kayıtlar <root>/.runs-<skill>-completion/runs altında aranır.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const [root, ...skills] = process.argv.slice(2)
if (!root || skills.length === 0) {
  process.stderr.write('usage: completion-report.mjs <root> <skill...>\n')
  process.exit(2)
}

/** Artefakt katmanı: iz ve yan etki dışındaki her assertion. */
const ARTIFACT = new Set([
  'file_exists',
  'file_valid',
  'json_schema',
  'file_content_matches',
  'exit_code',
])

const pct = (x) => `${Math.round(x * 100)}%`

// Wilson skor aralığı — core'daki yöntemin aynısı (docs/decisions.md).
function wilson(successes, n) {
  if (n === 0) return { rate: null, ci: null }
  const z = 1.959963984540054
  const p = successes / n
  const d = 1 + (z * z) / n
  const c = p + (z * z) / (2 * n)
  const s = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return { rate: p, ci: { low: Math.max(0, (c - s) / d), high: Math.min(1, (c + s) / d) } }
}

const rateOf = (successes, n) => {
  const w = wilson(successes, n)
  return w.rate === null
    ? 'ölçülmedi (N=0)'
    : `${pct(w.rate)} (N=${n}, %95 GA ${pct(w.ci.low)}–${pct(w.ci.high)})`
}

function load(skill) {
  const dir = join(root, `.runs-${skill}-completion`, 'runs')
  if (!existsSync(dir)) return null
  const newest = readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .sort()
    .at(-1)
  return newest ? JSON.parse(readFileSync(join(dir, newest), 'utf8')).run : null
}

const of = (attempt, type) =>
  (attempt.assertions ?? []).filter((x) => x.assertion.type === type)
const artifacts = (attempt) =>
  (attempt.assertions ?? []).filter((x) => ARTIFACT.has(x.assertion.type))

/** Artefakt katmanı sonucu: hepsi pass → pass, biri fail → fail, kalanı unknown. */
function artifactVerdict(attempt) {
  const xs = artifacts(attempt)
  if (xs.length === 0) return null
  if (xs.some((x) => x.verdict === 'fail')) return 'fail'
  if (xs.some((x) => x.verdict === 'unknown')) return 'unknown'
  return 'pass'
}

const all = []
for (const skill of skills) {
  const run = load(skill)
  if (!run) {
    process.stderr.write(`no run for ${skill}\n`)
    continue
  }
  all.push({ skill, run })
}

const out = []

// --- 1. Koşum özeti ---------------------------------------------------------
out.push(
  '| Vaka seti | Verdict | Attempt | Tetiklenme (tamamlama vakaları) | Artefakt tam | Unknown | Maliyet | Süre |',
)
out.push('|---|---|---|---|---|---|---|---|')
for (const { skill, run } of all) {
  const positives = run.cases.filter((c) => c.expectedTrigger).flatMap((c) => c.attempts)
  const every = run.cases.flatMap((c) => c.attempts)
  const fired = positives.filter((a) => a.trigger?.triggered === true).length
  const done = positives.filter((a) => artifactVerdict(a) === 'pass').length
  const usd = every.reduce((s, a) => s + (a.cost?.usd ?? 0), 0)
  const ms = every.reduce((s, a) => s + (a.latencyMs ?? 0), 0)
  const unknown = every.filter((a) => a.verdict === 'unknown').length
  out.push(
    `| \`${skill}-completion\` | ${run.verdict} | ${every.length} | ${rateOf(fired, positives.length)} | ${rateOf(done, positives.length)} | ${unknown} | $${usd.toFixed(2)} | ${(ms / 60000).toFixed(1)} dk |`,
  )
}
out.push('')

// --- 2. Vaka başına ---------------------------------------------------------
for (const { skill, run } of all) {
  out.push(`### \`${skill}-completion\``, '')
  out.push('| Vaka | Tetiklenme oranı | Artefakt tamamlama oranı | Vaka geçiş oranı |')
  out.push('|---|---|---|---|')
  for (const c of run.cases) {
    const n = c.attempts.length
    const fired = c.attempts.filter((a) => a.trigger?.triggered === true).length
    const done = c.attempts.filter((a) => artifactVerdict(a) === 'pass').length
    const hasArtifacts = c.attempts.some((a) => artifacts(a).length > 0)
    out.push(
      `| \`${c.caseId}\` | ${rateOf(fired, n)} | ${hasArtifacts ? rateOf(done, n) : '—'} | ${rateOf(c.passed, n)} |`,
    )
  }
  out.push('')
}

// --- 3. İz ve yan etki katmanları -------------------------------------------
out.push(
  '| Vaka seti | `no_swallowed_errors` pass/fail/unknown | `side_effect` pass/fail/unknown |',
)
out.push('|---|---|---|')
const violations = []
const swallowed = []
for (const { skill, run } of all) {
  const every = run.cases.flatMap((c) => c.attempts)
  const count = (type, verdict) =>
    every.reduce((s, a) => s + of(a, type).filter((x) => x.verdict === verdict).length, 0)
  for (const c of run.cases) {
    for (const a of c.attempts) {
      for (const x of of(a, 'side_effect')) {
        if (x.verdict === 'fail') violations.push([skill, c.caseId, a.index, x.reason])
      }
      for (const x of of(a, 'trace')) {
        if (x.assertion.rule === 'no_swallowed_errors' && x.verdict !== 'pass') {
          swallowed.push([skill, c.caseId, a.index, x.verdict, x.reason])
        }
      }
    }
  }
  out.push(
    `| \`${skill}-completion\` | ${count('trace', 'pass')}/${count('trace', 'fail')}/${count('trace', 'unknown')} | ${count('side_effect', 'pass')}/${count('side_effect', 'fail')}/${count('side_effect', 'unknown')} |`,
  )
}
out.push('')
out.push(
  `**\`no_swallowed_errors\` pass dışı sonuç:** ${swallowed.length === 0 ? 'yok.' : ''}`,
)
for (const [s, c, i, v, r] of swallowed) out.push(`- \`${s}\` \`${c}\` #${i} → **${v}** — ${r}`)
out.push('')
out.push(`**Yan etki ihlali:** ${violations.length === 0 ? 'yok.' : ''}`)
for (const [s, c, i, r] of violations) out.push(`- \`${s}\` \`${c}\` #${i} — ${r}`)
out.push('')

// --- 4. Tetiklendi ama bitirmedi --------------------------------------------
out.push('| Vaka seti | Vaka | # | Artefakt | Düşen assertion |')
out.push('|---|---|---|---|---|')
let interesting = 0
for (const { skill, run } of all) {
  for (const c of run.cases) {
    for (const a of c.attempts) {
      const verdict = artifactVerdict(a)
      if (a.trigger?.triggered !== true || verdict === 'pass' || verdict === null) continue
      interesting += 1
      const bad = artifacts(a)
        .filter((x) => x.verdict !== 'pass')
        .map(
          (x) => `\`${x.assertion.type}\` ${x.verdict}: ${(x.reason ?? '').slice(0, 140)}`,
        )
        .join('<br>')
      out.push(`| \`${skill}\` | \`${c.caseId}\` | ${a.index} | ${verdict} | ${bad} |`)
    }
  }
}
if (interesting === 0) {
  out.push('| — | — | — | — | tetiklenip artefaktı tamamlamayan attempt yok |')
}
out.push('')

const tot = all.reduce(
  (s, { run }) => {
    const every = run.cases.flatMap((c) => c.attempts)
    s.attempts += every.length
    s.usd += every.reduce((x, a) => x + (a.cost?.usd ?? 0), 0)
    s.ms += every.reduce((x, a) => x + (a.latencyMs ?? 0), 0)
    s.tools += every.reduce((x, a) => x + (a.trace?.length ?? 0), 0)
    return s
  },
  { attempts: 0, usd: 0, ms: 0, tools: 0 },
)
out.push(
  `**Toplam:** ${tot.attempts} attempt · ${tot.tools} iz olayı · **$${tot.usd.toFixed(2)}** · ${(tot.ms / 60000).toFixed(0)} dakika ajan süresi.`,
)
process.stdout.write(`${out.join('\n')}\n`)
