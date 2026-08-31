import { redirect } from 'next/navigation'
import type { Session } from 'next-auth'
import { auth } from './auth'

/**
 * Rol denetimi.
 *
 * Kenar (edge) middleware yerine sunucu bileşeni katmanında: rol veritabanından
 * okunuyor ve Prisma ile Argon2 kenar çalışma zamanında koşmuyor. Denetimi
 * layout'ta yapmak korunan her alt yolu kapsıyor — middleware eşleştiricisinin
 * unutulan bir yolu kaçırma riski olmadan.
 */

export async function requireUser(from: string): Promise<Session> {
  const session = await auth()
  if (session === null) redirect(`/signin?from=${encodeURIComponent(from)}`)
  return session
}

export async function requireAdmin(from: string): Promise<Session> {
  const session = await requireUser(from)
  if (session.user.role !== 'ADMIN') redirect('/')
  return session
}
