import { prisma } from '@ktlsr/assay-db'
import { hash } from '@node-rs/argon2'

/**
 * İlk yöneticiyi ortam değişkeninden açar.
 *
 * Kayıt ekranı yok (docs/decisions.md): ilk yönetici bir insanın kasıtlı
 * eylemiyle doğar, "ilk kayıt olan yönetici olur" yarışıyla değil. O eylem
 * eskiden `tools/create-user.mjs` idi; ama o dosya üretim imajında yok ve
 * workspace paketlerini import ettiği için konteynerde çözülemiyor. İlk
 * dağıtımda bu fark edildi.
 *
 * Bunun yerine bootstrap sunucunun kendi sürecinde koşuyor: `@ktlsr/assay-db`
 * ve argon2 zaten uygulamanın bağımlılıkları, dolayısıyla modül çözümü
 * garantili.
 *
 * Davranış kasıtlı olarak dar:
 *
 * - Yalnızca iki değişken de doluysa çalışır.
 * - Kullanıcı zaten varsa **hiçbir şey yapmaz** — parolayı sıfırlamaz.
 *   Her yeniden başlatmada parolayı ezmek, kullanıcının kendi değiştirdiği
 *   parolayı sessizce geri alırdı.
 * - Parola hiçbir zaman loglanmaz.
 *
 * Hesap açıldıktan sonra iki değişken Dokploy'dan silinmeli.
 */
export async function bootstrapAdmin(): Promise<void> {
  const email = process.env['ASSAY_BOOTSTRAP_ADMIN_EMAIL']?.trim().toLowerCase()
  const password = process.env['ASSAY_BOOTSTRAP_ADMIN_PASSWORD']

  if (email === undefined || email === '' || password === undefined || password === '') {
    return
  }

  if (password.length < 12) {
    console.error(
      'bootstrap: ASSAY_BOOTSTRAP_ADMIN_PASSWORD en az 12 karakter olmalı; hesap açılmadı.',
    )
    return
  }

  try {
    const db = prisma()
    const existing = await db.user.findUnique({ where: { email } })

    if (existing !== null) {
      console.log(`bootstrap: ${email} zaten var (${existing.role}); değişiklik yapılmadı.`)
      return
    }

    const user = await db.user.create({
      data: { email, passwordHash: await hash(password), role: 'ADMIN' },
    })
    console.log(
      `bootstrap: yönetici açıldı — ${user.email}. ` +
        'ASSAY_BOOTSTRAP_ADMIN_* değişkenlerini artık silebilirsiniz.',
    )
  } catch (cause) {
    // Bootstrap sunucuyu düşürmemeli: veritabanı bir an ulaşılamazsa
    // uygulamanın kendisi yine de ayağa kalksın, hesap sonraki açılışta
    // oluşsun.
    const message = cause instanceof Error ? cause.message : String(cause)
    console.error(`bootstrap: yönetici açılamadı — ${message}`)
  }
}
