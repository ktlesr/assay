import { prisma } from '@assay/db'
import { EmptyState } from '@assay/ui'
import { Shell } from '../../components/shell'
import { setSuitePublic } from '../actions'
import { AdminNav } from '../admin-nav'
import { DangerAction } from '../danger-action'

/**
 * Vaka seti görünürlüğü.
 *
 * Varsayılan gizli. Herkese açık yapmak bir yayın kararı: koşum kayıtları
 * istem metinlerini, araç argümanlarını ve dosya yollarını taşıyor.
 */
export default async function AdminSuitesPage() {
  const suites = await prisma().suite.findMany({
    orderBy: [{ skill: 'asc' }, { version: 'asc' }],
    include: { owner: { select: { email: true } }, _count: { select: { runs: true } } },
  })

  return (
    <Shell breadcrumbs={[{ label: 'admin' }, { label: 'case sets' }]}>
      <AdminNav />
      <h1 className="page-title">Case sets</h1>
      <p className="page-lede">
        A case set is private until it is published here. Publishing exposes every run
        measured with it — prompts, tool arguments and file paths included — to anyone
        with the link, signed in or not.
      </p>

      {suites.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing uploaded yet"
            description="Case sets arrive with the runs measured against them."
          />
        </div>
      ) : (
        <ul className="ruled mt-10">
          {suites.map((suite) => (
            <li
              key={suite.id}
              className="flex flex-wrap items-baseline justify-between gap-4 py-4"
            >
              <span className="min-w-0">
                <span className="font-mono text-sm">{suite.skill}</span>
                <span className="ml-3 text-xs uppercase tracking-[0.09em] text-text">
                  {suite.public ? 'public' : 'private'}
                </span>
                <span className="mt-1 block text-xs text-text-faint">
                  version {suite.version} · {suite._count.runs} run
                  {suite._count.runs === 1 ? '' : 's'} · {suite.hash.slice(0, 23)}… ·{' '}
                  {suite.owner?.email ?? 'no owner'}
                </span>
              </span>
              <DangerAction
                tone={suite.public ? 'danger' : 'default'}
                label={suite.public ? 'Make private' : 'Publish'}
                title={
                  suite.public
                    ? `Make ${suite.skill} v${suite.version} private`
                    : `Publish ${suite.skill} v${suite.version}`
                }
                description={
                  suite.public
                    ? 'Its runs stop being readable without an account. Links already shared stop working for signed-out visitors.'
                    : 'Every run measured with this case set becomes readable by anyone with the link, including its prompts, tool arguments and file paths.'
                }
                confirmLabel={suite.public ? 'Make private' : 'Publish'}
                action={async () => {
                  'use server'
                  await setSuitePublic(suite.id, !suite.public)
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}
