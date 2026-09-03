/**
 * /methodology sayfasının verisini gerçek koşum kayıtlarından üretir.
 *
 * Sayfada elle yazılmış tek bir sayı yok (sözleşme 3). Bu betik kayıtları
 * okur, oranları Wilson aralığıyla hesaplar ve sayfanın import ettiği JSON'u
 * yazar. Üretilen dosya commit'lenir: `apps/web` runner'a bağlanamaz
 * (docs/stack.md) ve derleme sırasında dosya sistemine gitmez.
 *
 * Kullanım:
 *   node tools/methodology-data.mjs <tetiklenme-kökü> <tamamlama-kökü> <çıktı>
 *
 * Kökler `.runs-<ad>/runs/*.json` düzenini bekler — `assay run --store` ne
 * yazıyorsa o.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [triggerRoot, completionRoot, outFile] = process.argv.slice(2)
if (!triggerRoot || !completionRoot || !outFile) {
  process.stderr.write(
    'usage: methodology-data.mjs <trigger-root> <completion-root> <out.json>\n',
  )
  process.exit(2)
}

/** Kabuk araçları — yan etkileri gözlenemeyen ve onay isteyenler. */
const SHELL = new Set(['Bash', 'PowerShell', 'Shell', 'Terminal', 'Execute'])

/** Artefakt katmanı: iz ve yan etki dışındaki her assertion. */
const ARTIFACT = new Set([
  'file_exists',
  'file_valid',
  'json_schema',
  'file_content_matches',
  'exit_code',
])

// Wilson skor aralığı — core'daki yöntemin aynısı (docs/decisions.md).
function measurement(successes, n) {
  if (n === 0) return { successes, n, rate: null, ci: null }
  const z = 1.959963984540054
  const p = successes / n
  const d = 1 + (z * z) / n
  const c = p + (z * z) / (2 * n)
  const s = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return {
    successes,
    n,
    rate: p,
    ci: { low: Math.max(0, (c - s) / d), high: Math.min(1, (c + s) / d), level: 0.95 },
  }
}

function load(root, name) {
  const dir = join(root, `.runs-${name}`, 'runs')
  const newest = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .at(-1)
  if (newest === undefined) throw new Error(`no run record in ${dir}`)
  return { slug: newest.replace(/\.json$/, ''), run: JSON.parse(readFileSync(join(dir, newest), 'utf8')).run }
}

const artifacts = (attempt) =>
  (attempt.assertions ?? []).filter((x) => ARTIFACT.has(x.assertion.type))

function artifactVerdict(attempt) {
  const xs = artifacts(attempt)
  if (xs.length === 0) return null
  if (xs.some((x) => x.verdict === 'fail')) return 'fail'
  if (xs.some((x) => x.verdict === 'unknown')) return 'unknown'
  return 'pass'
}

/** Tetiklenme doğruluğu — measurement-report.mjs ile aynı sayım. */
function accuracy(run) {
  let tp = 0
  let fp = 0
  let fn = 0
  for (const c of run.cases) {
    for (const a of c.attempts) {
      if (a.trigger?.available !== true) continue
      if (c.expectedTrigger) {
        if (a.trigger.triggered) tp += 1
        else fn += 1
      } else if (a.trigger.triggered) {
        fp += 1
      }
    }
  }
  return { precision: measurement(tp, tp + fp), recall: measurement(tp, tp + fn) }
}

// --- 1. Aynı skill, iki vaka seti -------------------------------------------

const baseline = load(triggerRoot, 'doc-coauthoring')
const borderline = load(triggerRoot, 'doc-coauthoring-borderline')

const pinRows = Object.keys(baseline.run.pins).map((key) => ({
  pin: key,
  value: String(baseline.run.pins[key]),
  same: baseline.run.pins[key] === borderline.run.pins[key],
}))

const caseSet = {
  pins: pinRows,
  runs: [baseline, borderline].map(({ slug, run }, i) => ({
    label: i === 0 ? 'First case set' : 'Second case set',
    suite: i === 0 ? 'doc-coauthoring' : 'doc-coauthoring-borderline',
    slug,
    date: run.startedAt.slice(0, 10),
    verdict: run.verdict,
    cases: run.cases.length,
    repeats: run.runs,
    ...accuracy(run),
  })),
}

// --- 2. Tek katman yanıltır: tetiklenme vs tamamlama -------------------------

const completion = load(completionRoot, 'doc-coauthoring-completion')

const crosstab = { firedDone: 0, firedMissing: 0, quietDone: 0, quietMissing: 0 }
for (const c of completion.run.cases) {
  if (!c.expectedTrigger) continue
  for (const a of c.attempts) {
    const verdict = artifactVerdict(a)
    if (verdict === null) continue
    const fired = a.trigger?.triggered === true
    const done = verdict === 'pass'
    if (fired && done) crosstab.firedDone += 1
    else if (fired) crosstab.firedMissing += 1
    else if (done) crosstab.quietDone += 1
    else crosstab.quietMissing += 1
  }
}

const layerCase = (caseId) => {
  const c = completion.run.cases.find((x) => x.caseId === caseId)
  if (c === undefined) throw new Error(`case ${caseId} missing from the completion run`)
  const n = c.attempts.length
  const fired = c.attempts.filter((a) => a.trigger?.triggered === true).length
  const hasArtifacts = c.attempts.some((a) => artifacts(a).length > 0)
  const done = c.attempts.filter((a) => artifactVerdict(a) === 'pass').length
  return {
    caseId,
    trigger: measurement(fired, n),
    artifact: hasArtifacts ? measurement(done, n) : null,
  }
}

// Ham iz: dosya yazılmayan denemenin tamamı. Kırpılmıyor, yalnızca uzun
// metinler sayfada okunabilir olsun diye kısaltılıyor.
const traceSource = completion.run.cases
  .find((c) => c.caseId === 'complete.proposal_with_objections')
  .attempts.find((a) => a.trigger?.triggered === true && artifactVerdict(a) === 'fail')

const clip = (text, max) =>
  typeof text === 'string' && text.length > max ? `${text.slice(0, max)}…` : text

const layers = {
  slug: completion.slug,
  date: completion.run.startedAt.slice(0, 10),
  repeats: completion.run.runs,
  crosstab,
  cases: [
    layerCase('complete.proposal_with_objections'),
    layerCase('complete.design_doc_with_outline'),
    layerCase('control.design_doc_no_artifact'),
    layerCase('complete.decision_record'),
  ],
  trace: {
    caseId: 'complete.proposal_with_objections',
    attempt: traceSource.index,
    writes: traceSource.env?.writes ?? [],
    steps: (traceSource.trace ?? []).map((e) => ({
      seq: e.seq,
      kind: e.kind,
      ...(e.tool === undefined ? {} : { tool: e.tool }),
      ...(e.skill === undefined ? {} : { skill: e.skill }),
      ...(e.args === undefined ? {} : { args: e.args }),
      ...(e.text === undefined ? {} : { text: clip(e.text, 420) }),
    })),
  },
}

// --- 3. Aracın kendi sınırı -------------------------------------------------

const webapp = load(completionRoot, 'webapp-testing-completion')
const regression = webapp.run.cases.find(
  (c) => c.caseId === 'complete.regression_suite_green',
)

const runTxtPresent = regression.attempts.filter((a) =>
  (a.assertions ?? []).some(
    (x) =>
      x.assertion.type === 'file_exists' &&
      x.assertion.path === 'out/run.txt' &&
      x.verdict === 'pass',
  ),
).length

const deniedShell = regression.attempts.filter((a) =>
  (a.trace ?? []).some(
    (e) => e.kind === 'tool_result' && e.isError === true && SHELL.has(e.tool),
  ),
).length

const swallowed = regression.attempts.filter((a) =>
  (a.assertions ?? []).some(
    (x) =>
      x.assertion.type === 'trace' &&
      x.assertion.rule === 'no_swallowed_errors' &&
      x.verdict === 'fail',
  ),
).length

const limit = {
  slug: webapp.slug,
  caseId: regression.caseId,
  attempts: regression.attempts.length,
  runTxtPresent,
  deniedShell,
  swallowed,
}

writeFileSync(
  outFile,
  `${JSON.stringify(
    {
      note: 'Generated by tools/methodology-data.mjs from real run records. Do not edit by hand.',
      caseSet,
      layers,
      limit,
    },
    null,
    2,
  )}\n`,
  'utf8',
)
process.stdout.write(`wrote ${outFile}\n`)
