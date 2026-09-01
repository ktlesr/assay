import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

/**
 * Güvenlik başlıkları.
 *
 * CSP `script-src` içinde `'unsafe-inline'` var: Next App Router sayfa
 * verisini satır içi script olarak gönderiyor ve nonce'a geçmek middleware
 * gerektiriyor. Bunu 3.1'de kabul edilen risk olarak kaydettik
 * (docs/security-review.md); geri kalan yönergeler yine de XSS'in erişebileceği
 * yüzeyi daraltıyor — dışarı veri taşıyacak bir uç yok, sayfa çerçevelenemiyor,
 * form başka bir yere gönderilemiyor.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
  "connect-src 'self'",
].join('; ')

const HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  /*
   * `@ktlsr/assay-ui` kaynaktan derleniyor, derlenmiş `dist`'ten değil.
   *
   * Sebep bir hata: Tailwind kaynağı tarıyordu ama çalışma zamanı eski `dist`i
   * kullanıyordu; üretilen sınıf adı ile CSS'teki kural ayrıştı ve iz
   * görüntüleyicinin ızgarası sessizce çöktü. Tek kaynak = tek gerçek.
   */
  transpilePackages: ['@ktlsr/assay-ui'],

  /*
   * Üretim çıktısı bağımsız (standalone): `node server.js` ile koşan, yalnızca
   * gerçekten kullanılan node_modules'ü taşıyan bir dizin. Konteynerde bütün
   * pnpm ağacını taşımanın alternatifi bu.
   *
   * Yalnızca `NEXT_STANDALONE=1` iken açık. Sebep bir platform kısıtı: standalone
   * çıktısı sembolik bağ kuruyor ve Windows'ta bu yükseltilmiş yetki istiyor
   * (EPERM). Bayrak olmadan geliştirme makinesinde `pnpm build` kırılırdı.
   * Konteyner ve CI bayrağı veriyor (docs/deploy.md).
   */
  ...(process.env['NEXT_STANDALONE'] === '1'
    ? {
        output: 'standalone' as const,
        // Monorepo kökü: izleme buradan başlar, yoksa bağımlılıklar eksik kopyalanır.
        outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
      }
    : {}),

  // Sunucu sürümünü dışarıya söylememenin bedeli yok.
  poweredByHeader: false,

  headers: async () => [{ source: '/:path*', headers: HEADERS }],
}

export default nextConfig
