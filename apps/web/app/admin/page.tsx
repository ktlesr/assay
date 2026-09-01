import { prisma } from '@ktlsr/assay-db'
import { Badge } from '@ktlsr/assay-ui'
import { Shell } from '../components/shell'
import { requireAdmin } from '../../lib/guard'
import { setRole, setSuspended } from './actions'
import { DangerAction } from './danger-action'
import { AdminNav } from './admin-nav'

/**
 * Kullanıcı yönetimi.
 *
 * Kendi satırında yıkıcı düğme yok: bir yöneticinin kendini kilitlemesi
 * mümkün olmasın diye kural sunucuda zorlanıyor, arayüz de aynı şeyi söylüyor.
 */
export default async function AdminUsersPage() {
  const session = await requireAdmin('/admin')
  const users = await prisma().user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { runs: true, apiTokens: true } } },
  })

  return (
    <Shell breadcrumbs={[{ label: 'admin' }, { label: 'users' }]}>
      <AdminNav />
      <h1 className="page-title">Users</h1>
      <p className="page-lede">
        Every change here is written to the audit log with the account that made it.
      </p>

      <ul className="ruled mt-10">
        {users.map((user) => {
          const self = user.id === session.user.id
          return (
            <li
              key={user.id}
              className="flex flex-wrap items-baseline justify-between gap-4 py-4"
            >
              <span className="min-w-0">
                <span className="font-mono text-sm">{user.email}</span>
                <span className="ml-3 text-xs uppercase tracking-[0.09em] text-text">
                  {user.role.toLowerCase()}
                </span>
                {self ? (
                  <span className="ml-2 text-xs text-text-faint">(you)</span>
                ) : null}
                <span className="mt-1 block text-xs text-text-faint">
                  {user._count.runs} run{user._count.runs === 1 ? '' : 's'} ·{' '}
                  {user._count.apiTokens} token{user._count.apiTokens === 1 ? '' : 's'} ·
                  joined {user.createdAt.toISOString().slice(0, 10)}
                  {user.suspendedAt === null
                    ? ''
                    : ` · suspended ${user.suspendedAt.toISOString().slice(0, 10)}`}
                </span>
              </span>

              {self ? (
                <span className="text-xs text-text-faint">
                  an admin cannot change their own role or suspend themselves
                </span>
              ) : (
                <span className="flex flex-wrap items-center gap-3">
                  {user.suspendedAt === null ? null : <Badge verdict="unknown" />}
                  <DangerAction
                    tone="default"
                    label={user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                    title={
                      user.role === 'ADMIN'
                        ? `Demote ${user.email} to user`
                        : `Promote ${user.email} to admin`
                    }
                    description={
                      user.role === 'ADMIN'
                        ? 'They lose access to this section and to every account action in it. The last remaining admin cannot be demoted.'
                        : 'They gain access to this section: user roles, run deletion and the audit log.'
                    }
                    confirmLabel={user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                    action={async () => {
                      'use server'
                      await setRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')
                    }}
                  />
                  <DangerAction
                    label={user.suspendedAt === null ? 'Suspend' : 'Restore'}
                    title={
                      user.suspendedAt === null
                        ? `Suspend ${user.email}`
                        : `Restore ${user.email}`
                    }
                    description={
                      user.suspendedAt === null
                        ? 'Their session dies on the next request and their API tokens stop uploading runs. Runs they already uploaded stay.'
                        : 'They can sign in again and their API tokens start working again.'
                    }
                    confirmLabel={user.suspendedAt === null ? 'Suspend' : 'Restore'}
                    action={async () => {
                      'use server'
                      await setSuspended(user.id, user.suspendedAt === null)
                    }}
                  />
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Shell>
  )
}
