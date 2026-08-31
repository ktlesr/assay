import { prisma } from '@assay/db'
import { EmptyState } from '@assay/ui'
import { Shell } from '../../components/shell'
import { AdminNav } from '../admin-nav'

/**
 * Denetim kaydı.
 *
 * Salt okunur ve arayüzden silinemez. Silinebilen bir denetim kaydı, denetim
 * kaydı değildir.
 */
export default async function AuditPage() {
  const entries = await prisma().auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  const actors = await prisma().user.findMany({
    where: { id: { in: [...new Set(entries.map((e) => e.actorId ?? ''))] } },
    select: { id: true, email: true },
  })
  const emailById = new Map(actors.map((a) => [a.id, a.email]))

  return (
    <Shell breadcrumbs={[{ label: 'admin' }, { label: 'audit log' }]}>
      <AdminNav />
      <h1 className="font-display text-3xl leading-none">Audit log</h1>
      <p className="mt-3 max-w-[64ch] text-sm text-text-muted">
        Every administrative action, newest first. Read-only: there is no way to remove
        an entry from here.
      </p>

      {entries.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No administrative actions yet"
            description="Role changes, suspensions and run deletions appear here as they happen."
          />
        </div>
      ) : (
        <ul className="ruled mt-10 font-mono text-xs">
          {entries.map((entry) => (
            <li key={entry.id} className="grid grid-cols-[10rem_8rem_1fr] gap-4 py-3">
              <span className="text-text-faint">
                {entry.createdAt.toISOString().slice(0, 19).replace('T', ' ')}
              </span>
              <span>{entry.action}</span>
              <span className="min-w-0 break-all text-text-muted">
                {emailById.get(entry.actorId ?? '') ?? entry.actorId ?? 'unknown actor'} →{' '}
                {entry.subject}
                {entry.detail === null ? '' : ` ${JSON.stringify(entry.detail)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}
