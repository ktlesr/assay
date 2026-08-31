/**
 * Karne biçimlendirmesi — saf, yan etkisiz.
 *
 * `run.mjs` ve `comment.mjs` aynı biçimi kullansın diye ayrı dosyada; ayrıca
 * test edilebilir olsun diye. Değişmez #4 burada da geçerli: oran N ve güven
 * aralığı olmadan basılmaz.
 */

/** Vakanın rozeti. Bir fail varsa fail; yoksa unknown varsa uyarı. */
export function icon(caseResult) {
  if (caseResult.failed > 0) return '❌'
  return caseResult.unknown > 0 ? '⚠️' : '✅'
}

export function rate(proportion) {
  if (proportion.rate === null || proportion.ci === null) return 'no observations (N=0)'
  const pct = (value) => `${Math.round(value * 100)}%`
  return `${pct(proportion.rate)} (N=${proportion.n}, 95% CI ${pct(proportion.ci.low)}–${pct(proportion.ci.high)})`
}

export const badge = (verdict) =>
  ({ pass: '✅ pass', fail: '❌ fail', unknown: '⚠️ nothing measured' })[verdict] ??
  verdict

/** PR yorumunu ve iş özetini besleyen tablo. */
export function scorecard(record) {
  return [
    '| | Case | Pass rate | Pass | Fail | Unknown |',
    '|---|---|---|---|---|---|',
    ...record.cases.map(
      (c) =>
        `| ${icon(c)} | \`${c.caseId}\` | ${rate(c.passRate)} | ${c.passed} | ${c.failed} | ${c.unknown} |`,
    ),
  ].join('\n')
}

/** Baseline yoksa veya pinler kaydıysa neden karşılaştırılmadığını söyler. */
export function comparisonSection(comparison, baselineId) {
  if (comparison === null) {
    return '> No baseline run was found on the base branch, so no regression check ran.'
  }
  if (!comparison.comparable) {
    return (
      `> **Not compared.** ${comparison.reason}\n>\n` +
      '> A score that moved because the skill, model or case set changed is not a\n' +
      '> regression. Assay does not guess across a drift.'
    )
  }
  const moved = comparison.cases.filter((c) => c.status !== 'within_noise')
  if (moved.length === 0) {
    return `> Compared against \`${baselineId}\`: no change outside the confidence intervals.`
  }
  return [
    `Compared against \`${baselineId}\`:`,
    '',
    '| Case | Before | After | |',
    '|---|---|---|---|',
    ...moved.map(
      (c) =>
        `| \`${c.caseId}\` | ${c.before === null ? '—' : rate(c.before)} | ${c.after === null ? '—' : rate(c.after)} | ${c.status} |`,
    ),
  ].join('\n')
}

export const MARKER = '<!-- assay-scorecard -->'

/** Yorumun tam gövdesi. */
export function commentBody(record, comparison, baselineId) {
  return [
    MARKER,
    `### Assay — ${badge(record.verdict)}`,
    '',
    `\`${record.id}\` · ${record.host} · \`${record.pins.model}\` · ${record.runs} runs per case`,
    '',
    scorecard(record),
    '',
    comparisonSection(comparison, baselineId),
    '',
    '<sub>Every rate carries its observation count and a 95% Wilson confidence ' +
      'interval. Attempts that could not be measured are counted separately and ' +
      'never folded into a pass.</sub>',
  ].join('\n')
}
