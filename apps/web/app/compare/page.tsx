import { formatProportion, type CaseComparison } from '@assay/core'
import { Badge, Callout, EmptyState, IntervalRule } from '@assay/ui'
import Link from 'next/link'
import { Pins } from '../components/run-meta'
import { Shell } from '../components/shell'
import { compare } from '../../lib/runs'

/**
 * Regresyon karşılaştırması.
 *
 * Kararı `@assay/core` veriyor: pinlerden biri kaymışsa hiçbir vaka
 * karşılaştırılmaz. Bu ekran o kararı yeniden yorumlamaz — reddi olduğu gibi
 * gösterir ve hangi pinin kaydığını söyler.
 */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>
}) {
  const { a, b } = await searchParams
  if (a === undefined || b === undefined) {
    return (
      <Shell breadcrumbs={[{ label: 'compare' }]}>
        <EmptyState
          title="Pick two runs"
          description="A comparison needs a baseline and a candidate. Open a suite and choose “vs previous” on any run in its history."
          action={
            <Link
              href="/"
              className="text-sm text-accent-quiet underline underline-offset-4"
            >
              Browse suites
            </Link>
          }
        />
      </Shell>
    )
  }

  const result = await compare(a, b)
  if (result === null) {
    return (
      <Shell breadcrumbs={[{ label: 'compare' }]}>
        <EmptyState
          title="One of those runs is missing"
          description="A comparison against a run that is no longer stored reports a missing baseline rather than quietly passing."
          action={
            <Link
              href="/"
              className="text-sm text-accent-quiet underline underline-offset-4"
            >
              Browse suites
            </Link>
          }
        />
      </Shell>
    )
  }

  const { before, after, comparison } = result

  return (
    <Shell
      breadcrumbs={[
        {
          label: after.run.skill,
          href: `/suites/${encodeURIComponent(after.run.skill)}`,
        },
        { label: 'compare' },
      ]}
    >
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-none">{after.run.skill}</h1>
          <p className="mt-2 font-mono text-xs text-text-faint">
            {before.run.startedAt.slice(0, 19).replace('T', ' ')} →{' '}
            {after.run.startedAt.slice(0, 19).replace('T', ' ')}
          </p>
        </div>
        <Badge verdict={comparison.verdict} />
      </div>

      <section className="mb-12">
        <Callout
          tone={
            comparison.comparable
              ? comparison.verdict === 'fail'
                ? 'danger'
                : 'info'
              : 'warning'
          }
          title={comparison.comparable ? 'Comparison produced' : 'Comparison refused'}
        >
          {comparison.reason}
        </Callout>
      </section>

      {comparison.comparable ? (
        <section className="mb-12">
          <p className="rule-label mb-4">Cases</p>
          <p className="mb-4 max-w-[68ch] text-xs text-text-faint">
            A move is only called a regression when the two intervals do not overlap.
            Overlapping intervals mean the difference cannot be told apart from run-to-run
            noise, however large the gap between the two percentages looks.
          </p>
          <div className="ruled">
            {comparison.cases.map((row) => (
              <CaseDelta key={row.caseId} row={row} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-12">
          <p className="rule-label mb-4">Drifted pins</p>
          <ul className="ruled">
            {comparison.drifted.map((pin) => (
              <li key={pin} className="py-3 font-mono text-sm text-unknown">
                {pin}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-[68ch] text-sm text-text-muted">
            Any difference between these two runs could come from the pin that moved. A
            score that dropped because the model changed is not a regression in the skill,
            and reporting it as one would send you to fix the wrong thing.
          </p>
        </section>
      )}

      <section className="grid gap-10 sm:grid-cols-2">
        <div>
          <p className="rule-label mb-4">Baseline pins</p>
          <Pins run={before.run} />
        </div>
        <div>
          <p className="rule-label mb-4">Candidate pins</p>
          <Pins run={after.run} />
        </div>
      </section>
    </Shell>
  )
}

const STATUS: Record<CaseComparison['status'], { label: string; tone: string }> = {
  regressed: { label: 'regressed', tone: 'text-fail' },
  improved: { label: 'improved', tone: 'text-pass' },
  within_noise: { label: 'within noise', tone: 'text-text-muted' },
  unknown: { label: 'not comparable', tone: 'text-unknown' },
}

function CaseDelta({ row }: { row: CaseComparison }) {
  const status = STATUS[row.status]
  return (
    <div className="py-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <span className="font-mono text-xs">{row.caseId}</span>
        <span className={`mark ${status.tone}`}>{status.label}</span>
      </div>
      <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-4 py-1">
        <span className="col-label">Before</span>
        {row.before === null ? (
          <span className="text-xs text-text-faint">not measured</span>
        ) : (
          <IntervalRule value={row.before} />
        )}
        <span className="whitespace-nowrap font-mono text-xs text-text-muted">
          {row.before === null ? '—' : formatProportion(row.before)}
        </span>
      </div>
      <div className="grid grid-cols-[5rem_1fr_auto] items-center gap-4 py-1">
        <span className="col-label">After</span>
        {row.after === null ? (
          <span className="text-xs text-text-faint">not measured</span>
        ) : (
          <IntervalRule value={row.after} tone={status.tone} />
        )}
        <span className="whitespace-nowrap font-mono text-xs text-text-muted">
          {row.after === null ? '—' : formatProportion(row.after)}
        </span>
      </div>
      <p className="mt-2 max-w-[68ch] text-sm text-text-muted">{row.reason}</p>
    </div>
  )
}
