import { isConfigured, prisma } from '@ktlsr/assay-db'
import { hash } from '@node-rs/argon2'

/**
 * İlk yöneticiyi açar. Tek seferlik kurulum ucu.
 *
 * Kayıt ekranı yok (docs/decisions.md): ilk yönetici bir insanın kasıtlı
 * eylemiyle doğar. O eylem eskiden `tools/create-user.mjs` idi ama o yol
 * üretimde kapalı çıktı — dosya imajda yok ve imaja kopyalandığında da
 * `@ktlsr/assay-db` `/app`ten çözülemiyor (standalone çıktısı workspace
 * paketlerini üst düzeyde açmıyor). İkisi de dağıtımda kanıtlandı.
 *
 * Rota çalışıyor çünkü Next onu sunucu çalışma zamanı için derliyor ve
 * bağımlılıkları oraya izliyor — `/api/runs` da tam olarak aynı paketi
 * aynı şekilde kullanıyor.
 *
 * Kullanım:
 *
 *   1. `ASSAY_BOOTSTRAP_TOKEN` ortam değişkenini rastgele bir değere kur.
 *   2. Yeniden dağıt.
 *   3. Bir kez çağır:
 *
 *      curl -X POST https://<alan>/api/bootstrap \
 *        -H "Authorization: Bearer $ASSAY_BOOTSTRAP_TOKEN" \
 *        -H "Content-Type: application/json" \
 *        -d '{"email":"sen@ornek.com","password":"en-az-12-karakter"}'
 *
 *   4. `ASSAY_BOOTSTRAP_TOKEN`ı sil ve yeniden dağıt.
 *
 * Üç kilit birden: değişken yoksa rota **yok** (404), token eşleşmezse 401,
 * ve zaten bir ADMIN varsa 409. Yani açık unutulsa bile ikinci bir yönetici
 * açılamıyor.
 *
 * `DELETE` aynı ucu geri alıyor: yanlış açılmış ilk yöneticiyi siler, ama
 * yalnızca tek yönetici varken. Admin paneli kullanıcı silemiyor ve son
 * yöneticiyi askıya almayı da reddediyor, yani yanlış bir ilk hesap oradan
 * düzeltilemiyordu.
 */
/** Ortak kapı: token yoksa uç yok, eşleşmezse yetkisiz. */
function authorize(request: Request): Response | null {
  const secret = process.env['ASSAY_BOOTSTRAP_TOKEN']

  // Değişken yoksa uç hiç yokmuş gibi davranır: varlığını sızdırmıyoruz.
  if (secret === undefined || secret.trim() === '') {
    return new Response('Not found', { status: 404 })
  }
  if ((request.headers.get('authorization') ?? '') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!isConfigured()) {
    return Response.json({ error: 'database is not configured' }, { status: 503 })
  }
  return null
}

export async function POST(request: Request): Promise<Response> {
  const denied = authorize(request)
  if (denied !== null) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'body must be JSON' }, { status: 400 })
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return Response.json({ error: 'email and password are required' }, { status: 400 })
  }
  if (password.length < 12) {
    return Response.json(
      { error: 'password must be at least 12 characters' },
      { status: 400 },
    )
  }

  const db = prisma()

  // Tek seferlik: bir yönetici varsa bu uç kapanır. Açık unutulan bir
  // değişkenin ikinci bir yönetici açmasının yolu yok.
  const existingAdmin = await db.user.findFirst({ where: { role: 'ADMIN' } })
  if (existingAdmin !== null) {
    return Response.json(
      { error: 'an admin already exists; remove ASSAY_BOOTSTRAP_TOKEN' },
      { status: 409 },
    )
  }

  const user = await db.user.create({
    data: {
      email: email.trim().toLowerCase(),
      passwordHash: await hash(password),
      role: 'ADMIN',
    },
  })

  return Response.json({ email: user.email, role: user.role }, { status: 201 })
}

/**
 * Bootstrap'ı geri alır: yanlış açılmış ilk yöneticiyi siler.
 *
 * Kapsam bilerek dar — yalnızca **tek yönetici varken** çalışır. Sebep:
 * bu ucun işi kurulumu geri almak, çalışan bir ekipten yönetici budamak
 * değil. Birden çok yönetici varsa admin paneli kullanılır.
 *
 *   curl -X DELETE https://<alan>/api/bootstrap \
 *     -H "Authorization: Bearer $ASSAY_BOOTSTRAP_TOKEN" \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"yanlis@ornek.com"}'
 */
export async function DELETE(request: Request): Promise<Response> {
  const denied = authorize(request)
  if (denied !== null) return denied

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'body must be JSON' }, { status: 400 })
  }

  const { email } = (body ?? {}) as { email?: unknown }
  if (typeof email !== 'string' || email.trim() === '') {
    return Response.json({ error: 'email is required' }, { status: 400 })
  }

  const db = prisma()
  const target = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  if (target === null) {
    return Response.json({ error: 'no such user' }, { status: 404 })
  }

  const admins = await db.user.count({ where: { role: 'ADMIN' } })
  if (admins > 1) {
    return Response.json(
      { error: 'more than one admin exists; use the admin panel' },
      { status: 409 },
    )
  }

  await db.user.delete({ where: { id: target.id } })
  return Response.json({ deleted: target.email }, { status: 200 })
}
