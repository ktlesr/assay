import { formatProportion } from '@assay/core'
import { Badge, EmptyState, MetricValue } from '@assay/ui'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '../../components/shell'
import { getSuite } from '../../../lib/runs'

/**
 * Suite detayı — bir skill'in bütün geçmişi.
 *
 * Üç bölüm: son koşumun vakaları, koşum geçmişi ve pinlerin kayıp kaymadığı.
 * Trend bir grafik değil, koşum başına çizilmiş aralıklar: iki aralık
 * kesişiyorsa gözle görülüyor ve "düzeldi" demek için kesişmemesi gerekiyor.
 */
export default async function SuitePage({
  params,
}: {
  params: Promise<{ skill: string }>
}) {
  const { skill } = await params
  const suite = await getSuite(skill)
  if (suite === null) notFound()

  const { latest, runs } = suite

  return (
    <Shell breadcrumbs={[{ label: suite.skill }]}>
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-none">{suite.skill}</h1>
          <p className="mt-2 text-sm text-text-muted">
            {runs.length} run{runs.length === 1 ? '' : 's'} · latest on{' '}
            {latest.run.startedAt.slice(0, 10)}
          </p>
        </div>
        <Badge verdict={latest.run.verdict} />
      </div>

      <section className="mb-12">
        <p className="rule-label mb-4">Latest run</p>
        <MetricValue label="Trigger precision" value={latest.summary.trigger.precision} />
        <MetricValue label="Trigger recall" value={latest.summary.trigger.recall} />
        <MetricValue label="Attempt pass rate" value={latest.summary.passRate} />
        <p className="mt-4">
          <Link
            href={`/runs/${latest.slug}`}
            className="text-sm text-accent-quiet underline underline-offset-4"
          >
            Open the scorecard
          </Link>
        </p>
      </section>

      <section className="mb-12">
        <p className="rule-label mb-4">Cases in the latest run</p>
        <div className="ruled">
          {latest.run.cases.map((caseResult) => (
            <div
              key={caseResult.caseId}
              className="grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-4 py-3"
            >
              <Badge
                verdict={
                  caseResult.failed > 0
                    ? 'fail'
                    : caseResult.unknown > 0
                      ? 'unknown'
                      : 'pass'
                }
                showLabel={false}
              />
              <div className="min-w-0">
                <p className="font-mono text-xs">{caseResult.caseId}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {formatProportion(caseResult.passRate)}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs text-text-faint">
                {caseResult.expectedTrigger === undefined
                  ? 'no trigger claim'
                  : caseResult.expectedTrigger
                    ? 'expects trigger'
                    : 'expects no trigger'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="rule-label mb-4">History</p>
        {runs.length === 1 ? (
          <EmptyState
            title="Only one run"
            description="A trend needs a second measurement. Run the suite again and the comparison — including whether any pin drifted — appears here."
            action={
              <code className="font-mono text-xs text-text-faint">
                assay run {suite.skill}.suite.yaml
              </code>
            }
          />
        ) : (
          <div className="ruled">
            {runs.map((item, index) => {
              const older = runs[index + 1]
              return (
                <div key={item.slug} className="py-4">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
                    <Link
                      href={`/runs/${item.slug}`}
                      className="font-mono text-xs no-underline hover:text-accent-quiet"
                    >
                      {item.run.startedAt.slice(0, 19).replace('T', ' ')}
                    </Link>
                    <span className="flex items-baseline gap-4">
                      <Badge verdict={item.run.verdict} />
                      {older === undefined ? null : (
                        <Link
                          href={`/compare?a=${older.slug}&b=${item.slug}`}
                          className="text-xs text-accent-quiet underline underline-offset-4"
                        >
                          vs previous
                        </Link>
                      )}
                    </span>
                  </div>
                  <MetricValue label="Pass rate" value={item.summary.passRate} />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </Shell>
  )
}
