import {
  Callout,
  MeasurementBlock,
  MetricValue,
  TraceViewer,
  type Measurement,
  type TraceStep,
} from '@ktlsr/assay-ui'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Reveal } from '../components/reveal'
import { Shell } from '../components/shell'
import data from './measurements.json'

/**
 * Metodoloji yazısı.
 *
 * Konu skill'ler değil ölçüm: tek bir tetiklenme sayısı neden yanıltır?
 * İki gerçek koşum üzerinden iki ayrı yanılma biçimi gösteriliyor — biri
 * vaka setinden, biri katmandan geliyor. Hiçbir skill kötülenmiyor; ikisinde
 * de kusur ölçümün kendisinde.
 *
 * Sayfadaki hiçbir sayı elle yazılmadı (sözleşme 3). `measurements.json`
 * `tools/methodology-data.mjs` ile gerçek koşum kayıtlarından üretiliyor;
 * `apps/web` runner'a bağlanamadığı için veri derleme öncesinde dosyaya
 * yazılıyor ve commit'leniyor.
 */

export const metadata: Metadata = {
  title: 'Why one trigger score is not a measurement',
  description:
    'Two recorded runs showing the two ways a passing trigger score misleads: the case set can be the thing that passes, and the layer can be the thing that passes.',
}

const { caseSet, layers, limit } = data as unknown as {
  caseSet: {
    pins: ReadonlyArray<{
      pin: number
      name: string
      state: 'held' | 'changed' | 'unavailable'
      fields: ReadonlyArray<{ field: string; value: string; state: string }>
    }>
    counts: { total: number; held: number; changed: number; unavailable: number }
    runs: ReadonlyArray<{
      label: string
      suite: string
      slug: string
      date: string
      verdict: string
      cases: number
      repeats: number
      precision: Measurement
      recall: Measurement
    }>
  }
  layers: {
    slug: string
    date: string
    repeats: number
    crosstab: {
      firedDone: number
      firedMissing: number
      quietDone: number
      quietMissing: number
    }
    cases: ReadonlyArray<{
      caseId: string
      trigger: Measurement
      artifact: Measurement | null
    }>
    trace: {
      caseId: string
      attempt: number
      writes: readonly string[]
      steps: readonly TraceStep[]
    }
  }
  limit: {
    slug: string
    caseId: string
    attempts: number
    runTxtPresent: number
    deniedShell: number
    swallowed: number
  }
}

/** Kroma yalnızca uçlarda: kusursuz yeşil, sıfır kırmızı, arası nötr. */
const toneFor = (value: Measurement | null): { tone?: string } => {
  if (value?.rate === undefined || value.rate === null) return {}
  if (value.rate === 1) return { tone: 'text-pass' }
  if (value.rate === 0) return { tone: 'text-fail' }
  return {}
}

const caseOf = (id: string) => {
  const found = layers.cases.find((c) => c.caseId === id)
  if (found === undefined) throw new Error(`missing case ${id}`)
  return found
}

const proposal = caseOf('complete.proposal_with_objections')
const designDoc = caseOf('complete.design_doc_with_outline')
const control = caseOf('control.design_doc_no_artifact')
const decisionRecord = caseOf('complete.decision_record')

const [firstSet, secondSet] = caseSet.runs
const movedPin = caseSet.pins.find((p) => p.state === 'changed')
const blindPin = caseSet.pins.find((p) => p.state === 'unavailable')

const PIN_STATE_LABEL: Record<string, string> = {
  held: 'held',
  changed: 'changed',
  unavailable: 'not measured',
}

export default function Methodology() {
  return (
    <Shell>
      <header className="hero">
        <h1 className="hero-title">
          <span>Why one trigger score</span>
          <span>is not a measurement</span>
        </h1>
        <p className="hero-lede">
          Assay prints a trigger accuracy figure, and it is tempting to read that figure
          as <em>the skill works</em>. Two runs stored in this repository show the two
          ways that reading fails. Neither is the fault of a skill: in both, the thing
          that passed was the measurement.
        </p>
      </header>

      {/* --- I. Vaka setinin kendisi geçiyor ---------------------------- */}

      <Reveal>
        <section className="section-major">
          <h2 className="section-title">The case set can be the thing that passes</h2>
          <p className="section-lede">
            The same skill was measured twice on the same day. A comparison rests on{' '}
            {caseSet.counts.total} pins: {caseSet.counts.held} are byte-identical between
            the two runs, {caseSet.counts.unavailable} could not be read at all, and
            exactly one changed — the case set.
          </p>

          <div className="pin-list mt-10">
            {caseSet.pins.map((pin) => (
              <div key={pin.pin} className={`pin pin-${pin.state}`}>
                <span className="pin-name">
                  <span className="pin-index">{pin.pin}</span>
                  {pin.name}
                </span>
                <span className="pin-value">
                  {pin.fields.map((field) => (
                    <span key={field.field} className="pin-field">
                      <span className="pin-field-name">{field.field}</span>
                      <span className="pin-field-value">
                        {field.state === 'unavailable' && field.value === ''
                          ? '—'
                          : field.value}
                      </span>
                    </span>
                  ))}
                </span>
                <span className="pin-state">{PIN_STATE_LABEL[pin.state]}</span>
              </div>
            ))}
          </div>
          <p className="section-note">
            Each pin is recorded as one or two fields: a declared value and, where one
            exists, a content hash that catches the declaration being forgotten.{' '}
            {movedPin === undefined
              ? 'Every pin held.'
              : `Only pin ${movedPin.pin} moved, and only in its hash — the case set file changed while its declared version did not.`}
          </p>
          {blindPin === undefined ? null : (
            <Callout tone="warning" title={`Pin ${blindPin.pin} was not measured`}>
              This host does not publish a system prompt hash, so the field carries a
              placeholder rather than a value. A placeholder is identical in every run,
              and counting that as <em>held</em> would hand the comparison a guarantee
              nobody measured — the same mistake this page is about. Assay reports it as a
              third state, and a comparison resting on an unread pin returns{' '}
              <span className="text-unknown">unknown</span> unless an environment hash
              covers it.
            </Callout>
          )}

          <div className="split mt-12">
            {caseSet.runs.map((run) => (
              <article key={run.slug} className="split-half">
                <p className="col-label">{run.label}</p>
                <p className="split-name">{run.suite}</p>
                <MeasurementBlock
                  label="Trigger precision"
                  value={run.precision}
                  verb="stayed quiet when it should have"
                  tone={run.verdict === 'pass' ? 'text-pass' : 'text-fail'}
                />
                <p className="split-meta">
                  {run.cases} cases · {run.repeats} attempts each · {run.date}
                </p>
              </article>
            ))}
          </div>

          <p className="section-note">
            Precision is the share of firings that should have happened. The first set
            reports it as{' '}
            <strong>
              {firstSet?.precision.successes}/{firstSet?.precision.n}
            </strong>
            ; the second, measuring the same skill under the same conditions, reports{' '}
            <strong>
              {secondSet?.precision.successes}/{secondSet?.precision.n}
            </strong>
            . Recall is unchanged in both. The whole difference is in how the negative
            cases were cut.
          </p>

          <p className="section-note">
            Reading the traces explains it. In the first set every negative case put a
            document in front of the agent to transform — code, prose, a list of commits —
            while every positive case described work that existed only in the user&apos;s
            head. The set was separating cases on that second axis, not on the property it
            meant to test, and the skill happened to be flawless on it. Re-cutting the
            negatives so they differ from the positives on the tested property{' '}
            <em>and nothing else</em> moved the number by half.
          </p>

          <Callout tone="info" title="What this changes about reading a result">
            A trigger suite that passes every case is a statement about the suite as much
            as about the skill. Assay enforces that a case set contains a negative and a
            near neighbour; it cannot yet check that the near neighbour is near along the
            right axis. Until it can, a clean sheet is a prompt to look at the negatives,
            not a reason to stop.
          </Callout>
        </section>
      </Reveal>

      {/* --- II. Katmanın kendisi geçiyor -------------------------------- */}

      <Reveal>
        <section className="section-major">
          <h2 className="section-title">The layer can be the thing that passes</h2>
          <p className="section-lede">
            Trigger accuracy answers one question: did it fire? A second run asked the
            next one — once it fired, did the work get finished? Across{' '}
            {layers.crosstab.firedDone +
              layers.crosstab.firedMissing +
              layers.crosstab.quietDone +
              layers.crosstab.quietMissing}{' '}
            attempts of the same skill, the two answers turned out to be mutually
            exclusive.
          </p>

          <table className="crosstab mt-10">
            <caption className="col-label">
              Trigger against artefact, {layers.repeats} attempts per case
            </caption>
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">artefact complete</th>
                <th scope="col">artefact missing</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">skill fired</th>
                <td className={layers.crosstab.firedDone === 0 ? 'zero' : undefined}>
                  {layers.crosstab.firedDone}
                </td>
                <td className="mass">{layers.crosstab.firedMissing}</td>
              </tr>
              <tr>
                <th scope="row">skill stayed quiet</th>
                <td className="mass">{layers.crosstab.quietDone}</td>
                <td className={layers.crosstab.quietMissing === 0 ? 'zero' : undefined}>
                  {layers.crosstab.quietMissing}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="section-note">
            No attempt landed in either of the other two cells. Where the skill engaged,
            the file was never written; where it stayed out of the way, the file was
            always written.
          </p>

          <div className="mt-12">
            <p className="col-label mb-4">Per case, both layers side by side</p>
            <div className="ruled">
              {[proposal, designDoc, decisionRecord].map((item) => (
                <div key={item.caseId} className="layer-pair">
                  <p className="layer-pair-name">{item.caseId}</p>
                  <MetricValue
                    label="fired"
                    value={item.trigger}
                    {...(item.trigger.rate === 1 ? { tone: 'text-pass' } : {})}
                  />
                  <MetricValue
                    label="artefact"
                    value={item.artifact ?? item.trigger}
                    {...toneFor(item.artifact)}
                  />
                </div>
              ))}
            </div>
          </div>

          <p className="section-note">
            A trigger-only report of this run would have read{' '}
            <strong>
              {proposal.trigger.successes}/{proposal.trigger.n}
            </strong>{' '}
            on its strongest case and called the skill exemplary. The artefact layer
            reports{' '}
            <strong>
              {proposal.artifact?.successes}/{proposal.artifact?.n}
            </strong>{' '}
            on the same attempts.
          </p>

          <div className="mt-12">
            <p className="col-label mb-4">
              The whole trace of one such attempt — {layers.trace.steps.length} events, no{' '}
              <code className="code">Write</code> among them
            </p>
            <TraceViewer steps={layers.trace.steps} />
            <p className="section-note">
              <code className="code">env.writes</code> is{' '}
              {layers.trace.writes.length === 0
                ? 'empty'
                : layers.trace.writes.join(', ')}
              . The session ends on a message asking the user five questions.
            </p>
          </div>

          <Callout tone="info" title="This is the skill behaving as documented">
            Its own description is a multi-turn workflow whose first stage is gathering
            context by asking the user. A single-turn CI run has nobody to answer, so it
            ends where the workflow says it should end. Nothing here is broken. What is
            wrong is a measurement that stops at the first layer and reports the result as
            completion.
          </Callout>
        </section>
      </Reveal>

      {/* --- Kontrol vakası ---------------------------------------------- */}

      <Reveal>
        <section className="section-minor">
          <h2 className="section-title">The control case</h2>
          <p className="section-lede">
            Both readings above are causal claims, and a causal claim needs the other
            variables held still. The completion run carries a control case for exactly
            that: its prompt is word-for-word identical to{' '}
            <code className="code">{designDoc.caseId}</code> except for the final
            paragraph, which asks for a file on disk. Nothing else differs — same run,
            same record, so all {caseSet.counts.total} pins are recorded once and cover
            both cases.
          </p>
          <div className="split mt-10">
            <article className="split-half">
              <p className="col-label">No file requested</p>
              <p className="split-name">{control.caseId}</p>
              <MeasurementBlock
                label="Skill engaged"
                value={control.trigger}
                verb="fired in"
                tone="text-pass"
              />
            </article>
            <article className="split-half">
              <p className="col-label">
                Same prompt, plus &ldquo;save it to out/…&rdquo;
              </p>
              <p className="split-name">{designDoc.caseId}</p>
              <MeasurementBlock
                label="Skill engaged"
                value={designDoc.trigger}
                verb="fired in"
              />
            </article>
          </div>
          <p className="section-note">
            Because the two cases sit in one run, the comparison does not ask you to trust
            the person reporting it: the pins are recorded once and cover both. Running
            the control separately would have produced a second record with its own
            environment hash, and the claim would have rested on an assurance instead of a
            pin.
          </p>
        </section>
      </Reveal>

      {/* --- Aracın kendi sınırı ------------------------------------------ */}

      <Reveal>
        <section className="section-minor">
          <h2 className="section-title">
            A file existing is not proof its content was earned
          </h2>
          <p className="section-lede">
            The completion layer asserts that a file exists, parses, and matches a
            pattern. It cannot assert where the content came from. One case in a third run
            makes the gap visible.
          </p>
          <dl className="limit-grid mt-8">
            <div className="limit">
              <dt className="limit-figure">
                {limit.runTxtPresent}/{limit.attempts}
              </dt>
              <dd className="limit-body">
                attempts produced <code className="code">out/run.txt</code>, the file
                meant to hold the output of a test run
              </dd>
            </div>
            <div className="limit">
              <dt className="limit-figure">
                {limit.deniedShell}/{limit.attempts}
              </dt>
              <dd className="limit-body">
                attempts had at least one shell call refused by the host&apos;s permission
                layer, so the run mostly could not happen
              </dd>
            </div>
            <div className="limit">
              <dt className="limit-figure">
                {limit.swallowed}/{limit.attempts}
              </dt>
              <dd className="limit-body">
                attempts were caught by <code className="code">no_swallowed_errors</code>{' '}
                — the agent hit those refusals and did not mention them afterwards
              </dd>
            </div>
          </dl>
          <p className="section-note">
            Both figures are honest and they disagree. That disagreement is the finding:{' '}
            <code className="code">file_exists</code> plus{' '}
            <code className="code">file_content_matches</code> can tell you a plausible
            file is there; they cannot tell a recorded run from a well-formed guess. The
            same boundary is why side-effect claims return{' '}
            <span className="text-unknown">unknown</span> whenever a run used a shell — an
            unobserved write is not a clean one.
          </p>
          <Callout tone="warning" title="Stated, not fixed">
            This is a ceiling in the tool as it stands today, not in the skills it
            measured. It is written here for the same reason a run reports{' '}
            <span className="text-unknown">unknown</span> instead of rounding up: an
            instrument that hides its own blind spot is worse than one that has a bigger
            one.
          </Callout>
        </section>
      </Reveal>

      {/* --- Kaynak ------------------------------------------------------- */}

      <Reveal>
        <section className="section-minor section-last">
          <p className="rule-label mb-6">Provenance</p>
          <p className="section-lede">
            Every figure on this page is read out of a stored run record. None is written
            by hand.
          </p>
          <ul className="ruled provenance mt-6">
            {caseSet.runs.map((run) => (
              <li key={run.slug} className="provenance-row">
                <span className="provenance-name">{run.suite}</span>
                <span className="provenance-slug">{run.slug}</span>
                <span className="provenance-date">{run.date}</span>
              </li>
            ))}
            <li className="provenance-row">
              <span className="provenance-name">doc-coauthoring-completion</span>
              <span className="provenance-slug">{layers.slug}</span>
              <span className="provenance-date">{layers.date}</span>
            </li>
            <li className="provenance-row">
              <span className="provenance-name">webapp-testing-completion</span>
              <span className="provenance-slug">{limit.slug}</span>
              <span className="provenance-date">{layers.date}</span>
            </li>
          </ul>
          <p className="section-note">
            Regenerate with{' '}
            <code className="code">
              node tools/methodology-data.mjs &lt;trigger-root&gt; &lt;completion-root&gt;
              apps/web/app/methodology/measurements.json
            </code>
            . The case sets live under <code className="code">suites/</code> and{' '}
            <code className="code">examples/measurements/</code>; the long-form reports
            are in <code className="code">docs/measurements.md</code>.
          </p>
          <p className="mt-8">
            <Link href="/" className="link text-sm">
              Back to the front page
            </Link>
          </p>
        </section>
      </Reveal>
    </Shell>
  )
}
