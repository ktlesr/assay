import type { Attempt } from '@assay/core'
import { Badge, Callout, TraceViewer } from '@assay/ui'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '../../../../../components/shell'
import { getRun } from '../../../../../../lib/runs'

/**
 * Attempt detayı — tek bir tekrarın tamamı.
 *
 * Ölçümün en alt katmanı: ne gözlendi, ne iddia edildi, ne yapıldı, neye
 * dokunuldu. Yutulan hata uyarısı izin altında duruyor çünkü ancak iz
 * okunduktan sonra anlam kazanıyor.
 */
export default async function AttemptPage({
  params,
}: {
  params: Promise<{ slug: string; caseId: string; index: string }>
}) {
  const { slug, caseId, index } = await params
  const item = await getRun(slug)
  if (item === null) notFound()

  const decodedCase = decodeURIComponent(caseId)
  const caseResult = item.run.cases.find((c) => c.caseId === decodedCase)
  const attempt = caseResult?.attempts.find((a) => a.index === Number(index))
  if (caseResult === undefined || attempt === undefined) notFound()

  const isSwallowed = (a: (typeof attempt.assertions)[number]) =>
    a.assertion.type === 'trace' && a.assertion.rule === 'no_swallowed_errors'
  const swallowed = attempt.assertions.find(isSwallowed)
  const others = attempt.assertions.filter((a) => !isSwallowed(a))

  return (
    <Shell
      breadcrumbs={[
        { label: item.run.skill, href: `/suites/${encodeURIComponent(item.run.skill)}` },
        { label: 'run', href: `/runs/${slug}` },
        { label: `attempt ${attempt.index + 1}` },
      ]}
    >
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-mono text-xl">{decodedCase}</h1>
          <p className="mt-2 text-sm text-text-muted">
            Attempt {attempt.index + 1} of {caseResult.attempts.length} ·{' '}
            {attempt.latencyMs === undefined
              ? 'latency not reported'
              : `${(attempt.latencyMs / 1000).toFixed(1)} s`}
          </p>
        </div>
        <Badge verdict={attempt.verdict} />
      </div>

      <section className="mb-12">
        <p className="rule-label mb-4">Outcome</p>
        <p className="max-w-[70ch] text-sm text-text-muted">{attempt.reason}</p>
      </section>

      <section className="mb-12">
        <p className="rule-label mb-4">Trigger</p>
        {attempt.trigger.available ? (
          <>
            <p className="text-sm">
              {attempt.trigger.triggered ? 'The skill fired.' : 'The skill did not fire.'}{' '}
              <span className="text-text-faint">via {attempt.trigger.via}</span>
            </p>
            <p className="mt-2 font-mono text-xs text-text-muted">
              {attempt.trigger.skills.length === 0
                ? 'no skills observed'
                : attempt.trigger.skills.join(', ')}
            </p>
            {attempt.trigger.complete ? null : (
              <p className="mt-3 text-sm text-unknown">
                The host reported only the target skill, so &ldquo;nothing else
                fired&rdquo; cannot be claimed from this observation.
              </p>
            )}
          </>
        ) : (
          <Callout tone="warning" title="Trigger signal unavailable">
            {attempt.trigger.reason}
          </Callout>
        )}
      </section>

      {others.length === 0 ? null : (
        <section className="mb-12">
          <p className="rule-label mb-4">Assertions</p>
          <ul className="ruled">
            {others.map((result, i) => (
              <li
                key={`${result.assertion.type}-${i}`}
                className="grid grid-cols-[1.5rem_1fr] gap-4 py-3"
              >
                <Badge verdict={result.verdict} showLabel={false} />
                <div className="min-w-0">
                  <p className="font-mono text-xs">{label(result.assertion)}</p>
                  <p className="mt-1 max-w-[70ch] text-sm text-text-muted">
                    {result.reason}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-12">
        <p className="rule-label mb-4">Trace</p>
        <TraceViewer
          steps={(attempt.trace ?? []).map((event) => ({
            seq: event.seq,
            kind: event.kind,
            tool: event.tool,
            skill: event.skill,
            text: event.text,
            error: event.error,
            isError: event.isError,
            outcome: event.outcome,
            args: event.args as Record<string, unknown> | undefined,
          }))}
          {...(swallowed === undefined
            ? {}
            : { swallowed: { verdict: swallowed.verdict, reason: swallowed.reason } })}
        />
      </section>

      <section className="mb-12">
        <p className="rule-label mb-4">Environment</p>
        <EnvSection attempt={attempt} />
      </section>

      <p>
        <Link
          href={`/runs/${slug}`}
          className="text-sm text-accent-quiet underline underline-offset-4"
        >
          Back to the scorecard
        </Link>
      </p>
    </Shell>
  )
}

function label(assertion: Attempt['assertions'][number]['assertion']): string {
  return assertion.type === 'trace' ? `trace.${assertion.rule}` : assertion.type
}

function EnvSection({ attempt }: { attempt: Attempt }) {
  const env = attempt.env
  if (env === undefined) {
    return (
      <Callout tone="warning" title="No environment diff was captured">
        Side-effect claims cannot be evaluated for this attempt.
      </Callout>
    )
  }
  const unobserved = env.unobserved ?? []
  return (
    <div className="space-y-6">
      {unobserved.length === 0 ? null : (
        <Callout tone="warning" title="Part of the environment was not observable">
          These calls can reach the file system or the network through a path Assay does
          not read, so the lists below may be incomplete:{' '}
          <span className="font-mono text-xs">{unobserved.join(', ')}</span>
        </Callout>
      )}
      <EnvList label="Writes" items={env.writes} />
      <EnvList label="Deletes" items={env.deletes} />
      <EnvList
        label="Network"
        items={env.network.map(
          (request) =>
            `${request.method ?? 'GET'} ${request.host}${request.blocked ? ' — blocked' : ''}`,
        )}
      />
    </div>
  )
}

function EnvList({ label, items }: { label: string; items: readonly string[] }) {
  return (
    <div>
      <p className="col-label mb-2">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-text-faint">none observed</p>
      ) : (
        <ul className="ruled font-mono text-xs">
          {items.map((entry) => (
            <li key={entry} className="py-1.5 break-all">
              {entry}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
