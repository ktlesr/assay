import { formatProportion } from '@assay/core'
import Link from 'next/link'
import { ThemeToggle } from './components/theme-toggle'
import { VerdictGlyph, VerdictMark } from './components/measurement'
import { listRuns } from '../lib/runs'

/**
 * Koşum listesi.
 *
 * Ekrandaki her sayı `apps/web/seed/runs/` altındaki gerçek koşum
 * kayıtlarından geliyor — Faz 1 dogfooding'inde ölçülen skill'ler.
 */
export default async function Home() {
  const runs = await listRuns()

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-[var(--page)] items-baseline justify-between px-6 py-5">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl leading-none">Assay</span>
            <span className="text-xs uppercase tracking-[0.09em] text-text-faint">
              Agent skill measurements
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-[var(--page)] px-6 py-12">
        {runs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <p className="rule-label mb-6">Runs</p>
            <div className="ruled">
              {runs.map(({ run, summary, slug }) => (
                <Link
                  key={slug}
                  href={`/runs/${slug}`}
                  className="grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-4 py-4 no-underline"
                >
                  <VerdictGlyph verdict={run.verdict} />
                  <span>
                    <span className="font-display text-lg text-text">{run.skill}</span>
                    <span className="ml-3 font-mono text-xs text-text-faint">
                      {run.pins.model} · {run.runs} runs per case
                    </span>
                    <span className="mt-1 block text-sm text-text-muted">
                      trigger recall {formatProportion(summary.trigger.recall)}
                      {summary.counts.unknown > 0 ? (
                        <span className="ml-3 text-unknown">
                          {summary.counts.unknown} not measured
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <VerdictMark verdict={run.verdict} />
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

/**
 * Veri yoksa uydurma veri değil, yönlendirici boş durum.
 */
function EmptyState() {
  return (
    <div className="border border-rule px-8 py-12 text-center">
      <p className="font-display text-xl">No runs yet</p>
      <p className="mx-auto mt-3 max-w-[46ch] text-sm text-text-muted">
        Assay stores every run locally first. Run a case set with the CLI, then upload it
        here to keep the history and compare against it.
      </p>
      <p className="mt-6 font-mono text-xs text-text-faint">
        assay run my-skill.suite.yaml --skill ./my-skill
      </p>
    </div>
  )
}
