# Kurulum — Faz 3.3

Hosted katman tek bir konteyner ve bir Postgres. Ölçüm burada koşmuyor; SDK
kullanıcının makinesinde veya CI'ında koşuyor ve kaydı `assay push` ile
buraya yolluyor. Bu yüzden sunucunun ajan çalıştırma ihtiyacı yok: küçük bir
VPS yeter.

## Gerekli sırlar

Hiçbiri repoda yok ve uydurulmaz. `.env.example` şablonu; gerçek değerler
`.env` dosyasına ya da Dokploy'un ortam değişkenleri ekranına girilir.

| Değişken | Ne | Nasıl üretilir |
|---|---|---|
| `DATABASE_URL` | Postgres adresi | compose kullanılıyorsa otomatik kurulur |
| `POSTGRES_PASSWORD` | Postgres parolası | `openssl rand -base64 24` |
| `AUTH_SECRET` | Oturum imzalama anahtarı | `openssl rand -base64 32` |
| `AUTH_URL` | Sitenin dış adresi | `https://<alan adı>` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google ile giriş | isteğe bağlı; boşsa sağlayıcı gösterilmez |
| `ASSAY_PUBLIC_SITE` | Yayın modu | `true` iken uygulamanın yarısı kapanır (aşağıya bak) |

Açılışta `docker-entrypoint.sh` ilk üçünü denetliyor ve eksikse **konteyner
başlamıyor**: `exit 1`. Ayrıca `AUTH_URL` sonunda eğik çizgi varsa veya https
değilse de duruyor. Yanlış yapılandırılmış bir sürümü yayına almaktansa
dağıtımı düşürmek daha ucuz; Dokploy o sırada eski sürümü ayakta tutuyor.

`DATABASE_POOL_MAX` boş bırakılır. Yalnızca geliştirmedeki PGlite soketiyle
koşarken `1` olmalı.

## Yayın modu — yalnızca tanıtım ve yayımlanmış ölçümler

`ASSAY_PUBLIC_SITE=true` iken şu rotalar 404 döner: `/admin`, `/settings`,
`/signin`, `/compare`, `/dev`, `/api/auth`. Landing'deki giriş düğmesi ve
başlıktaki oturum bağlantısı da gizlenir.

Açık kalanlar: `/` (tanıtım), `/runs` ve `/suites` (yalnızca `public: true`
vaka setleri), `/api/health`, `/api/runs` (token ile korunuyor — kapatılırsa
siteye yeni ölçüm yüklenemez).

Sebep ürünle ilgili: assayctl.dev'e gelen kişi bir SaaS'a değil, bir ölçüm
aracının tanıtımına ve gerçek bir koşum çıktısına bakıyor. Boş bir admin
paneline veya kimse için çalışmayan bir giriş ekranına rastlamamalı.

### İki aşamalı ilk kurulum

Yayın modunda giriş kapalı olduğu için yönetici ve token üretimi önce yapılır:

1. `ASSAY_PUBLIC_SITE` **boş** bırakılarak dağıt.
2. Yöneticiyi aç, arayüzden bir API token üret.
3. Yerelden referans ölçümü yükle: `assay push --suite ./suite.yaml`.
4. O vaka setini **public** işaretle (admin > suites).
5. `ASSAY_PUBLIC_SITE=true` yap ve yeniden dağıt.

Sonraki ölçümler `/api/runs` açık olduğu için yayın modunda da yüklenebilir.

## Konteyner

`Dockerfile` üç aşamalı. Koşum aşaması pnpm ağacını değil Next'in standalone
çıktısını taşıyor, kök olarak koşmuyor ve `/api/health` üzerinden sağlık
kontrolü yapıyor. Sağlık kontrolü veritabanına gerçekten bir sorgu atıyor:
"süreç ayakta" ile "uygulama çalışıyor" aynı şey değil.

```
docker compose up -d --build
```

Açılışta `docker-entrypoint.sh` bekleyen migration'ları uyguluyor
(`prisma migrate deploy`). Migration başarısızsa sunucu **başlamıyor** —
yarım şemayla açılan bir örnek, ölçüm kaydını sessizce yarım saklardı.

## Dokploy

1. **Yeni proje → Compose.** Depoyu bağla, dal `main`, dosya
   `docker-compose.yml`.
2. **Ortam değişkenleri**: yukarıdaki tabloyu gir. `AUTH_URL` alan adının
   tamamı olmalı, sonunda eğik çizgi olmadan.
3. **Alan adı**: `web` servisi, port `3000`. TLS'i Dokploy'un Traefik'i
   üstlenir; uygulama HSTS başlığını zaten gönderiyor, bu yüzden alan adı
   HTTPS'e bağlanmadan yayına alınmamalı.
4. **Kalıcı hacim**: `pgdata`. Yeniden kurulumda silinmemeli.
5. **Sağlık kontrolü**: `/api/health`, 200 bekleniyor.
6. İlk dağıtımdan sonra ilk yöneticiyi aç:

```
docker compose exec web node tools/create-user.mjs <e-posta> <parola> ADMIN
```

Kayıt ekranı yok (bkz. docs/decisions.md); ilk yönetici bu komutla doğar.

## Yedekleme

Yedeklenecek tek şey Postgres. Koşum kayıtları ayrıca kullanıcının kendi
makinesinde `.assay/runs/` altında duruyor — hosted taraf kaybolursa ölçümler
kaybolmaz, yalnızca geçmiş ve karşılaştırma kaybolur. Bu ayrım kasıtlı
(docs/product.md).

```
docker compose exec db pg_dump -U assay assay | gzip > assay-$(date +%F).sql.gz
```

## Yayına almadan önce

- [ ] `AUTH_SECRET` üretildi ve yalnızca sunucuda duruyor
- [ ] Alan adı HTTPS'te; HSTS başlığı gönderiliyor
- [ ] İlk yönetici hesabı açıldı, parolası 12 karakterden uzun
- [ ] `/api/health` 200 dönüyor
- [ ] Bir koşum `assay push` ile yüklendi ve arayüzde göründü
- [ ] Vaka setleri gizli; yalnızca kasten yayımlananlar `public`
- [ ] Yedekleme komutu bir kez elle koşturuldu ve dosya geri yüklendi
- [ ] `ASSAY_PUBLIC_SITE=true` ve kapalı rotalar gerçekten 404 dönüyor
- [ ] `robots.txt` alan adını doğru gösteriyor
- [ ] Sayfa koyu ve açık temada açılıyor, mobilde yatay kaydırma yok
- [ ] Google OAuth geri dönüş adresi konsola eklendi:
      `https://<alan adı>/api/auth/callback/google`

## Port: host'a yayınlanmıyor

`web` servisi 3000'i **host'a bağlamıyor**, yalnızca `expose` ediyor.
Dokploy'un Traefik'i konteynere Docker ağı üzerinden ulaşıyor; host portu hem
gereksiz hem çakışma kaynağı.

İlk dağıtım tam bu yüzden düştü:

```
Bind for 0.0.0.0:3000 failed: port is already allocated
```

Sunucuda 3000'i tutan başka bir şey vardı. Alan adını Dokploy'da bağlarken
yine `web` servisi ve port `3000` seçilir — bu, konteynerin içindeki port.

Compose'u Dokploy'suz tek başına koşturacaksan `docker-compose.yml` içindeki
yorumlu `ports:` satırlarını aç.

## Doğrulanmış olan

**Konteyner imajı derlendi** (2026-09-01, ilk dağıtım denemesi). Prisma
istemcisi üretildi, altı paket derlendi, Next standalone çıktısı ve middleware
(34.4 kB) oluştu, imaj katmanları dışa aktarıldı. Derleme tarafında açık kalan
bir bilinmez yok.

Aynı koşumda bir uyarı görüldü ve kapatıldı: Prisma OpenSSL sürümünü tespit
edemiyor ve tahmine düşüyordu. `Dockerfile` artık `openssl` ve
`ca-certificates` kuruyor — açılışta `migrate deploy` aynı motoru kullandığı
için bunu tahmine bırakmak doğru değildi.
