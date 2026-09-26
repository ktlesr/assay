'use server'

import { prisma } from '@ktlsr/assay-db'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '../../lib/guard'
import { labelEdit } from '../../lib/run-label'

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

/**
 * Koşumun adı — kaydın TEK değiştirilebilir alanı (0.4.7-d).
 *
 * Etiket bir ölçüm değil, kaydın adı: hiçbir hash'e girmiyor ve hiçbir
 * verdict'i etkilemiyor. Bu yüzden sonradan düzeltilebilir olması meşru —
 * ölçülmüş bir alan için aynı şey kabul edilemezdi. `push` bir kaydı iki kez
 * almadığı için yüklenmiş bir koşumu adlandırmanın tek yolu bu.
 *
 * Kural tek yerde duruyor: burada yalnızca `label` yazılıyor. Denetim kaydı
 * eski ve yeni adı taşıyor, çünkü site ile ölçümü yapanın yerel kopyası bu tek
 * alanda ayrışabilir ve fark sonradan açıklanabilmeli.
 *
 * Şekil denetimi CLI'ınkiyle aynı fonksiyondan (`labelProblem`): iki yüzeyin
 * ayrı kuralları olsaydı biri diğerinin kabul ettiği etiketi reddederdi.
 */
export async function setRunLabel(runId: string, label: string): Promise<void> {
  const session = await requireAdmin('/admin/runs')
  const run = await prisma().run.findUnique({ where: { id: runId } })
  if (run === null) throw new AdminRuleError('no such run')

  const edit = labelEdit(run.label, label)
  if (edit.kind === 'error') throw new AdminRuleError(edit.message)
  if (edit.kind === 'unchanged') return
  const next = edit.value

  await prisma().run.update({ where: { id: runId }, data: { label: next } })
  await audit(session.user.id, next === null ? 'run.unlabel' : 'run.label', runId, {
    from: run.label,
    to: next,
  })
  revalidatePath('/admin/runs')
  revalidatePath(`/runs/${runId}`)
  revalidatePath('/')
}

/**
 * Vaka setinin görünürlüğü.
 *
 * Herkese açık yapmak, o vaka setinin bütün koşumlarını — istem metinleri,
 * araç argümanları, dosya yolları — oturumsuz ziyaretçiye açar. Bu yüzden
 * yönetici işlemi ve denetim kaydına yazılıyor.
 */
export async function setSuitePublic(suiteId: string, isPublic: boolean): Promise<void> {
  const session = await requireAdmin('/admin/suites')
  const suite = await prisma().suite.findUnique({ where: { id: suiteId } })
  if (suite === null) throw new AdminRuleError('no such case set')

  await prisma().suite.update({ where: { id: suiteId }, data: { public: isPublic } })
  await audit(session.user.id, isPublic ? 'suite.publish' : 'suite.unpublish', suiteId, {
    skill: suite.skill,
    version: suite.version,
  })
  revalidatePath('/admin/suites')
  revalidatePath('/')
}
