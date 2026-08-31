'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Badge, type VerdictKind } from './measurement'

/**
 * Yoğun veri bileşenleri: tablo ve iz görüntüleyici.
 *
 * İkisinin de ortak kuralı: sayılar tabular, sınırlar hairline, satırlar
 * kutuda değil çizgide. Hata dönen adımlar renkle *ve* işaretle ayrışır.
 */

// ---------------------------------------------------------------------------
// Tablo
// ---------------------------------------------------------------------------

export interface Column<Row> {
  key: string
  header: string
  /** Hücre içeriği. */
  render: (row: Row) => ReactNode
  /** Sıralama anahtarı. Verilmezse sütun sıralanamaz. */
  sortValue?: (row: Row) => string | number
  align?: 'left' | 'right'
  width?: string
}

/**
 * Sıralanabilir, yoğun tablo.
 *
 * Zebra şerit yok — cetvel çizgisi zaten satırı ayırıyor ve şerit, ölçüm
 * değerlerinin okunmasını zorlaştırıyor. Sıralama durumu `aria-sort` ile
 * bildiriliyor.
 */
export function Table<Row>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: readonly Column<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => string
  empty?: ReactNode
}) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  )

  const sorted = useMemo(() => {
    if (sort === null) return rows
    const column = columns.find((c) => c.key === sort.key)
    if (column?.sortValue === undefined) return rows
    const get = column.sortValue
    return [...rows].sort((a, b) => {
      const left = get(a)
      const right = get(b)
      const order = left < right ? -1 : left > right ? 1 : 0
      return sort.direction === 'asc' ? order : -order
    })
  }, [rows, sort, columns])

  if (rows.length === 0 && empty !== undefined) return <>{empty}</>

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-rule">
          {columns.map((column) => {
            const sortable = column.sortValue !== undefined
            const active = sort?.key === column.key
            return (
              <th
                key={column.key}
                scope="col"
                style={column.width === undefined ? undefined : { width: column.width }}
                aria-sort={
                  active
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                className={`col-label py-2 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
              >
                {sortable ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSort((current) =>
                        current?.key === column.key
                          ? {
                              key: column.key,
                              direction: current.direction === 'asc' ? 'desc' : 'asc',
                            }
                          : { key: column.key, direction: 'asc' },
                      )
                    }
                    className="uppercase tracking-[0.09em] hover:text-text"
                  >
                    {column.header}
                    <span aria-hidden="true" className="ml-1 text-text-faint">
                      {active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr key={rowKey(row)} className="border-b border-rule">
            {columns.map((column) => (
              <td
                key={column.key}
                className={`py-2 align-baseline text-sm ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {column.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------------------
// İz görüntüleyici
// ---------------------------------------------------------------------------

export interface TraceStep {
  seq: number
  kind:
    'tool_call' | 'tool_result' | 'assistant_message' | 'skill_trigger' | 'session_end'
  tool?: string | undefined
  skill?: string | undefined
  text?: string | undefined
  error?: string | undefined
  isError?: boolean | undefined
  outcome?: string | undefined
  args?: Record<string, unknown> | undefined
}

const KIND_GLYPH: Record<TraceStep['kind'], string> = {
  tool_call: '→',
  tool_result: '←',
  assistant_message: '¶',
  skill_trigger: '◆',
  session_end: '■',
}

/**
 * Araç çağrısı akışı.
 *
 * Hata dönen adımlar **iki** biçimde ayrışıyor: pas rengi ve sol kenardaki
 * kalın çizgi. Skill tetiklenmesi ayrı bir glifle işaretli, çünkü ölçümün
 * konusu o.
 *
 * `swallowed` verildiğinde akışın altında yutulan hata uyarısı gösterilir —
 * bu, ürünün ayırt edici ölçümü ve gizlenmemeli.
 */
export function TraceViewer({
  steps,
  swallowed,
}: {
  steps: readonly TraceStep[]
  swallowed?: { verdict: VerdictKind; reason: string }
}) {
  if (steps.length === 0) {
    return (
      <p className="border-l-2 border-unknown-rule py-2 pl-4 text-sm text-unknown">
        No trace was captured. An empty trace and a missing trace are different claims —
        this one is missing.
      </p>
    )
  }
  return (
    <div>
      <ol className="ruled font-mono text-xs">
        {steps.map((step) => (
          <li
            key={step.seq}
            className={`grid grid-cols-[1.5rem_8rem_1fr] gap-3 py-2 ${
              step.isError === true ? 'border-l-2 border-fail-rule pl-3 text-fail' : ''
            }`}
          >
            <span className="text-text-faint" aria-hidden="true">
              {KIND_GLYPH[step.kind]}
            </span>
            <span
              className="truncate text-text-muted"
              title={step.tool ?? step.skill ?? step.kind}
            >
              {step.tool ?? step.skill ?? step.kind}
            </span>
            <span className="min-w-0 break-words">
              {step.isError === true
                ? (step.error ?? 'failed')
                : (step.text ?? formatArgs(step.args) ?? step.outcome ?? '')}
            </span>
          </li>
        ))}
      </ol>
      {swallowed === undefined ? null : (
        <div
          className={`mt-4 border-l-2 py-2 pl-4 ${
            swallowed.verdict === 'fail'
              ? 'border-fail-rule'
              : swallowed.verdict === 'unknown'
                ? 'border-unknown-rule'
                : 'border-pass-rule'
          }`}
        >
          <p className="mark">
            <Badge verdict={swallowed.verdict} showLabel={false} />
            <span className="text-text-muted">no swallowed errors</span>
          </p>
          <p className="mt-1 max-w-[70ch] text-sm text-text-muted">{swallowed.reason}</p>
        </div>
      )}
    </div>
  )
}

function formatArgs(args: Record<string, unknown> | undefined): string | undefined {
  if (args === undefined) return undefined
  const text = JSON.stringify(args)
  return text.length > 160 ? `${text.slice(0, 160)}…` : text
}
