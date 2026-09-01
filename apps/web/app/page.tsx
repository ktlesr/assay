import { Badge, EmptyState, IntervalRule, RateFigure, countSentence } from '@assay/ui'
import Link from 'next/link'
import { Shell } from './components/shell'
import { Landing } from './landing'
import { auth } from '../lib/auth'
import { listSuites } from '../lib/runs'

/**
 * Kök.
 *
 * Oturum yoksa tanıtım sayfası, varsa ölçülen skill'lerin listesi. Tek adres:
 * gelen kişi neye baktığını bilir, giren kişi işine döner.
 */
export default async function Home() {
  const session = await auth()
  if (session === null) return <Landing />

  const suites = await listSuites()

  return (
    <Shell>
      {suites.length === 0 ? (
        <EmptyState
          title="Nothing measured here yet"
          description="Assay stores every run on your own machine first. Measure a skill with the CLI, then upload the record to keep its history and compare against it later."
          action={
            <code className="code">assay push --suite ./my-skill.suite.yaml</code>
          }
        />
      ) : (
        <>
          <h1 className="page-title">Measured skills</h1>
          <p className="page-lede">
            One line per skill, showing its most recent run. The bar is the 95%
            confidence interval — a short bar means the number is settled, a long one
            means it is not.
          </p>

          <div className="ruled mt-12">
            {suites.map(({ skill, runs, latest }, index) => (
              <Link
                key={skill}
                href={`/suites/${encodeURIComponent(skill)}`}
                className="row-link suite-row"
              >
                <span className="case-mark">
                  <Badge verdict={latest.run.verdict} showLabel={false} size={16} />
                </span>
                <span className="min-w-0">
                  <span className="suite-name">{skill}</span>
                  <span className="case-count">
                    {countSentence(latest.summary.trigger.recall, 'fired')} it should
                    have
                    {latest.summary.counts.unknown > 0 ? (
                      <span className="ml-3 text-unknown">
                        {latest.summary.counts.unknown} not measured
                      </span>
                    ) : null}
                  </span>
                  <span className="suite-meta">
                    {runs.length} {runs.length === 1 ? 'run' : 'runs'} ·{' '}
                    {latest.run.pins.model} · {latest.run.startedAt.slice(0, 10)}
                  </span>
                </span>
                <span className="case-instrument">
                  <IntervalRule
                    value={latest.summary.trigger.recall}
                    delayMs={Math.min(index * 45, 270)}
                    tone={
                      latest.run.verdict === 'pass'
                        ? 'text-pass'
                        : latest.run.verdict === 'fail'
                          ? 'text-fail'
                          : 'text-unknown'
                    }
                  />
                </span>
                <span className="case-figure">
                  <RateFigure value={latest.summary.trigger.recall} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </Shell>
  )
}
