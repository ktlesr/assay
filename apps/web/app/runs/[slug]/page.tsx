import { formatProportion, type Attempt, type CaseResult } from '@assay/core'
import { Badge, Callout, MetricValue } from '@assay/ui'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pins } from '../../components/run-meta'
import { Shell } from '../../components/shell'
import { getRun, getSuite } from '../../../lib/runs'

/**
 * Koşum detayı — skill karnesi. Ana ekran.
 *
 * Sertifikanın kendisi: kimlik, ölçüm, belirsizlik, ölçülemeyenler ve maliyet.
 * Hiçbir oran çıplak değil; `unknown` gizlenmiyor, kendi bölümü var.
 */
export default async function RunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const item = await getRun(slug)
  if (item === null) notFound()

  const { run, summary } = item
  const suite = await getSuite(run.skill)
  const previous = suite?.runs.find((r) => r.run.startedAt < run.startedAt)

  const flaky = run.cases.filter(
    (c) => c.passed > 0 && c.failed > 0,
  )
  const unknownAttempts = run.cases
    .flatMap((c) => c.attempts.map((a) => ({ caseId: c.caseId, attempt: a })))
    .filter(({ attempt }) => attempt.verdict === 'unknown')

  return (
    <Shell
      breadcrumbs={[
        { label: run.skill, href: `/suites/${encodeURIComponent(run.skill)}` },
        { label: 'run' },
      ]}
    >
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-none">{run.skill}</h1>
          <p className="mt-2 font-mono text-xs text-text-faint">{run.id}</p>
        </div>
        <div className="text-right">
          <Badge verdict={run.verdict} />
          <p className="mt-1 text-xs text-text-faint">
            {run.host} · {run.runs} runs per case
          </p>
        </div>
      </div>

      <section className="mb-12">
        <p className="rule-label mb-4">Trigger accuracy</p>
        <MetricValue label="Precision" value={summary.trigger.precision} />
        <MetricValue label="Recall" value={summary.trigger.recall} />
        <div className="grid grid-cols-[9rem_1fr_auto] items-center gap-4 py-2">
          <span className="col-label">F1</span>
          <span />
          <span className="font-mono text-sm text-text-muted">
            {summary.trigger.f1 === null ? 'not measurable' : summary.trigger.f1.toFixed(2)}
          </span>
        </div>
        <p className="mt-3 max-w-[64ch] text-xs text-text-faint">
          Precision asks whether the skill was right when it fired. Recall asks whether it
          fired when it should have. Both carry their observation count and interval —
          twenty observations and two hundred say very different things.
        </p>
        {summary.trigger.unknown > 0 ? (
          <p className="mt-3 text-sm text-unknown">
            {summary.trigger.unknown} observation(s) could not be read and are excluded
            from both rates.
          </p>
        ) : null}
      </section>

      <section className="mb-12">
        <p className="rule-label mb-4">Cases</p>
        <div className="ruled">
          {run.cases.map((caseResult) => (
            <CaseRow key={caseResult.caseId} slug={slug} caseResult={caseResult} />
          ))}
        </div>
      </section>

      {flaky.length > 0 ? (
        <section className="mb-12">
          <p className="rule-label mb-4">Instability</p>
          <Callout tone="warning" title={`${flaky.length} case(s) produced both outcomes`}>
            The same prompt, the same model, different results. A single run of any of
            these would have been a coin flip.
            <ul className="mt-2 space-y-1">
              {flaky.map((c) => (
                <li key={c.caseId} className="font-mono text-xs">
                  {c.caseId} — {c.passed} pass / {c.failed} fail
                </li>
              ))}
            </ul>
          </Callout>
        </section>
      ) : null}

      {unknownAttempts.length > 0 ? (
        <section className="mb-12">
          <p className="rule-label mb-4">Not measured</p>
          <Callout
            tone="warning"
            title={`${unknownAttempts.length} attempt(s) produced no verdict`}
          >
            These are excluded from every rate above and counted here instead. An
            unmeasured attempt is not a passing one.
          </Callout>
          <ul className="ruled mt-4">
            {[
              ...new Map(
                unknownAttempts.map((item) => [
                  `${item.caseId}:${item.attempt.reason}`,
                  item,
                ]),
              ).values(),
            ].map(({ caseId, attempt }) => (
              <li key={`${caseId}-${attempt.index}`} className="py-3">
                <p className="font-mono text-xs">{caseId}</p>
                <p className="mt-1 text-sm text-text-muted">{attempt.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-12">
        <p className="rule-label mb-4">Pins</p>
        <p className="mb-4 max-w-[64ch] text-xs text-text-faint">
          Two runs are comparable only when all of these are identical. A score that moved
          because the model changed is not a regression.
        </p>
        <Pins run={run} />
        {previous === undefined ? null : (
          <p className="mt-6">
            <Link
              href={`/compare?a=${previous.slug}&b=${slug}`}
              className="text-sm text-accent-quiet underline underline-offset-4"
            >
              Compare with the previous run
            </Link>
          </p>
        )}
      </section>

      <section>
        <p className="rule-label mb-4">Cost and latency</p>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
          <Stat label="Attempts" value={String(summary.totals.attempts)} />
          <Stat
            label="Tokens in / out"
            value={`${summary.totals.inputTokens} / ${summary.totals.outputTokens}`}
          />
          <Stat
            label="Cost"
            value={
              summary.totals.usd === null
                ? 'not reported'
                : `$${summary.totals.usd.toFixed(4)}`
            }
          />
          <Stat
            label="Duration"
            value={`${(summary.totals.durationMs / 1000).toFixed(1)} s`}
          />
        </dl>
      </section>
    </Shell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="col-label">{label}</dt>
      <dd className="mt-1 font-mono text-sm">{value}</dd>
    </div>
  )
}

function CaseRow({ slug, caseResult }: { slug: string; caseResult: CaseResult }) {
  const verdict =
    caseResult.failed > 0 ? 'fail' : caseResult.unknown > 0 ? 'unknown' : 'pass'
  const firstInteresting: Attempt | undefined =
    caseResult.attempts.find((a) => a.verdict !== 'pass') ?? caseResult.attempts[0]

  return (
    <div className="grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-4 py-3">
      <Badge verdict={verdict} showLabel={false} />
      <div className="min-w-0">
        <Link
          href={
            firstInteresting === undefined
              ? '#'
              : `/runs/${slug}/attempts/${encodeURIComponent(caseResult.caseId)}/${firstInteresting.index}`
          }
          className="font-mono text-xs no-underline hover:text-accent-quiet"
        >
          {caseResult.caseId}
        </Link>
        <p className="mt-1 text-sm text-text-muted">
          {formatProportion(caseResult.passRate)}
          {caseResult.unknown > 0 ? (
            <span className="ml-3 text-unknown">{caseResult.unknown} not measured</span>
          ) : null}
        </p>
      </div>
      <span className="font-mono text-xs text-text-faint">
        {caseResult.passed}/{caseResult.failed}/{caseResult.unknown}
      </span>
    </div>
  )
}
