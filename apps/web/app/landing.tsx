import { formatProportion, type CaseResult } from '@assay/core'
import { Badge, Callout, IntervalRule } from '@assay/ui'
import Link from 'next/link'
import { Shell } from './components/shell'
import { compare, listSuites, type RunWithSummary } from '../lib/runs'

/**
 * Tanıtım sayfası.
 *
 * Tek kural: buradaki her sayı bu örneğin veritabanındaki gerçek bir
 * koşumdan okunuyor. Uydurma müşteri sayısı, logo, referans yok; gösterilecek
 * gerçek ölçüm yoksa bölüm hiç çizilmiyor. Boş bir bölüm, süslenmiş bir
 * yalandan iyidir.
 */
export async function Landing() {
  // Tanıtım sayfası oturumsuz ziyaretçiye görünüyor: yalnızca herkese açık
  // işaretlenmiş vaka setleri.
  const suites = await listSuites({ kind: 'public' })
  const failing = suites.find((s) => s.latest.run.verdict === 'fail') ?? suites[0]
  const worst = failing === undefined ? undefined : worstCase(failing.latest)
  const previous =
    failing === undefined
      ? undefined
      : failing.runs.find((r) => r.run.startedAt < failing.latest.run.startedAt)
  const comparison =
    failing === undefined || previous === undefined
      ? null
      : await compare(previous.slug, failing.latest.slug)

  return (
    <Shell>
      <section className="border-b border-rule pb-16">
        <p className="rule-label mb-6">A CI test runner for Agent Skills</p>
        <h1 className="max-w-[18ch] font-display text-5xl leading-[1.05] sm:text-6xl">
          Does your skill still fire?
        </h1>
        <p className="mt-8 max-w-[62ch] text-base text-text-muted">
          A skill ships with a README and a promise. Whether it triggers on the request
          it claims, stays quiet on the one next to it, and does the same thing tomorrow
          — nobody measures. Assay runs a case set against a real host, repeats it, and
          reports the rate with its uncertainty attached.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="/signin"
            className="border border-rule-strong px-4 py-2 text-xs uppercase tracking-[0.09em] no-underline hover:bg-surface-sunken"
          >
            Sign in
          </Link>
          <code className="font-mono text-xs text-text-faint">
            npx assay run ./my-skill.suite.yaml --skill ./my-skill
          </code>
        </div>
      </section>

      {failing === undefined || worst === undefined ? (
        <section className="border-b border-rule py-16">
          <p className="rule-label mb-6">A real measurement</p>
          <Callout tone="info" title="This instance has no runs yet">
            Every figure on this page is read out of the database, from runs uploaded by
            the CLI. Nothing is written by hand, so until a run arrives there is nothing
            to show here.
          </Callout>
        </section>
      ) : (
        <section className="border-b border-rule py-16">
          <p className="rule-label mb-6">A real measurement</p>
          <p className="max-w-[62ch] text-sm text-text-muted">
            The run below is stored on this instance. The{' '}
            <code className="font-mono text-xs">{failing.skill}</code> skill was measured
            on {failing.latest.run.startedAt.slice(0, 10)} against{' '}
            <code className="font-mono text-xs">{failing.latest.run.pins.model}</code>,{' '}
            {failing.latest.run.runs} attempts per case. Below is the case it handled
            least reliably.
          </p>

          <div className="mt-10 border border-rule px-6 py-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
              <span className="font-mono text-xs">{worst.caseId}</span>
              <Badge verdict={worst.failed > 0 ? 'fail' : 'pass'} />
            </div>
            <IntervalRule value={worst.passRate} tone="text-fail" />
            <p className="mt-3 font-mono text-sm">{formatProportion(worst.passRate)}</p>
            <p className="mt-4 max-w-[62ch] text-sm text-text-muted">
              {worst.passed} of {worst.passRate.n} attempts held; {worst.failed} did not.
              One attempt would have reported either outcome as a fact. The interval is
              the honest part: it says how little {worst.passRate.n} observations can
              settle.
            </p>
          </div>

          <p className="mt-6">
            <Link
              href={`/runs/${failing.latest.slug}`}
              className="text-sm text-accent-quiet underline underline-offset-4"
            >
              Open the full scorecard
            </Link>
          </p>
        </section>
      )}

      {comparison === null ? null : (
        <section className="border-b border-rule py-16">
          <p className="rule-label mb-6">What it refuses to claim</p>
          <p className="max-w-[62ch] text-sm text-text-muted">
            Two runs of the same skill are stored. Here is what Assay says when asked
            whether the second is better than the first — not a headline, the actual
            output:
          </p>
          <div className="mt-8">
            <Callout
              tone={comparison.comparison.comparable ? 'info' : 'warning'}
              title={
                comparison.comparison.comparable
                  ? 'Comparison produced'
                  : 'Comparison refused'
              }
            >
              {comparison.comparison.reason}
            </Callout>
          </div>
          <p className="mt-6 max-w-[62ch] text-sm text-text-muted">
            A regression is only called when the two intervals do not overlap, and two
            runs are only compared when the skill, the model, the environment and the
            case set are all identical. A tool that skips these produces confident
            numbers about nothing.
          </p>
        </section>
      )}

      <section className="border-b border-rule py-16">
        <p className="rule-label mb-8">What it measures</p>
        <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <Layer
            title="Trigger accuracy"
            body="Does it fire on the request it claims, and stay quiet on the near neighbour? A case set without a negative case is rejected — a skill that fires on everything would pass every positive case."
          />
          <Layer
            title="Task completion"
            body="Does the artefact exist, parse, and match the schema? Deterministic assertions only: file existence, structure, schema, text match."
          />
          <Layer
            title="Tool trace"
            body="Were the expected tools called in the expected order? A right answer reached the wrong way is a skill that breaks tomorrow."
          />
          <Layer
            title="Side effects"
            body="What did it write, delete, or reach for on the network? Where the sandbox cannot see, the run says so instead of reporting a clean slate."
          />
          <Layer
            title="Instability"
            body="Repeat count never defaults to one. A single attempt is an observation; the measurement is the rate across N with its interval."
          />
          <Layer
            title="Regression"
            body="Did the new version get worse? Only claimed when four pins are identical and the intervals do not overlap."
          />
        </dl>
      </section>

      <section className="border-b border-rule py-16">
        <p className="rule-label mb-8">Three verdicts, not two</p>
        <div className="grid gap-8 sm:grid-cols-3">
          <Verdict
            kind="pass"
            body="The assertion held, and there was enough signal to say so."
          />
          <Verdict kind="fail" body="The assertion did not hold. Something is broken." />
          <Verdict
            kind="unknown"
            body="The signal could not be read. This is a first-class result, counted and shown separately — never rounded up to a pass."
          />
        </div>
        <p className="mt-8 max-w-[62ch] text-sm text-text-muted">
          The most dangerous thing a test tool can do is report what it could not measure
          as a success. Everything else here follows from refusing that.
        </p>
      </section>

      <section className="border-b border-rule py-16">
        <p className="rule-label mb-8">Getting started</p>
        <ol className="ruled font-mono text-sm">
          <Step
            command="npx assay init ./my-skill"
            note="writes an example case set next to the skill"
          />
          <Step
            command="npx assay run ./my-skill.suite.yaml --skill ./my-skill"
            note="runs it against the host, N times per case, stores the record locally"
          />
          <Step
            command="npx assay ci ./my-skill.suite.yaml"
            note="the same run, with a CI exit code: 1 for a failure, 3 for nothing measured"
          />
          <Step
            command="npx assay push --suite ./my-skill.suite.yaml"
            note="optional — keeps the history here so the next run can be compared against it"
          />
        </ol>
        <p className="mt-6 max-w-[62ch] text-sm text-text-muted">
          The SDK is Apache-2.0 and works with no account: runs are stored under{' '}
          <code className="font-mono text-xs">.assay/runs/</code> and printed as JSON. The
          hosted side does not measure anything — it remembers.
        </p>
      </section>

      <section className="py-16">
        <p className="rule-label mb-4">Pricing</p>
        <p className="mb-8 max-w-[62ch] text-sm text-text-muted">
          Draft, and not yet charged for. The measuring half stays free and open — a
          measurement layer nobody can read is a measurement nobody should trust.
        </p>
        <div className="grid gap-8 sm:grid-cols-3">
          <Tier
            name="SDK"
            price="Free, Apache-2.0"
            body="The CLI, the adapters, the assertion engine, the local store, the GitHub Action. Everything that measures."
          />
          <Tier
            name="Team"
            price="Draft"
            body="Uploaded history, regression comparison across versions, shared visibility. Everything that remembers."
          />
          <Tier
            name="Platform"
            price="Draft"
            body="For catalogues that want a measured quality signal on the skills they distribute — dated, pinned, reproducible."
          />
        </div>
      </section>
    </Shell>
  )
}

function worstCase(item: RunWithSummary): CaseResult | undefined {
  const withFailures = item.run.cases.filter((c) => c.failed > 0)
  if (withFailures.length === 0) return item.run.cases[0]
  return withFailures.reduce((worst, candidate) =>
    (candidate.passRate.rate ?? 1) < (worst.passRate.rate ?? 1) ? candidate : worst,
  )
}

function Layer({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <dt className="mark text-text">{title}</dt>
      <dd className="mt-2 max-w-[52ch] text-sm text-text-muted">{body}</dd>
    </div>
  )
}

function Verdict({ kind, body }: { kind: 'pass' | 'fail' | 'unknown'; body: string }) {
  return (
    <div className="border-t border-rule-strong pt-4">
      <Badge verdict={kind} />
      <p className="mt-3 text-sm text-text-muted">{body}</p>
    </div>
  )
}

function Step({ command, note }: { command: string; note: string }) {
  return (
    <li className="py-3">
      <p className="overflow-x-auto">
        <span className="text-text-faint">$ </span>
        {command}
      </p>
      <p className="mt-1 text-xs text-text-faint">{note}</p>
    </li>
  )
}

function Tier({ name, price, body }: { name: string; price: string; body: string }) {
  return (
    <div className="border-t border-rule-strong pt-4">
      <p className="font-display text-xl">{name}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.09em] text-accent-quiet">{price}</p>
      <p className="mt-3 text-sm text-text-muted">{body}</p>
    </div>
  )
}
