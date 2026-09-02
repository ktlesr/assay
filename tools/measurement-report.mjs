/**
 * docs/measurements.md tablolarını gerçek koşum kayıtlarından üretir.
 *
 * Rapordaki hiçbir sayı elle yazılmıyor. Kayıtlar `--store` ile yazıldığı
 * yerden okunur; oranlar kaydın kendi `passRate` alanından gelir (N ve güven
 * aralığı zaten orada, değişmez #4).
 *
 * Kullanım: node tools/measurement-report.mjs <root> <skill...>
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const [root, ...skills] = process.argv.slice(2)
if (!root || skills.length === 0) {
  process.stderr.write('usage: measurement-report.mjs <root> <skill...>\n')
  process.exit(2)
}

const pct = (x) => `${Math.round(x * 100)}%`

// Wilson skor aralığı — core'daki ile aynı yöntem (docs/decisions.md).
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
  return w.rate === null ? 'not measured (N=0)' : `${pct(w.rate)} (N=${n}, 95% CI ${pct(w.ci.low)}–${pct(w.ci.high)})`
}
const prop = (p) =>
  p.rate === null
    ? `not measured (N=0)`
    : `${pct(p.rate)} (N=${p.n}, 95% CI ${pct(p.ci.low)}–${pct(p.ci.high)})`

function load(skill) {
  const dir = join(root, `.runs-${skill}`, 'runs')
  if (!existsSync(dir)) return null
  const newest = readdirSync(dir).filter((n) => n.endsWith('.json')).sort().at(-1)
  if (!newest) return null
  return JSON.parse(readFileSync(join(dir, newest), 'utf8')).run
}

// Tetiklenme doğruluğu: pozitif vakalarda tetiklendi mi, negatiflerde tetiklenmedi mi.
function accuracy(run) {
  let tp = 0, fp = 0, fn = 0, tn = 0, unknown = 0
  for (const c of run.cases) {
    for (const a of c.attempts) {
      if (!a.trigger?.available) { unknown++; continue }
      const fired = a.trigger.triggered
      if (c.expectedTrigger) {
        if (fired) tp++
        else fn++
      } else if (fired) {
        fp++
      } else {
        tn++
      }
    }
  }
  return { tp, fp, fn, tn, unknown }
}

const out = []
const all = []
for (const skill of skills) {
  const run = load(skill)
  if (!run) { process.stderr.write(`no run for ${skill}\n`); continue }
  all.push({ skill, run, acc: accuracy(run) })
}

out.push('| Vaka seti | Verdict | Precision | Recall | Unknown | Maliyet | Süre |')
out.push('|---|---|---|---|---|---|---|')
for (const { skill, run, acc } of all) {
  const usd = run.cases.flatMap((c) => c.attempts).reduce((s, a) => s + (a.cost?.usd ?? 0), 0)
  const ms = run.cases.flatMap((c) => c.attempts).reduce((s, a) => s + (a.latencyMs ?? 0), 0)
  out.push(
    `| \`${skill}\` | ${run.verdict} | ${rateOf(acc.tp, acc.tp + acc.fp)} | ${rateOf(acc.tp, acc.tp + acc.fn)} | ${acc.unknown} | $${usd.toFixed(2)} | ${(ms / 60000).toFixed(1)} dk |`,
  )
}
out.push('')

for (const { skill, run } of all) {
  out.push(`### \`${skill}\``, '')
  out.push('| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |')
  out.push('|---|---|---|---|---|---|')
  for (const c of run.cases) {
    out.push(
      `| \`${c.caseId}\` | ${c.expectedTrigger ? 'tetiklenmeli' : 'tetiklenmemeli'} | ${prop(c.passRate)} | ${c.passed} | ${c.failed} | ${c.unknown} |`,
    )
  }
  out.push('')
}

const tot = all.reduce(
  (s, { run }) => {
    const at = run.cases.flatMap((c) => c.attempts)
    s.attempts += at.length
    s.usd += at.reduce((x, a) => x + (a.cost?.usd ?? 0), 0)
    s.ms += at.reduce((x, a) => x + (a.latencyMs ?? 0), 0)
    s.tools += at.reduce((x, a) => x + (a.trace?.length ?? 0), 0)
    return s
  },
  { attempts: 0, usd: 0, ms: 0, tools: 0 },
)
out.push(
  `**Toplam:** ${tot.attempts} attempt · ${tot.tools} iz olayı · **$${tot.usd.toFixed(2)}** · ${(tot.ms / 60000).toFixed(0)} dakika ajan süresi.`,
)
process.stdout.write(out.join('\n') + '\n')
