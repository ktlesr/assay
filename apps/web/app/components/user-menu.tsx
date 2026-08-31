import { Button } from '@assay/ui'
import Link from 'next/link'
import { auth, signOut } from '../../lib/auth'

/**
 * Başlıktaki oturum bölümü.
 *
 * Rol gizlenmiyor: yönetici olarak gezerken bunu görmek, yanlışlıkla yönetici
 * yetkisiyle iş yapmayı azaltıyor.
 */
export async function UserMenu() {
  const session = await auth()
  if (session === null) {
    return (
      <Link
        href="/signin"
        className="text-xs uppercase tracking-[0.09em] text-text-faint no-underline hover:text-text"
      >
        Sign in
      </Link>
    )
  }

  async function endSession() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <span className="flex items-baseline gap-3">
      <span className="text-xs text-text-faint" title={session.user.email ?? ''}>
        {session.user.email}
        {session.user.role === 'ADMIN' ? (
          <span className="ml-2 uppercase tracking-[0.09em] text-accent-quiet">admin</span>
        ) : null}
      </span>
      <form action={endSession}>
        <Button type="submit" tone="quiet">
          Sign out
        </Button>
      </form>
    </span>
  )
}
