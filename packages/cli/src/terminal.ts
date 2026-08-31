/**
 * Terminal çıktısı.
 *
 * İki kural burada zorlanıyor:
 *  - Hiçbir oran N ve güven aralığı olmadan basılmaz (değişmez #4). Tek yol
 *    `formatProportion`; başka bir yerde `%` yazdırılmıyor.
 *  - `unknown` ayrı ve dikkat çekici. Hata kovasına düşmüyor, kendi sütunu var.
 */

import {
  formatProportion,
  type CaseComparison,
  type Proportion,
  type Run,
  type RunComparison,
  type RunSummary,
  type SuiteIssue,
  type Verdict,
} from '@assay/core'

// ---------------------------------------------------------------------------
// Renk
// ---------------------------------------------------------------------------

const enabled =
  process.env['NO_COLOR'] === undefined &&
  process.env['TERM'] !== 'dumb' &&
  process.stdout.isTTY === true

const wrap = (code: string) => (text: string) => (enabled ? `[${code}m${text}[0m` : text)

export const style = {
  bold: wrap('1'),
  dim: wrap('2'),
  red: wrap('31'),
  green: wrap('32'),
  yellow: wrap('33'),
  blue: wrap('34'),
  grey: wrap('90'),
}

const VERDICT_STYLE: Record<Verdict, (text: string) => string> = {
  pass: style.green,
  fail: style.red,
  unknown: style.yellow,
}

const MARK: Record<Verdict, string> = { pass: '✓', fail: '✗', unknown: '?' }

export const verdictLabel = (verdict: Verdict): string =>
  VERDICT_STYLE[verdict](verdict.toUpperCase())

export const verdictMark = (verdict: Verdict): string =>
  VERDICT_STYLE[verdict](MARK[verdict])

/** Oranı N ve aralığıyla basar. Çıplak yüzde basmanın başka yolu yok. */
export const rate = (value: Proportion): string => formatProportion(value)

// ---------------------------------------------------------------------------
// Bloklar
// ---------------------------------------------------------------------------

const pad = (text: string, width: number) => text.padEnd(width)

export function renderIssues(issues: readonly SuiteIssue[]): string {
  if (issues.length === 0) return ''
  const lines = issues.map((issue) => {
    const tag = issue.level === 'error' ? style.red('error') : style.yellow('warning')
    const where = issue.path === '' ? '' : style.grey(` ${issue.path}`)
    return `  ${tag}${where}\n    ${issue.message}`
  })
  return `${lines.join('\n')}\n`
}

export function renderRun(run: Run, summary: RunSummary): string {
  const width = Math.max(...run.cases.map((c) => c.caseId.length), 20)
  const out: string[] = []

  out.push('')
  out.push(`${style.bold('run')} ${run.id}  ${verdictLabel(run.verdict)}`)
  out.push(
    style.grey(
      `${run.host} · ${run.pins.model} · suite v${run.pins.suiteVersion} · ${run.runs} runs per case`,
    ),
  )
  out.push('')

  for (const caseResult of run.cases) {
    const caseVerdict: Verdict =
      caseResult.failed > 0 ? 'fail' : caseResult.unknown > 0 ? 'unknown' : 'pass'
    const unknownNote =
      caseResult.unknown > 0 ? style.yellow(`  ${caseResult.unknown} unknown`) : ''
    out.push(
      `  ${verdictMark(caseVerdict)} ${pad(caseResult.caseId, width)}  ${rate(caseResult.passRate)}${unknownNote}`,
    )
  }

  out.push('')
  out.push(style.bold('  trigger accuracy'))
  out.push(`    precision  ${rate(summary.trigger.precision)}`)
  out.push(`    recall     ${rate(summary.trigger.recall)}`)
  out.push(
    `    f1         ${summary.trigger.f1 === null ? style.grey('not measurable') : summary.trigger.f1.toFixed(2)}`,
  )
  if (summary.trigger.unknown > 0) {
    out.push(`    ${style.yellow(`unreadable  ${summary.trigger.unknown}`)}`)
  }

  out.push('')
  out.push(
    style.bold('  verdicts  ') +
      `${style.green(`${summary.counts.pass} pass`)}  ` +
      `${style.red(`${summary.counts.fail} fail`)}  ` +
      `${style.yellow(`${summary.counts.unknown} unknown`)}`,
  )
  out.push(
    style.grey(
      `  totals    ${summary.totals.attempts} attempts · ${summary.totals.toolCalls} tool calls · ` +
        `${summary.totals.inputTokens}/${summary.totals.outputTokens} tokens · ` +
        `${summary.totals.usd === null ? 'cost not reported' : `$${summary.totals.usd.toFixed(4)}`} · ` +
        `${(summary.totals.durationMs / 1000).toFixed(1)}s`,
    ),
  )

  if (summary.counts.unknown > 0) {
    out.push('')
    out.push(
      style.yellow(`  ${summary.counts.unknown} attempt(s) could not be measured:`),
    )
    const seen = new Set<string>()
    for (const caseResult of run.cases) {
      for (const attempt of caseResult.attempts) {
        if (attempt.verdict !== 'unknown') continue
        const key = `${attempt.caseId}:${attempt.reason}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push(`    ${attempt.caseId}  ${style.grey(attempt.reason)}`)
      }
    }
  }

  out.push('')
  return out.join('\n')
}

const STATUS_STYLE = {
  regressed: style.red,
  improved: style.green,
  within_noise: style.grey,
  unknown: style.yellow,
} as const

export function renderComparison(comparison: RunComparison): string {
  const out: string[] = ['']

  if (!comparison.comparable) {
    out.push(style.yellow(style.bold('  cannot compare these runs')))
    out.push(`  ${comparison.reason}`)
    out.push(
      style.grey(
        '  Two runs are only comparable when the skill version, model, system prompt\n' +
          '  hash and case set are identical. Assay does not guess across a drift.',
      ),
    )
    out.push('')
    return out.join('\n')
  }

  const width = Math.max(...comparison.cases.map((c) => c.caseId.length), 20)
  out.push(`${style.bold('comparison')}  ${verdictLabel(comparison.verdict)}`)
  out.push('')
  for (const change of comparison.cases) out.push(renderChange(change, width))
  out.push('')
  out.push(`  ${comparison.reason}`)
  out.push('')
  return out.join('\n')
}

function renderChange(change: CaseComparison, width: number): string {
  const paint = STATUS_STYLE[change.status]
  const before = change.before === null ? style.grey('—') : rate(change.before)
  const after = change.after === null ? style.grey('—') : rate(change.after)
  return (
    `  ${paint(pad(change.status, 13))} ${pad(change.caseId, width)}\n` +
    `    before ${before}\n` +
    `    after  ${after}\n` +
    `    ${style.grey(change.reason)}`
  )
}
