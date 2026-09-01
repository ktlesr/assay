'use server'

import { prisma } from '@ktlsr/assay-db'
import { revalidatePath } from 'next/cache'
import { requireUser } from '../../../lib/guard'
import { mintToken } from '../../../lib/tokens'

/**
 * Token oluşturma ve iptal.
 *
 * Yeni token eylemin **dönüş değerinde** taşınıyor; bir yönlendirme
 * parametresine konsaydı tarayıcı geçmişine ve sunucu erişim günlüğüne
 * düşerdi. Token bir kez, yalnızca onu isteyen isteğin cevabında görünür.
 */

export interface MintResult {
  token?: string
  error?: string
}

export async function createToken(
  _previous: MintResult,
  formData: FormData,
): Promise<MintResult> {
  const owner = await requireUser('/settings/tokens')
  const name = String(formData.get('name') ?? '')
    .trim()
    .slice(0, 60)
  const minted = mintToken()
  await prisma().apiToken.create({
    data: {
      userId: owner.user.id,
      name: name === '' ? 'unnamed' : name,
      tokenHash: minted.tokenHash,
      lastFour: minted.lastFour,
    },
  })
  revalidatePath('/settings/tokens')
  return { token: minted.token }
}

export async function revokeToken(formData: FormData): Promise<void> {
  const owner = await requireUser('/settings/tokens')
  const id = String(formData.get('id') ?? '')
  // Sahiplik koşulu güncellemenin içinde: başkasının token'ı eşleşmez.
  await prisma().apiToken.updateMany({
    where: { id, userId: owner.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  revalidatePath('/settings/tokens')
}
