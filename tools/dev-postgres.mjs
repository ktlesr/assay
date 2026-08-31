/**
 * Geliştirme veritabanı — süreç içinde Postgres.
 *
 * `@assay/db` gerçek bir Postgres istiyor; geliştirme makinesinde bir sunucu
 * kurmak veya Docker çalıştırmak bir kuruluma bağımlılık ekler. PGlite,
 * Postgres'in kendisini WASM olarak koşturuyor ve `pglite-socket` onu
 * Postgres tel protokolüyle bir TCP portuna açıyor — Prisma farkı görmüyor.
 *
 * Bu bir üretim veritabanı değil, tek süreçli bir geliştirme örneği. Üretimde
 * `DATABASE_URL` gerçek bir Postgres'i gösterir.
 *
 *   node tools/dev-postgres.mjs
 *   DATABASE_URL=postgres://postgres@127.0.0.1:5433/postgres
 *
 * Veri `.assay/pgdata` altında kalıcı; `.gitignore` kapsamında.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

const PORT = Number(process.env.ASSAY_DEV_PG_PORT ?? 5433)
const DATA_DIR = fileURLToPath(new URL('../.assay/pgdata', import.meta.url))
const MIGRATION = fileURLToPath(
  new URL('../packages/db/prisma/migrations/20260831000000_init/migration.sql', import.meta.url),
)

const db = await PGlite.create({ dataDir: DATA_DIR })

// Migration'ı her açılışta uygulamak yerine bir kez: tablolar duruyorsa geç.
const { rows } = await db.query(
  `select 1 from information_schema.tables where table_name = 'Run' limit 1`,
)
if (rows.length === 0) {
  await db.exec(readFileSync(MIGRATION, 'utf8'))
  process.stdout.write('schema applied\n')
}

const server = new PGLiteSocketServer({ db, port: PORT, host: '127.0.0.1' })
await server.start()
process.stdout.write(
  `dev postgres listening on postgres://postgres@127.0.0.1:${PORT}/postgres\n`,
)

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await server.stop()
    await db.close()
    process.exit(0)
  })
}
