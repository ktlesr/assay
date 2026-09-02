import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Yayın modu: yalnızca tanıtım sayfası ve yayımlanmış ölçümler.
 *
 * `ASSAY_PUBLIC_SITE=true` iken uygulamanın yarısı kapatılır. Sebep ürünle
 * ilgili: assayctl.dev'e gelen kişi bir SaaS'a değil, bir ölçüm aracının
 * tanıtımına ve gerçek bir koşum çıktısına bakıyor. Yarım kalmış bir
 * dashboard'a, boş bir admin paneline veya kimse için çalışmayan bir giriş
 * ekranına rastlamamalı.
 *
 * Kapatma yol eşleşmesiyle, kimlik doğrulamayla değil: bu middleware kenar
 * çalışma zamanında koşuyor ve orada Prisma yok (docs/decisions.md — RBAC
 * bilerek layout katmanında). Yol eşleşmesi hiçbir şeye bağlı değil, bu yüzden
 * sessizce bozulamaz.
 *
 * `/api/runs` KAPALI DEĞİL: token ile korunuyor ve kapatılırsa siteye yeni
 * ölçüm yüklenemez. `/runs` ve `/suites` de açık, ama sorgu katmanı oturumsuz
 * ziyaretçiye yalnızca `public: true` vaka setlerini veriyor (RunScope).
 */
const CLOSED_IN_PUBLIC_MODE = [
  /^\/admin(\/|$)/,
  /^\/settings(\/|$)/,
  /^\/signin(\/|$)/,
  /^\/compare(\/|$)/,
  /^\/dev(\/|$)/,
  /^\/api\/auth(\/|$)/,
  // Kurulum ucu: yayın modunda hiç var olmamalı.
  /^\/api\/bootstrap(\/|$)/,
]

export function middleware(request: NextRequest) {
  if (process.env['ASSAY_PUBLIC_SITE'] !== 'true') return NextResponse.next()

  const { pathname } = request.nextUrl
  if (!CLOSED_IN_PUBLIC_MODE.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next()
  }

  // Yönlendirme değil 404: bu dağıtımda o rota gerçekten yok. Yönlendirme,
  // olmayan bir şeyin var olduğunu ima ederdi.
  //
  // Boş gövdeli bir 404 yerine uygulamanın kendi `not-found.tsx`'i render
  // ediliyor: ziyaretçi tarayıcının çıplak hata sayfasını değil, sitenin
  // kendi dilinde bir sayfa görüyor. `rewrite` durum kodunu 404 bırakıyor.
  const notFound = request.nextUrl.clone()
  notFound.pathname = '/_not-found'
  return NextResponse.rewrite(notFound, { status: 404 })
}

export const config = {
  // Statik varlıklar ve Next'in kendi yolları eşleşmenin dışında.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
