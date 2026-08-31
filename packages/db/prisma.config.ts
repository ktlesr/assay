/**
 * Prisma 7 yapılandırması.
 *
 * Bağlantı adresi artık şemada değil burada. Değer ortamdan gelir; kod içinde
 * varsayılan bir adres yok — yanlışlıkla başka bir veritabanına migration
 * uygulamanın yolu kapalı.
 */
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] ?? '' },
})
