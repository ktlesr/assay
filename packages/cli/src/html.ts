/**
 * Tek dosyalık HTML rapor.
 *
 * Paylaşılabilir olması gerekiyor: PR'a eklenir, Slack'e atılır. O yüzden
 * dış kaynak yok — CSS gömülü, script yok, ağ isteği yok.
 *
 * Değişmez #4 burada da geçerli: oranlar `formatProportion` üzerinden basılır.
 * `unknown` kendi rengini ve kendi sayacını taşır.
 */

import { formatProportion, type Run, type RunSummary, type Verdict } from '@ktlsr/assay-core'

const escape = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ??
      char,
  )

const caseVerdict = (failed: number, unknown: number): Verdict =>
  failed > 0 ? 'fail' : unknown > 0 ? 'unknown' : 'pass'

export function renderHtmlReport(run: Run, summary: RunSummary): string {
  const rows = run.cases
    .map((caseResult) => {
      const verdict = caseVerdict(caseResult.failed, caseResult.unknown)
      return `        <tr>
          <td><span class="pill ${verdict}">${verdict}</span></td>
          <td class="mono">${escape(caseResult.caseId)}</td>
          <td class="rate">${escape(formatProportion(caseResult.passRate))}</td>
          <td class="num">${caseResult.passed}</td>
          <td class="num">${caseResult.failed}</td>
          <td class="num ${caseResult.unknown > 0 ? 'warn' : ''}">${caseResult.unknown}</td>
        </tr>`
    })
    .join('\n')

  const unknowns = run.cases
    .flatMap((caseResult) => caseResult.attempts)
    .filter((attempt) => attempt.verdict === 'unknown')
  const unknownList =
    unknowns.length === 0
      ? ''
      : `    <section>
      <h2>Not measured <span class="count warn">${unknowns.length}</span></h2>
      <p class="note">These attempts produced no verdict. They are excluded from every
      rate above and counted here instead — an unmeasured attempt is not a passing one.</p>
      <ul class="reasons">
${[...new Map(unknowns.map((a) => [`${a.caseId}:${a.reason}`, a])).values()]
  .map(
    (attempt) =>
      `        <li><span class="mono">${escape(attempt.caseId)}</span><br><span class="note">${escape(attempt.reason)}</span></li>`,
  )
  .join('\n')}
      </ul>
    </section>`

  // Not, verdict değil: hiçbir negatif kırılmadıysa ölçülen şey yanlış
  // tetiklenme oranıdır, setin ayrım gücünün nerede bittiği değil.
  const discriminationNote = !summary.discrimination.untested
    ? ''
    : `    <section class="callout">
      <h2>No negative case broke</h2>
      <p>${summary.discrimination.cases} negative case(s), ${summary.discrimination.attempts}
      measured attempt(s), 0 false positives. That bounds the false-positive rate, not this
      set's discriminating power: the negatives may differ from the positives on some axis
      other than the one under test, which makes any skill look perfect. Tighten the near
      neighbours before reading this as a clean bill.</p>
      <p class="note">A note, not a verdict — it does not change the run result.</p>
    </section>`

  const f1 =
    summary.trigger.f1 === null ? 'not measurable' : summary.trigger.f1.toFixed(2)
  const cost =
    summary.totals.usd === null ? 'not reported' : `$${summary.totals.usd.toFixed(4)}`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Assay — ${escape(run.id)}</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #fbfbfa; --fg: #1b1b19; --muted: #6b6b66; --line: #e3e2de;
    --pass: #2f7d4f; --fail: #b3261e; --unknown: #8a6a2f; --card: #fff;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #131311; --fg: #ecebe7; --muted: #96958e; --line: #2b2b28;
      --pass: #6fc08d; --fail: #e8776d; --unknown: #d9b56a; --card: #191917;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
  }
  main { max-width: 56rem; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
  h1 { margin: 0 0 .25rem; font-size: 1.6rem; letter-spacing: -.02em; }
  h2 { margin: 2.5rem 0 .75rem; font-size: 1.05rem; }
  .sub { color: var(--muted); margin: 0 0 2rem; font-size: .9rem; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .85rem; }
  .note { color: var(--muted); font-size: .85rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: .55rem .5rem; border-bottom: 1px solid var(--line); }
  th { font-size: .75rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 600; }
  td.num, th.num { text-align: right; width: 4rem; }
  td.rate { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .warn { color: var(--unknown); font-weight: 600; }
  .callout {
    border: 1px solid var(--line); border-left: 3px solid var(--unknown);
    border-radius: 8px; padding: .25rem 1rem 1rem; margin-top: 2rem;
  }
  .callout h2 { margin-bottom: .4rem; }
  .callout p { font-size: .85rem; margin: .4rem 0 0; }
  .pill {
    display: inline-block; padding: .1rem .5rem; border-radius: 999px;
    font-size: .7rem; text-transform: uppercase; letter-spacing: .04em; font-weight: 600;
    border: 1px solid currentColor;
  }
  .pill.pass { color: var(--pass); }
  .pill.fail { color: var(--fail); }
  .pill.unknown { color: var(--unknown); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: .75rem; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: .9rem 1rem; }
  .card .label { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
  .card .value { font-size: .95rem; margin-top: .3rem; font-variant-numeric: tabular-nums; }
  .count { font-size: .8rem; padding: .05rem .45rem; border: 1px solid currentColor; border-radius: 999px; }
  .reasons { list-style: none; padding: 0; margin: 0; }
  .reasons li { padding: .5rem 0; border-bottom: 1px solid var(--line); }
  footer { margin-top: 3rem; color: var(--muted); font-size: .8rem; }
  .pins { display: grid; grid-template-columns: max-content 1fr; gap: .25rem 1rem; }
  .pins dt { color: var(--muted); font-size: .8rem; }
  .pins dd { margin: 0; }
</style>
</head>
<body>
<main>
  <h1>Assay <span class="pill ${run.verdict}">${run.verdict}</span></h1>
  <p class="sub mono">${escape(run.id)}</p>

  <div class="grid">
    <div class="card"><div class="label">Trigger precision</div><div class="value">${escape(formatProportion(summary.trigger.precision))}</div></div>
    <div class="card"><div class="label">Trigger recall</div><div class="value">${escape(formatProportion(summary.trigger.recall))}</div></div>
    <div class="card"><div class="label">F1</div><div class="value">${escape(f1)}</div></div>
    <div class="card"><div class="label">Attempts</div><div class="value">${summary.totals.attempts} · ${summary.counts.unknown > 0 ? `<span class="warn">${summary.counts.unknown} unknown</span>` : 'none unknown'}</div></div>
  </div>

  <h2>Cases</h2>
  <table>
    <thead>
      <tr><th>Verdict</th><th>Case</th><th>Pass rate</th><th class="num">Pass</th><th class="num">Fail</th><th class="num">Unknown</th></tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <p class="note">Every rate carries its observation count and 95% Wilson confidence
  interval. A rate without them would hide how little three runs can tell you.</p>

${discriminationNote}
${unknownList}

  <h2>Pins</h2>
  <p class="note">Two runs are comparable only when all four are identical.</p>
  <dl class="pins">
    <dt>Skill version</dt><dd class="mono">${escape(run.pins.skillSource)}</dd>
    <dt>Skill hash</dt><dd class="mono">${escape(run.pins.skillHash === '' ? 'not computed' : run.pins.skillHash)}</dd>
    <dt>Model</dt><dd class="mono">${escape(run.pins.model)}</dd>
    <dt>System prompt hash</dt><dd class="mono">${escape(run.pins.systemPromptHash)}</dd>
    <dt>Case set version</dt><dd class="mono">${run.pins.suiteVersion}</dd>
    <dt>Case set hash</dt><dd class="mono">${escape(run.pins.suiteHash)}</dd>
  </dl>

  <h2>Cost and latency</h2>
  <div class="grid">
    <div class="card"><div class="label">Tokens in / out</div><div class="value">${summary.totals.inputTokens} / ${summary.totals.outputTokens}</div></div>
    <div class="card"><div class="label">Cost</div><div class="value">${escape(cost)}</div></div>
    <div class="card"><div class="label">Duration</div><div class="value">${(summary.totals.durationMs / 1000).toFixed(1)} s</div></div>
    <div class="card"><div class="label">Tool calls</div><div class="value">${summary.totals.toolCalls}</div></div>
  </div>

  <footer>
    Host ${escape(run.host)} · ${escape(run.startedAt)} → ${escape(run.finishedAt)} ·
    ${run.runs} runs per case
  </footer>
</main>
</body>
</html>
`
}
