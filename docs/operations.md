# İşletim

Yayın hattının bakımı. Süreç ve gerekçe [releasing.md](releasing.md)'de; burası
düzenli olarak yapılması gereken işler ve bir şey bozulduğunda bakılacak yer.

---

## NPM_TOKEN yenileme

**Bu token en fazla 90 gün yaşar ve sessizce ölür.** Süresi dolduğunda depoda
hiçbir şey değişmez; yalnızca bir sonraki yayın denemesi düşer. Yenilemeyi
takvime koy.

| | |
|---|---|
| Nerede | GitHub repo secret: `NPM_TOKEN` |
| Tür | npm **Granular Access Token** |
| Ömür | en fazla 90 gün (yazma izinli tokenlar için npm'in üst sınırı) |
| Kim üretebilir | `@ktlsr` scope'una yazma yetkisi olan npm hesabı |

### Neden 90 gün, neden başka tür yok

Kasım 2025'te npm klasik ("Automation" / "Publish") tokenlarının üretimini
kapattı ve mevcut olanları iptal etti; artık yalnızca granular access token
var. Aynı değişiklikle yazma izinli tokenların ömrü en fazla 90 günle
sınırlandı. Gerekçe tedarik zinciri saldırıları: uzun ömürlü bir token
sızdığında açık kalma penceresi de uzun oluyor.

Yani 90 gün bir tercih değil, tavan. "Süresiz token üret" seçeneği yok.

### Yenileme adımları

1. **npmjs.com > profil menüsü > Access Tokens**
2. **Generate New Token > Granular Access Token**
3. Alanlar:
   - **Name** — `assay-ci` gibi ayırt edici bir ad. Hangi tokenın nerede
     kullanıldığını sonradan bilmenin tek yolu bu.
   - **Expiration** — 90 gün (izin verilen en uzun süre).
   - **Packages and scopes** — *Only select packages and scopes* seç, sonra
     `@ktlsr/assay`, `@ktlsr/assay-core`, `@ktlsr/assay-runner`,
     `@ktlsr/assay-adapters`. İzin: **Read and write**.

     Scope'un tamamına yetki vermek yerine dört paketi tek tek seçmek kasıtlı:
     token sızarsa yazılabilecek yer bu dördüyle sınırlı kalır. İleride
     `@ktlsr` altına ilgisiz bir paket eklenirse bu token ona dokunamaz.
   - **Organizations** — gerekmiyor, boş bırak.
4. **Generate token.** Değer bir daha gösterilmez; hemen kopyala.
5. GitHub > repo > **Settings > Secrets and variables > Actions** >
   `NPM_TOKEN` > **Update secret**. (Yeni bir secret ekleme — aynısını
   güncelle, yoksa iş akışı eskisini okumaya devam eder.)
6. Eski tokenı npmjs.com'dan **sil**. Süresi dolacak diye bırakma; iki geçerli
   token, hangisinin nerede olduğunu bilmemek demek.
7. Doğrula: repoya boş bir commit at ve Release iş akışının
   *"npm kimlik doğrulaması geçerli mi"* adımının yeşil olduğuna bak.

   ```
   git commit --allow-empty -m "chore: token doğrulaması" && git push
   ```

   Bu adım pahalı işlerden önce koşar; token bozuksa saniyeler içinde ve net
   bir mesajla düşer.

### Süresi dolduğunda hangi hatayı verir

İş akışında **"npm kimlik doğrulaması geçerli mi"** adımı kırmızıya döner:

```
npm error code E401
npm error need auth This command requires you to be logged in to https://registry.npmjs.org/
::error::NPM_TOKEN geçersiz veya süresi dolmuş. npm yazma izinli granular
access token'ları en fazla 90 gün yaşar. Yenileme prosedürü: docs/operations.md
```

`E401` / `need auth` görürsen sebep token; kodda arama.

Ayırt etmesi gereken iki komşu hata:

| Hata | Anlamı | Çözüm |
|---|---|---|
| `E401 need auth` | Token yok, süresi dolmuş veya iptal edilmiş | Yukarıdaki yenileme |
| `E403 Forbidden` | Token geçerli ama o pakete yazma izni yok | Tokenın paket listesini ve Read/**write** iznini düzelt |
| `E404 Not Found` (yayında) | Scoped paket private yayımlanmaya çalışılıyor | `--access public` — zaten `publishConfig`'te var |
| `You cannot publish over the previously published versions` | Sürüm zaten npm'de | Hata değil; sürümü yükselt veya koşumu tekrarla |

Bu adım yalnızca `guard` işi secret'ı bulduğunda koşar. Secret tamamen
silinmişse `release` işi hiç başlamaz ve loga `::warning::` yazılır — iş akışı
yeşil görünür ama yayın yapılmamıştır. Yayın beklediğin bir push'ta Release
işinin *atlandığını* görürsen sebep budur.

---

## Kısmi yayın

Dört paket sırayla gönderiliyor. Ortada bir hata olursa bir kısmı npm'de kalır.

Bu **onarılabilir bir durum**: `pnpm publish` registry'de zaten var olan bir
sürümü atlar. Düzeltme yolu, sorunu giderip aynı iş akışını yeniden
koşturmaktır — gitmiş paketler atlanır, eksik olanlar gönderilir. Sürüm
numarasını yükseltmen gerekmez.

Yayın sonrası `tools/verify-published.mjs` dört paketi registry'den okuyup
doğruluyor; eksik varsa iş akışı kırmızıya döner. changesets'in "yayımladım"
demesi bir iddia, registry'den okumak kanıt.

---

## Token'dan kurtulmak: trusted publishing

90 günlük yenileme döngüsünün kalıcı çözümü var: **trusted publishing (OIDC)**.
İş akışı npm'e kısa ömürlü, iş akışına özgü bir token ile kimlik doğrular;
saklanan bir secret yoktur, dolayısıyla yenilenecek bir şey de yoktur.

Özel depolarda da çalışır. Tek kaybedilen provenance (kaynak kanıtı) — o public
depo istiyor, bu depo şu an özel.

**Neden bugün kurulmadı:** trusted publishing bir paketin npm ayarlarından
yapılandırılıyor, yani paketin önce var olması gerekiyor. `0.1.0` yayımlandıktan
sonra yapılabilir.

Yapıldığında:

1. npmjs.com > her paket > **Settings > Trusted Publisher** > GitHub Actions;
   depo `ktlesr/assay`, iş akışı `release.yml`. Dört paket için ayrı ayrı.
2. `release.yml` içinde `permissions:` altına `id-token: write` ekle.
3. `guard` işini, `npm whoami` adımını ve `NODE_AUTH_TOKEN` satırlarını kaldır.
4. `NPM_TOKEN` secret'ını GitHub'dan ve tokenı npm'den sil.
5. Bu bölüm ve yukarıdaki yenileme prosedürü bu dosyadan silinir.

---

## Depo görünürlüğü

`github.com/ktlesr/assay` şu an **özel**. İki sonucu var:

- **Provenance üretilemez.** npm provenance public kaynak deposu istiyor.
- **Paket README'lerindeki depo bağlantıları npm ziyaretçisine 404 verir.**
  Dört README ve dört `package.json` (`repository`, `homepage`, `bugs`)
  `github.com/ktlesr/assay`'i gösteriyor.

İkincisi yayından önce karara bağlanmalı: depo public yapılacaksa sorun kendi
kendine çözülür. Özel kalacaksa bağlantıların kaldırılması gerekir — çalışmayan
bağlantı, bağlantı olmamasından kötüdür.
