import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
   * `@assay/ui` kaynaktan derleniyor, derlenmiş `dist`'ten değil.
   *
   * Sebep bir hata: Tailwind kaynağı tarıyordu ama çalışma zamanı eski `dist`i
   * kullanıyordu; üretilen sınıf adı ile CSS'teki kural ayrıştı ve iz
   * görüntüleyicinin ızgarası sessizce çöktü. Tek kaynak = tek gerçek.
   */
  transpilePackages: ['@assay/ui'],
}

export default nextConfig
