import { prisma } from '@assay/db'
import { Badge, EmptyState } from '@assay/ui'
import Link from 'next/link'
import { Shell } from '../../components/shell'
import { deleteRun } from '../actions'
import { DangerAction } from '../danger-action'
import { AdminNav } from '../admin-nav'

/**
 * Koşum yönetimi.
 *
 * Silme, ölçüm iddiasını bozmuyor: silinen bir koşuma dayanan karşılaştırma
 * `unknown` üretir, sessizce geçmez.
 */
export default async function AdminRunsPage() {
  const runs = await prisma().run.findMany({
    orderBy: { uploadedAt: 'desc' },
    take: 100,
    include: { owner: { select: { email: true } } },
  })

  return (
    <Shell breadcrumbs={[{ label: 'admin' }, { label: 'runs' }]}>
      <AdminNav />
      <h1 className="font-display text-3xl leading-none">Runs</h1>
      <p className="mt-3 max-w-[64ch] text-sm text-text-muted">
        Deleting a run removes its attempts, traces and evidence. A comparison that
        used it as a baseline then reports a missing baseline rather than passing.
      </p>

      {runs.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing uploaded yet"
            description="Runs arrive here through assay push. Until then this instance stores nothing."
          />
        </div>
      ) : (
        <ul className="ruled mt-10">
          {runs.map((run) => (
            <li
              key={run.id}
              className="flex flex-wrap items-baseline justify-between gap-4 py-4"
            >
              <span className="min-w-0">
                <Link
                  href={`/runs/${run.id}`}
                  className="font-mono text-xs no-underline hover:text-accent-quiet"
                >
                  {run.id}
                </Link>
                <span className="mt-1 block text-xs text-text-faint">
                  {run.skill} · {run.runsPerCase} runs per case · uploaded{' '}
                  {run.uploadedAt.toISOString().slice(0, 16).replace('T', ' ')} by{' '}
                  {run.owner?.email ?? 'an account that no longer exists'}
                </span>
              </span>
              <span className="flex items-center gap-4">
                <Badge
                  verdict={
                    run.verdict === 'PASS'
                      ? 'pass'
                      : run.verdict === 'FAIL'
                        ? 'fail'
                        : 'unknown'
                  }
                />
                <DangerAction
                  label="Delete"
                  title="Delete this run"
                  description={`${run.id} and every attempt in it are removed. This cannot be undone; the record still exists in the local .assay store of whoever measured it.`}
                  confirmLabel="Delete run"
                  action={async () => {
                    'use server'
                    await deleteRun(run.id)
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}
