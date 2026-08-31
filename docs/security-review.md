# Güvenlik İncelemesi — Faz 3.1

**Tarih:** 2026-09-01 · **Kapsam:** hosted katman (kimlik doğrulama, yetki,
yükleme ucu, yönetim paneli, veri sınırları) · **Sandbox:** 1.3'te ayrıca
incelendi, bkz. [sandbox-security.md](sandbox-security.md).

Bu bir kontrol listesi değil. Her bulgu ya bir istekle ya bir testle
gösterildi; kapatılan her bulgunun kapandığı aynı yolla doğrulandı. Kabul
edilen riskler sonda, gerekçeleriyle.

## Yöntem

- Kod okuması: `apps/web/lib/{auth,guard,tokens,rate-limit,runs}.ts`,
  `apps/web/app/api/runs/route.ts`, `apps/web/app/admin/*`,
  `packages/db/src/{client,store}.ts`.
- Canlı istekler: oturumsuz, oturumlu (USER) ve yönetici (ADMIN) üç kimlikle
  aynı adreslere gidildi; yükleme ucuna geçersiz, aşırı büyük ve yetkisiz
  gövdeler gönderildi.
- Testler: erişim kapsamı `packages/db/src/store.test.ts` içinde gerçek bir
  Postgres üzerinde sınandı.

---

## Bulgular

### H1 — Yüklenen her koşum herkese açıktı · **kapatıldı**

**Neydi.** `/runs/<id>`, `/suites/<skill>` ve `/compare` hiçbir yetki
denetimi yapmıyordu. Kimliği doğrulanmamış bir ziyaretçi, kimliği bilinen bir
koşumun tamamını okuyabiliyordu: istem metinleri, araç argümanları, yazılan
dosya yolları ve ajanın ürettiği metin. Koşum kaydında `ownerId` vardı ama
hiçbir sorgu ona bakmıyordu.

**Neden yüksek.** Kayıt, ölçülen skill'in ve onu ölçen ekibin iç bilgisini
taşıyor. Bir kurumsal kullanıcının yüklediği koşum, kimlik numarası
tahmin edilebilir olmasa da, bağlantıyı gören herkese açık demekti.

**Ne yapıldı.** Görünürlük sorgu katmanına indirildi:

```ts
type RunScope =
  | { kind: 'public' }                    // oturumsuz ziyaretçi
  | { kind: 'viewer'; userId: string }    // kendi koşumları + herkese açıklar
  | { kind: 'all' }                       // yalnızca ADMIN
```

`listRuns` ve `loadRun` kapsam almadan çağrılamıyor; filtre `where`'in içinde,
çağıranın elinde değil. Vaka setine `public` alanı eklendi
(`20260901000000_suite_visibility`), **varsayılan `false`**. Yayınlama ayrı bir
yönetici işlemi ve denetim kaydına yazılıyor.

**Doğrulama.** `store.test.ts` içinde beş test: sahip görür, başkası göremez,
oturumsuz göremez, yayınlanınca görünür olur, yönetici hepsini görür. Canlı:
gizli bir koşumun sayfası oturumsuz istekte **404**, vaka seti yayınlandıktan
sonra **200**.

### H2 — Yükleme ucunda gövde sınırı yoktu · **kapatıldı**

**Neydi.** `POST /api/runs` gövdeyi sınırsız okuyordu. Geçerli bir token'a
sahip tek bir istemci, birkaç yüz megabaytlık bir gövdeyle süreci belleğe
boğabilirdi.

**Ne yapıldı.** 8 MB üst sınır. Hem `content-length` beyanı hem okunan
gövdenin gerçek uzunluğu kontrol ediliyor — beyana tek başına güvenmek sınırı
etkisiz kılardı.

**Doğrulama.** 9 MB'lık bir gövde **413** ile reddedildi.

### M1 — Hata cevapları veritabanı ayrıntısı sızdırıyordu · **kapatıldı**

**Neydi.** Yükleme başarısız olduğunda `cause.message` doğrudan cevaba
yazılıyordu; Prisma'nın mesajları tablo ve sütun adlarını taşıyor.

**Ne yapıldı.** Dışarıya yalnızca bizim yazdığımız kural mesajları çıkıyor
(`SuiteNotStorableError`, vaka–suite uyuşmazlığı). Diğer her şey sunucu
günlüğüne yazılıp genel bir mesajla dönülüyor.

### M2 — Güvenlik başlıkları yoktu · **kapatıldı**

`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` eklendi;
`X-Powered-By` kapatıldı. Canlı cevapta doğrulandı.

### M3 — Yeni API token'ı yönlendirme parametresinde taşınıyordu · **kapatıldı**

**Neydi.** Token oluşturma önce `redirect('/settings/tokens?created=<token>')`
yapıyordu. Token böylece tarayıcı geçmişine, `Referer` başlığına ve ters
vekilin erişim günlüğüne düşerdi.

**Ne yapıldı.** Token sunucu eyleminin **dönüş değerinde** taşınıyor
(`useActionState`) ve yalnızca onu isteyen isteğin cevabında görünüyor.

### M4 — Giriş sonrası açık yönlendirme · **kapatıldı**

`?from=` parametresi doğrudan `redirectTo`'ya veriliyordu; `//evil.example`
gibi bir değer siteyi bir yönlendirme sıçrama tahtasına çevirirdi. Artık
yalnızca tek eğik çizgiyle başlayan site-içi yollar kabul ediliyor.

### M5 — Hesap sayımı (account enumeration) · **kapatılmadı, tasarım gereği yok**

Giriş hatası hangi alanın yanlış olduğunu söylemiyor; var olmayan e-posta ile
yanlış parola aynı cevabı veriyor. Kayıt ekranı olmadığı için ikinci bir
sayım yüzeyi de yok.

### L1 — Her token kullanımında yazma · **kabul edildi**

`identify()` doğrulanan her istekte `lastUsedAt` güncelliyor. Yükleme hacmi
düşük olduğu için maliyeti yok; kullanılmayan token'ı iptal edebilmek için
gereken bilgi bu.

---

## Doğrulanan davranışlar

| Kontrol | Sonuç |
|---|---|
| `/admin`, `/admin/*` oturumsuz | `/signin?from=/admin`'e yönlendi |
| `/admin` USER rolüyle | `/`'a yönlendi |
| `/settings/tokens` oturumsuz | `/signin?from=/settings/tokens`'a yönlendi |
| `/settings/tokens` USER rolüyle | açıldı — kendi token'ları |
| `POST /api/runs` token'sız | 401 |
| `POST /api/runs` uydurma token'la | 401 |
| `POST /api/runs` 9 MB gövdeyle | 413 |
| `POST /api/runs` bozuk JSON'la | 400, ayrıntı sızmadan |
| `POST /api/runs` geçersiz vaka setiyle | 400 + doğrulama sorunları |
| Aynı koşumu iki kez yükleme | 409, üzerine yazmıyor |
| Gizli koşum sayfası oturumsuz | 404 |
| Yayınlanmış koşum sayfası oturumsuz | 200 |
| Yönetici kendi rolünü düşürme | sunucuda reddediliyor, arayüzde düğme yok |
| Başkasının token'ını iptal etme | `updateMany` sahiplik koşuluyla eşleşmiyor |

---

## Kabul edilen riskler

**A1 — CSP `script-src 'unsafe-inline'`.** Next App Router sayfa verisini satır
içi script olarak gönderiyor; nonce'a geçmek her istekte koşan bir middleware
gerektiriyor ve o middleware kenar çalışma zamanında. Kalan yönergeler
(`connect-src 'self'`, `form-action 'self'`, `frame-ancestors 'none'`,
`object-src 'none'`) bir XSS'in veri taşıyabileceği yüzeyi daraltıyor. Nonce'a
geçiş, kenar-güvenli bir auth config bölünmesiyle birlikte ele alınacak.

**A2 — JWT oturumu sunucudan anında iptal edilemiyor.** Credentials
sağlayıcısının şartı (bkz. docs/decisions.md). Azaltma: `jwt` geri çağrısı her
istekte kullanıcının rolünü ve askı durumunu veritabanından tazeliyor; askıya
alınan kullanıcının token'ı bir sonraki istekte ölüyor. Kalan pencere tek bir
istek.

**A3 — Hız sınırı süreç içi.** `Map` tabanlı sabit pencere; birden çok örnek
koşulduğunda her örneğin kendi sayacı olur. Tek örnek için doğru, yatay ölçekte
Redis'e taşınmalı. Ayrıca sınır e-posta başına; IP başına sınır, ters vekilin
verdiği IP'ye güvenmeyi gerektiriyor ve o güven kurulmadan eklenirse sahte
başlıkla atlatılır.

**A4 — Sandbox sınırları.** 1.3'ten devreden A1 (dosya sistemi ve ağ sınırı
host izinlerine dayanıyor) ve A2 (disk/CPU kotası yok) hâlâ geçerli.

**A5 — `/dev/components` herkese açık.** Veri taşımıyor, yalnızca bileşen
numuneleri gösteriyor; numunelerdeki ölçümler zaten yayımlanmış dogfooding
koşumlarından. Üretim derlemesinde kapatmak için bir sebep görülmedi.

**A6 — E-posta doğrulama yok.** SMTP kimlik bilgisi yok
(docs/blockers.md). Hesaplar komut satırından açıldığı ve kayıt ekranı
olmadığı için doğrulanmamış e-posta ile hesap oluşturma yolu da yok.

---

## Sırların ele alınışı

- `.env` ve `.env.*` `.gitignore` kapsamında; `.env.example` bilerek dışarıda
  ve içindeki her değerin boş olduğu `tools/secrets.test.ts` ile denetleniyor.
- `.githooks/pre-commit` her commit'te aşamalı dosyaları tarıyor; kuralın
  gerçekten engellediği sahte bir token ile doğrulandı.
- Koşum kaydı yerel store'a yazılmadan önce `redact` ile maskeleniyor
  (`packages/core/src/redact.ts`, dokuz desen).
- API token'ları yalnızca SHA-256 özeti ve son dört karakteriyle saklanıyor.
- Parolalar Argon2id.
