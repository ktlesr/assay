/**
 * Hesap oluşturma / rol değiştirme.
 *
 * Kayıt ekranı yok: Assay'in hosted tarafı davetle açılıyor ve ilk yönetici
 * bir insanın komut çalıştırmasıyla doğuyor. Bu, "ilk kayıt olan yönetici
 * olur" kestirmesinin açtığı yarış kapısını kapatıyor.
 *
 *   node tools/create-user.mjs <email> <password> [USER|ADMIN]
 *
 * Parola argümanda geçiyor; kabuk geçmişine düşer. Üretimde tek seferlik davet
 * bağlantısı gelene kadar bu yalnızca kurulum aracıdır.
 */

import { prisma } from '@assay/db'
import { hash } from '@node-rs/argon2'

const [email, password, role = 'USER'] = process.argv.slice(2)

if (email === undefined || password === undefined) {
  process.stderr.write('usage: node tools/create-user.mjs <email> <password> [USER|ADMIN]\n')
  process.exit(2)
}
if (role !== 'USER' && role !== 'ADMIN') {
  process.stderr.write('role must be USER or ADMIN\n')
  process.exit(2)
}
if (password.length < 12) {
  process.stderr.write('password must be at least 12 characters\n')
  process.exit(2)
}

const db = prisma()
const passwordHash = await hash(password)
const user = await db.user.upsert({
  where: { email: email.toLowerCase() },
  update: { passwordHash, role },
  create: { email: email.toLowerCase(), passwordHash, role },
})

process.stdout.write(`${user.email} — ${user.role} (${user.id})\n`)
await db.$disconnect()
