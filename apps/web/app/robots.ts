import type { MetadataRoute } from 'next'

/**
 * robots.txt.
 *
 * Yayın modunda kapalı olan bölümler zaten 404 dönüyor (middleware.ts); burada
 * ayrıca `disallow` edilmeleri, tarayıcıların o yolları hiç denememesi için.
 * İki katman aynı şeyi söylüyor ve biri kaldırılırsa diğeri duruyor.
 *
 * `AUTH_URL` sitenin dış adresi; sitemap ve host bilgisi ondan türetiliyor.
 * Yoksa (geliştirme) sitemap satırı yazılmıyor — yanlış bir mutlak adres
 * yazmaktansa hiç yazmamak doğru.
 */
/**
 * Çalışma zamanında üretiliyor, derlemede değil.
 *
 * Varsayılan olarak Next bu rotayı statik üretiyor ve `AUTH_URL` derleme
 * anında tanımlı olmadığı için `host` satırı boş kalıyordu — ilk dağıtımda
 * böyle çıktı. Ortamdan okunan her değer için aynı tuzak geçerli; ileride
 * sitemap eklenirse o da bu satıra ihtiyaç duyar.
 */
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const base = process.env['AUTH_URL']?.replace(/\/$/, '')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/settings', '/signin', '/compare', '/dev', '/api/'],
    },
    ...(base === undefined || base === '' ? {} : { host: base }),
  }
}
