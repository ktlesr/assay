import { formatProportion } from '@assay/core'
import { Badge, EmptyState } from '@assay/ui'
import Link from 'next/link'
import { Shell } from './components/shell'
import { Landing } from './landing'
import { auth } from '../lib/auth'
import { listSuites } from '../lib/runs'

/**
 * Kök.
 *
 * Oturum yoksa tanıtım sayfası, varsa suite listesi. Tek adres: gelen kişi
 * neye baktığını bilir, giren kişi işine döner.
 */
export default async function Home() {
  const session = await auth()
  if (session === null) return <Landing />

  const suites = await listSuites()

  return (
    <Shell>
      {suites.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="Assay stores every run locally first. Run a case set with the CLI, then upload it here to keep the history and compare against it."
          action={
            <code className="font-mono text-xs text-text-faint">
              assay push --suite ./my-skill.suite.yaml
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
                    {runs.length} {runs.length === 1 ? 'run' : 'runs'} ·{' '}
                    {latest.run.pins.model}
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
