import { formatProportion } from '@assay/core'
import { Badge, EmptyState } from '@assay/ui'
import Link from 'next/link'
import { Shell } from './components/shell'
import { listSuites } from '../lib/runs'

/**
 * Suite listesi — bir skill, bir satır.
 *
 * Her satır o skill'in **en son** koşumunu gösterir; geçmiş suite detayında.
 * Gösterilen her ölçüm gerçek bir koşumdan geliyor.
 */
export default async function Home() {
  const suites = await listSuites()

  return (
    <Shell>
      {suites.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="Assay stores every run locally first. Run a case set with the CLI, then upload it here to keep the history and compare against it."
          action={
            <code className="font-mono text-xs text-text-faint">
              assay run my-skill.suite.yaml --skill ./my-skill
            </code>
          }
        />
      ) : (
        <>
          <p className="rule-label mb-6">Suites</p>
          <div className="ruled">
            {suites.map(({ skill, runs, latest }) => (
              <Link
                key={skill}
                href={`/suites/${encodeURIComponent(skill)}`}
                className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4 no-underline"
              >
                <span>
                  <span className="font-display text-lg text-text">{skill}</span>
                  <span className="ml-3 font-mono text-xs text-text-faint">
                    {runs.length} {runs.length === 1 ? 'run' : 'runs'} · {latest.run.pins.model}
                  </span>
                  <span className="mt-1 block text-sm text-text-muted">
                    trigger recall {formatProportion(latest.summary.trigger.recall)}
                    {latest.summary.counts.unknown > 0 ? (
                      <span className="ml-3 text-unknown">
                        {latest.summary.counts.unknown} not measured
                      </span>
                    ) : null}
                  </span>
                </span>
                <Badge verdict={latest.run.verdict} />
              </Link>
            ))}
          </div>
        </>
      )}
    </Shell>
  )
}
