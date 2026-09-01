import { createHash, randomBytes } from 'node:crypto'
import { isConfigured, prisma } from '@ktlsr/assay-db'

/**
 * API token'ları — `assay push` bunlarla konuşur.
 *
 * Token saklanmaz, yalnızca SHA-256 özeti ve son dört karakteri saklanır.
 * Veritabanı sızarsa kimsenin koşumu yüklenemez; kullanıcı da token'ını
 * listede tanıyabilir.
 *
 * Parola gibi Argon2 kullanılmıyor: token 32 bayt rastgele, sözlük saldırısına
 * konu değil ve her istekte yavaş bir özet fonksiyonu koşturmak, ingest'i
 * kendi eliyle yavaşlatmak olurdu. Arama sabit zamanlı karşılaştırmaya değil,
 * özetin benzersiz indeksine dayanıyor.
 */

const PREFIX = 'assay_'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function mintToken(): { token: string; tokenHash: string; lastFour: string } {
  const token = PREFIX + randomBytes(32).toString('base64url')
  return { token, tokenHash: hashToken(token), lastFour: token.slice(-4) }
}

export interface TokenIdentity {
  userId: string
  tokenId: string
}

/**
 * `Authorization: Bearer <token>` başlığından kimlik.
 *
 * Askıya alınmış kullanıcı ve iptal edilmiş token reddedilir. Doğrulanan token
 * için `lastUsedAt` güncellenir — kullanılmayan bir token'ı iptal etmek, hangi
 * token'ın kullanıldığını bilmeden yapılamaz.
 */
export async function identify(request: Request): Promise<TokenIdentity | null> {
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (token === '' || !token.startsWith(PREFIX) || !isConfigured()) return null

  const db = prisma()
  const row = await db.apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, suspendedAt: true } } },
  })
  if (row === null || row.revokedAt !== null || row.user.suspendedAt !== null) return null

  await db.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
  return { userId: row.user.id, tokenId: row.id }
}
