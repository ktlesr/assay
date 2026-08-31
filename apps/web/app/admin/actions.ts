'use server'

import { prisma } from '@assay/db'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '../../lib/guard'

/**
 * Yönetici işlemleri.
 *
 * Üç kural koda gömülü, iyi niyete bırakılmadı:
 *   1. Yönetici kendi rolünü düşüremez ve kendini askıya alamaz — tek
 *      yöneticili bir kurulumda kendini kapının dışında bırakmanın yolu.
 *   2. Son yönetici düşürülemez veya askıya alınamaz.
 *   3. Her işlem denetim kaydına yazılır. Kayıtsız bir yönetici işlemi,
 *      sonradan "kim yaptı" sorusunu cevapsız bırakır.
 */

class AdminRuleError extends Error {}

async function audit(
  actorId: string,
  action: string,
  subject: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  await prisma().auditLog.create({
    data: {
      actorId,
      action,
      subject,
      ...(detail === undefined ? {} : { detail: detail as never }),
    },
  })
}

async function adminCount(): Promise<number> {
  return prisma().user.count({ where: { role: 'ADMIN', suspendedAt: null } })
}

export async function setRole(userId: string, role: 'USER' | 'ADMIN'): Promise<void> {
  const session = await requireAdmin('/admin')
  if (userId === session.user.id) {
    throw new AdminRuleError('an admin cannot change their own role')
  }
  const target = await prisma().user.findUnique({ where: { id: userId } })
  if (target === null) throw new AdminRuleError('no such user')
  if (target.role === 'ADMIN' && role === 'USER' && (await adminCount()) <= 1) {
    throw new AdminRuleError('the last admin cannot be demoted')
  }

  await prisma().user.update({ where: { id: userId }, data: { role } })
  await audit(session.user.id, 'user.role', userId, { from: target.role, to: role })
  revalidatePath('/admin')
}

export async function setSuspended(userId: string, suspended: boolean): Promise<void> {
  const session = await requireAdmin('/admin')
  if (userId === session.user.id) {
    throw new AdminRuleError('an admin cannot suspend themselves')
  }
  const target = await prisma().user.findUnique({ where: { id: userId } })
  if (target === null) throw new AdminRuleError('no such user')
  if (suspended && target.role === 'ADMIN' && (await adminCount()) <= 1) {
    throw new AdminRuleError('the last admin cannot be suspended')
  }

  await prisma().user.update({
    where: { id: userId },
    data: { suspendedAt: suspended ? new Date() : null },
  })
  await audit(session.user.id, suspended ? 'user.suspend' : 'user.restore', userId)
  revalidatePath('/admin')
}

/**
 * Koşum silme.
 *
 * Silinen bir koşum bir karşılaştırmanın temeliyse, o karşılaştırma sessizce
 * geçmez: `compare` eksik temeli bildirir. Bu yüzden silme, ölçüm iddiasını
 * bozmadan yapılabilen bir işlem.
 */
export async function deleteRun(runId: string): Promise<void> {
  const session = await requireAdmin('/admin/runs')
  const run = await prisma().run.findUnique({ where: { id: runId } })
  if (run === null) throw new AdminRuleError('no such run')

  await prisma().run.delete({ where: { id: runId } })
  await audit(session.user.id, 'run.delete', runId, { skill: run.skill })
  revalidatePath('/admin/runs')
  revalidatePath('/')
}
