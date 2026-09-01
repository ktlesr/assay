/**
 * Geliştirme veritabanı — süreç içinde Postgres.
 *
 * `@ktlsr/assay-db` gerçek bir Postgres istiyor; geliştirme makinesinde bir sunucu
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

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'

const PORT = Number(process.env.ASSAY_DEV_PG_PORT ?? 5433)
const DATA_DIR = fileURLToPath(new URL('../.assay/pgdata', import.meta.url))
const MIGRATIONS = fileURLToPath(
  new URL('../packages/db/prisma/migrations', import.meta.url),
)

const db = await PGlite.create({ dataDir: DATA_DIR })

// Uygulanan migration'lar kendi tablosunda tutuluyor; sunucu her açılışta
// yalnızca eksikleri uyguluyor. Prisma'nın migrate komutu gölge veritabanı
// istiyor, PGlite onu vermiyor — geliştirme için bu kadarı yeterli.
await db.exec(
  `create table if not exists "_assay_migrations" (name text primary key, applied_at timestamptz not null default now())`,
)

const names = readdirSync(MIGRATIONS)
  .filter((name) => !name.startsWith('.'))
  .sort()

// Tablo yokken kurulmuş bir veritabanında ilk migration zaten uygulanmıştır;
// yeniden koşturmak hata verirdi.
const existing = await db.query(
  `select 1 from information_schema.tables where table_name = 'Run' limit 1`,
)
if (existing.rows.length > 0) {
  await db.query(
    `insert into "_assay_migrations" (name) values ($1) on conflict do nothing`,
    [names[0]],
  )
}

const applied = new Set(
  (await db.query(`select name from "_assay_migrations"`)).rows.map((row) => row.name),
)
for (const name of names) {
  if (applied.has(name)) continue
  await db.exec(readFileSync(join(MIGRATIONS, name, 'migration.sql'), 'utf8'))
  await db.query(`insert into "_assay_migrations" (name) values ($1)`, [name])
  process.stdout.write(`applied ${name}\n`)
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
