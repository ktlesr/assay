/**
 * Açılış doğrulaması.
 *
 * Eksik bir ortam değişkeniyle başlayan bir sunucu, hatayı ilk ziyaretçiye
 * gösterir. `AUTH_SECRET` yoksa oturumlar sessizce imzalanamaz, `DATABASE_URL`
 * yoksa her sayfa çöker. İkisi de dağıtımdan dakikalar sonra, kullanıcı
 * karşısında ortaya çıkar.
 *
 * Burada süreç başlarken duruyoruz: Dokploy sağlık kontrolünü geçemeyen
 * konteyneri yayına almaz ve eski sürüm ayakta kalır. Yanlış yapılandırılmış
 * bir sürümü yayına almaktansa dağıtımı düşürmek daha ucuz.
 *
 * Aynı gerekçe `docker-entrypoint.sh`'te de var: migration başarısızsa sunucu
 * başlamıyor (docs/deploy.md).
 */

/** Üretimde olmazsa olmazlar. */
const REQUIRED = [
  ['DATABASE_URL', 'Postgres bağlantı adresi'],
  ['AUTH_SECRET', 'oturum imzalama anahtarı — openssl rand -base64 32'],
  ['AUTH_URL', 'sitenin dış adresi, örn. https://assayctl.dev'],
] as const

export function register(): void {
  // Kenar çalışma zamanında ortam değişkenleri farklı taşınıyor; kontrol
  // yalnızca sunucu sürecinde anlamlı.
  if (process.env['NEXT_RUNTIME'] !== 'nodejs') return
  if (process.env.NODE_ENV !== 'production') return

  const missing = REQUIRED.filter(([name]) => {
    const value = process.env[name]
    return value === undefined || value.trim() === ''
  })

  if (missing.length > 0) {
    const lines = missing.map(([name, why]) => `  - ${name}: ${why}`).join('\n')
    throw new Error(
      `Eksik ortam değişkeni, sunucu başlatılmadı:\n${lines}\n` +
        `Değerler Dokploy'un ortam değişkenleri ekranına girilir (docs/deploy.md).`,
    )
  }

  const authUrl = process.env['AUTH_URL'] ?? ''
  if (authUrl.endsWith('/')) {
    throw new Error(
      `AUTH_URL sonunda eğik çizgi olmamalı: ${authUrl}\n` +
        `Eğik çizgi, OAuth geri dönüş adresinin sağlayıcıdaki kayıtla eşleşmemesine yol açar.`,
    )
  }
  if (!authUrl.startsWith('https://') && !authUrl.startsWith('http://localhost')) {
    throw new Error(
      `AUTH_URL https olmalı: ${authUrl}\n` +
        `Uygulama HSTS gönderiyor; HTTPS olmayan bir dış adres oturum çerezini kırar.`,
    )
  }
}
