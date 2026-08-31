import { isConfigured, prisma } from '@assay/db'

/**
 * Sağlık kontrolü.
 *
 * "Süreç ayakta" ile "uygulama çalışıyor" aynı şey değil: veritabanına
 * ulaşamayan bir örnek her isteğe hata döner ama porta cevap verir. Bu uç
 * veritabanına gerçekten bir sorgu atıyor.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  if (!isConfigured()) {
    return Response.json({ status: 'degraded', database: 'not configured' }, { status: 503 })
  }
  try {
    await prisma().$queryRaw`select 1`
    return Response.json({ status: 'ok', database: 'reachable' })
  } catch {
    return Response.json({ status: 'degraded', database: 'unreachable' }, { status: 503 })
  }
}
