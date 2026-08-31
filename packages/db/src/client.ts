/**
 * Veritabanı istemcisi.
 *
 * Tek kural: adres yoksa istemci de yoktur. `DATABASE_URL` tanımlı değilken
 * boş bir istemci döndürmek, "veri yok" ile "veritabanı yok"u aynı şeye
 * çevirirdi — ekranda ikisi farklı görünmek zorunda (değişmez #1'in ruhu:
 * ölçemediğini ölçmüş gibi gösterme). Bu yüzden `configured` ayrı bir soru.
 */

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/client/client.js'

export { PrismaClient }

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('DATABASE_URL is not set, so no database connection can be opened')
    this.name = 'DatabaseNotConfiguredError'
  }
}

export function databaseUrl(): string | undefined {
  const url = process.env['DATABASE_URL']
  return url === undefined || url === '' ? undefined : url
}

export function isConfigured(): boolean {
  return databaseUrl() !== undefined
}

/**
 * Süreç başına tek istemci.
 *
 * Next dev sunucusu modülleri yeniden yüklüyor; `globalThis` üzerinde tutmazsak
 * her yeniden yüklemede yeni bir bağlantı havuzu açılır ve bağlantılar tükenir.
 */
const globalForPrisma = globalThis as unknown as { assayPrisma?: PrismaClient }

export function prisma(): PrismaClient {
  const url = databaseUrl()
  if (url === undefined) throw new DatabaseNotConfiguredError()
  const existing = globalForPrisma.assayPrisma
  if (existing !== undefined) return existing
  // Prisma 7 sürücü adaptörü istiyor; bağlantı havuzu `pg` tarafında.
  // Geliştirmedeki PGlite soketi tek bağlantı konuşuyor; DATABASE_POOL_MAX=1
  // orada havuzu sabitliyor. Üretimde değişken boş kalır ve varsayılan geçerli.
  const max = Number(process.env['DATABASE_POOL_MAX'] ?? '')
  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url,
      ...(Number.isInteger(max) && max > 0 ? { max } : {}),
    }),
  })
  globalForPrisma.assayPrisma = client
  return client
}
