import type { Run } from '@ktlsr/assay-core'
import { formatProportion } from '@ktlsr/assay-core'

/** Terminalde bir satır. `kind` yalnızca rengi ve işareti seçiyor. */
export interface Line {
  kind: 'command' | 'blank' | 'pass' | 'fail' | 'unknown' | 'plain' | 'dim'
  text: string
  /** Sağa hizalanan ikinci sütun: oran. Dar ekranda alta iniyor. */
  rate?: string
}

/** Koşum kaydını terminal satırlarına çevirir. */
export function linesFor(run: Run): Line[] {
  const lines: Line[] = [
    { kind: 'command', text: `npx @ktlsr/assay run ./${run.skill}.suite.yaml` },
    { kind: 'blank', text: '' },
  ]

  for (const c of run.cases) {
    const kind = c.failed > 0 ? 'fail' : c.passRate.n === 0 ? 'unknown' : 'pass'
    lines.push({ kind, text: c.caseId, rate: formatProportion(c.passRate) })
  }

  const passed = run.cases.reduce((n, c) => n + c.passed, 0)
  const failed = run.cases.reduce((n, c) => n + c.failed, 0)
  const attempts = run.cases.reduce((n, c) => n + c.attempts.length, 0)
  const unknown = attempts - passed - failed

  lines.push({ kind: 'blank', text: '' })
  lines.push({
    kind: 'plain',
    text: `verdicts  ${passed} pass · ${failed} fail · ${unknown} unknown`,
  })
  lines.push({
    kind: 'dim',
    text: `${attempts} attempts · ${run.pins.model} · ${run.startedAt.slice(0, 10)}`,
  })

  return lines
}
