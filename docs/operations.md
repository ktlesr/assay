# İşletim

Yayın hattının bakımı. Süreç ve gerekçe [releasing.md](releasing.md)'de; burası
düzenli olarak yapılması gereken işler ve bir şey bozulduğunda bakılacak yer.

---

## Kimlik doğrulama: trusted publishing

**Saklanan token yok. Yenilenecek bir şey yok.**

Yayın, GitHub'ın verdiği kısa ömürlü ve bu iş akışına özgü bir OIDC kimliğiyle
yapılıyor. npm, `ktlesr/assay` deposunun `release.yml` iş akışını tanıyor ve
yalnızca oradan gelen yayınları kabul ediyor. Token sızması diye bir durum yok,
çünkü ortada sızacak bir sır yok.

Gereken üç şey:

| | |
|---|---|
| npm tarafı | Her paketin *Settings > Trusted Publisher* kaydı: GitHub Actions, `ktlesr/assay`, `release.yml` |
| İş akışı izni | `permissions: id-token: write` |
| Token'ın **yokluğu** | `changesets/action`'a `NPM_TOKEN` verilmiyor; token bulamayınca OIDC'ye düşüyor |

Üçüncüsü ters görünüyor ama kasıtlı. 0.1.0 yayınında log şunu yazdı:

```
No NPM_TOKEN found, but OIDC is available - using npm trusted publishing
```

İş akışına bir `NPM_TOKEN` geri eklenirse OIDC devre dışı kalır ve yayın
token'a döner — yani provenance ve 2FA sorunları geri gelir. **Eklemeyin.**

### Yeni bir paket eklenirse

Trusted publisher kaydı paket başına. `@ktlsr` altına beşinci bir paket
eklenirse ilk yayınından önce onun da kaydı açılmalı, yoksa o paket
`ENEEDAUTH` benzeri bir hatayla düşer.

Yumurta-tavuk sorunu burada da var: trusted publisher paketin npm ayarlar
sayfasından tanımlanıyor, yani paket var olmadan tanımlanamıyor. 0.1.0'da bu
sorun paket adları önceden ayrılarak çözüldü.

### Süresi dolmuş token hatası (tarihsel)

`EOTP` — 0.1.0'ın ilk yayın denemesi bu hatayla düştü:

```
npm error code EOTP
npm error This operation requires a one-time password from your authenticator.
```

Sebep: npm'in varsayılan paket ayarı publish için 2FA ya da bypass-2FA yetkili
token istiyor; sıradan bir granular access token bunu karşılamıyor ve CI
interaktif istemi cevaplayamıyor. Trusted publishing'e geçildikten sonra bu
hata mümkün değil — 2FA sorusu hiç sorulmuyor.

Bu kayıt, aynı hata bir gün token'lı bir yola dönüldüğünde tanınsın diye
duruyor.

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

## Depo görünürlüğü

`github.com/ktlesr/assay` **public** (2026-09-01'de açıldı). İki sonucu var:

- **Provenance üretiliyor.** `release.yml` içinde `id-token: write` ve her
  pakette `publishConfig.provenance: true`.
- **Paket bağlantıları çalışıyor.** Dört README ve dört `package.json`
  (`repository`, `homepage`, `bugs`) içindeki dokuz benzersiz URL 200 dönüyor;
  yayından önce tek tek denendi.

Depo tekrar özele alınırsa ikisi de bozulur: provenance hata verir ve yayın
düşer, npm'deki bağlantılar 404'e döner. Görünürlük değişikliği yayın hattını
ilgilendiren bir karardır.
