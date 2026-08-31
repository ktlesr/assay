'use client'

import {
  Badge,
  Button,
  Callout,
  ConfirmDialog,
  Dialog,
  DropdownMenu,
  EmptyState,
  ErrorState,
  formatMeasurement,
  MetricValue,
  Popover,
  Table,
  Toast,
  ToastProvider,
  ToastViewport,
  Tooltip,
  TooltipProvider,
  TraceViewer,
  type Column,
  type Measurement,
} from '@assay/ui'
import { useState, type ReactNode } from 'react'

/**
 * Bileşen numuneleri.
 *
 * Gösterilen ölçümler uydurma değil: Faz 1 dogfooding koşumlarından alınan
 * gerçek değerler (docs/dogfooding.md).
 */

const measure = (successes: number, n: number): Measurement => {
  if (n === 0) return { successes, n, rate: null, ci: null }
  const z = 1.959963984540054
  const p = successes / n
  const z2 = z * z
  const denominator = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  const clamp = (v: number) => Math.min(1, Math.max(0, Math.round(v * 1e12) / 1e12))
  return {
    successes,
    n,
    rate: p,
    ci: {
      low: clamp((centre - margin) / denominator),
      high: clamp((centre + margin) / denominator),
      level: 0.95,
    },
  }
}

/** xlsx skill'inin gerçek ölçümü: kendi tarif ettiği vakada 10'da 4. */
const XLSX_IMPLICIT = measure(4, 10)
const XLSX_RECALL = measure(14, 20)
const DOCX_PRECISION = measure(20, 20)
const NOT_MEASURED = measure(0, 0)

interface CaseRow {
  id: string
  verdict: 'pass' | 'fail' | 'unknown'
  rate: Measurement
  passed: number
  failed: number
  unknown: number
}

const ROWS: CaseRow[] = [
  {
    id: 'trigger.positive.explicit',
    verdict: 'pass',
    rate: measure(10, 10),
    passed: 10,
    failed: 0,
    unknown: 0,
  },
  {
    id: 'trigger.positive.implicit',
    verdict: 'fail',
    rate: XLSX_IMPLICIT,
    passed: 4,
    failed: 6,
    unknown: 0,
  },
  {
    id: 'trigger.negative.near_neighbor.docx',
    verdict: 'pass',
    rate: measure(10, 10),
    passed: 10,
    failed: 0,
    unknown: 0,
  },
  {
    id: 'trigger.negative.unrelated',
    verdict: 'unknown',
    rate: NOT_MEASURED,
    passed: 0,
    failed: 0,
    unknown: 10,
  },
]

const COLUMNS: Column<CaseRow>[] = [
  {
    key: 'verdict',
    header: '',
    width: '2rem',
    render: (row) => <Badge verdict={row.verdict} showLabel={false} />,
  },
  {
    key: 'case',
    header: 'Case',
    sortValue: (row) => row.id,
    render: (row) => <span className="font-mono text-xs">{row.id}</span>,
  },
  {
    key: 'rate',
    header: 'Pass rate',
    sortValue: (row) => row.rate.rate ?? -1,
    // Değişmez #4: tabloda bile oran N ve güven aralığı olmadan yazılmaz.
    render: (row) => (
      <span className="font-mono text-xs text-text-muted">
        {formatMeasurement(row.rate)}
      </span>
    ),
  },
  {
    key: 'unknown',
    header: 'Unknown',
    align: 'right',
    sortValue: (row) => row.unknown,
    render: (row) => (
      <span className={row.unknown > 0 ? 'text-unknown' : 'text-text-faint'}>
        {row.unknown}
      </span>
    ),
  },
]

const TRACE = [
  {
    seq: 1,
    kind: 'skill_trigger' as const,
    skill: 'xlsx',
  },
  {
    seq: 2,
    kind: 'tool_call' as const,
    tool: 'PowerShell',
    args: { command: 'New-Item -ItemType Directory -Force -Path "out"' },
  },
  {
    seq: 3,
    kind: 'tool_result' as const,
    tool: 'PowerShell',
    isError: true,
    error: 'This PowerShell command contains multiple operations. Approval required.',
  },
  {
    seq: 4,
    kind: 'tool_call' as const,
    tool: 'Write',
    args: { file_path: 'out/manifest.json' },
  },
  { seq: 5, kind: 'tool_result' as const, tool: 'Write' },
  {
    seq: 6,
    kind: 'assistant_message' as const,
    text: 'Created a widget manifest with two widgets.',
  },
  { seq: 7, kind: 'session_end' as const, outcome: 'completed' },
]

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <p className="rule-label mb-4">{title}</p>
      {children}
    </section>
  )
}

export function Specimens() {
  const [toastOpen, setToastOpen] = useState(false)

  return (
    <TooltipProvider>
      <ToastProvider swipeDirection="right">
        <Group title="Measurements">
          <MetricValue label="Precision" value={DOCX_PRECISION} />
          <MetricValue label="Recall" value={XLSX_RECALL} />
          <MetricValue label="Implicit case" value={XLSX_IMPLICIT} />
          <MetricValue label="Not measured" value={NOT_MEASURED} />
          <p className="mt-3 max-w-[58ch] text-xs text-text-faint">
            The interval is drawn before the number is read. A rate without its
            observation count and interval cannot be rendered — the type carries all three
            together.
          </p>
        </Group>

        <Group title="Verdicts">
          <div className="flex flex-wrap items-center gap-6">
            <Badge verdict="pass" />
            <Badge verdict="fail" />
            <Badge verdict="unknown" />
            <Tooltip label="Colour is never the only carrier: the glyph differs too.">
              <span className="cursor-help border-b border-dashed border-rule-strong text-xs text-text-muted">
                why three shapes?
              </span>
            </Tooltip>
          </div>
        </Group>

        <Group title="Table">
          <Table columns={COLUMNS} rows={ROWS} rowKey={(row) => row.id} />
        </Group>

        <Group title="Trace">
          <TraceViewer
            steps={TRACE}
            swallowed={{
              verdict: 'fail',
              reason:
                'the session completed successfully while a failure was never mentioned afterwards',
            }}
          />
        </Group>

        <Group title="Callouts">
          <div className="space-y-4">
            <Callout tone="info" title="Stored locally">
              Every run is written to <code>.assay/runs/</code> before anything is
              uploaded.
            </Callout>
            <Callout tone="warning" title="Nothing was measured">
              Ten attempts produced no verdict. They are excluded from every rate above
              and counted separately.
            </Callout>
            <Callout tone="danger" title="Pins drifted">
              The skill content changed between these two runs, so the comparison was not
              produced.
            </Callout>
          </div>
        </Group>

        <Group title="Overlays">
          <div className="flex flex-wrap items-center gap-3">
            <Dialog
              trigger={<Button>Open dialog</Button>}
              title="Run details"
              description="Dialogs trap focus and return it to the trigger on close."
            >
              <p className="text-sm text-text-muted">
                Body content sits on the raised surface, separated by a hairline rather
                than a shadow.
              </p>
            </Dialog>

            <ConfirmDialog
              trigger={<Button tone="danger">Delete run</Button>}
              title="Delete this run"
              description="The run and every attempt in it are removed. Comparisons that used it as a baseline will report a missing baseline instead of silently passing."
              confirmLabel="Delete run"
            />

            <Popover trigger={<Button tone="quiet">Popover</Button>}>
              <p className="text-text-muted">
                Popovers hold secondary detail — a pin list, a case prompt — without
                leaving the page.
              </p>
            </Popover>

            <DropdownMenu
              trigger={<Button tone="quiet">Actions ▾</Button>}
              items={[
                { label: 'Download report' },
                { label: 'Compare with previous' },
                { label: 'Delete run', tone: 'danger' },
              ]}
            />

            <Button onClick={() => setToastOpen(true)}>Show toast</Button>
          </div>
        </Group>

        <Group title="States">
          <div className="space-y-6">
            <EmptyState
              title="No runs yet"
              description="Assay stores every run locally first. Run a case set with the CLI, then upload it here to keep the history."
              action={
                <code className="font-mono text-xs text-text-faint">
                  assay run my-skill.suite.yaml --skill ./my-skill
                </code>
              }
            />
            <ErrorState
              title="Could not read the run"
              detail="The stored file was written by store version 1 and this build reads version 2. Re-run the suite, or open the file with the matching CLI version."
              action={<Button>Retry</Button>}
            />
          </div>
        </Group>

        <Toast
          open={toastOpen}
          onOpenChange={setToastOpen}
          title="Report copied"
          description="The HTML report path is on your clipboard."
        />
        <ToastViewport />
      </ToastProvider>
    </TooltipProvider>
  )
}
