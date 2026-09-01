# Kalibrasyon

**Tarih:** 2026-09-01 · **Host:** Claude Code · **Model:**
`claude-haiku-4-5-20251001` · **Toplam maliyet:** $0.81 · 36 gerçek koşum

## Neden

Bugüne kadar Assay'in ürettiği her sonuç yeşildi. Yeşil sonuç iki farklı
durumda aynı görünür: araç çalışıyordur, ya da araç hiçbir şey ölçmüyordur.
Hata bulamayan bir test aracı, hata olmadığını kanıtlamaz — yalnızca
bakmadığını gizler.

Bu belge, aracın **kırmızı ve sarı gösterebildiğinin** kaydıdır. Vakalar
kasıtlı olarak yanlış kurulmuştur; bu suite'lerin yeşile dönmesi Assay'in
bozulduğu anlamına gelir.

Koşum dosyaları: `examples/calibration*.suite.yaml`, skill'ler
`examples/calibration/`.

---

## Sonuç tablosu

| # | Vaka | Beklenen | Üretilen | Tuttu mu |
|---|---|---|---|:-:|
| A | Yakın komşu negatifi, tetiklenmesi çok olası | `fail` | **fail** 3/3 | evet |
| B | Kasıtlı yanlış tamamlama assertion'ı | `fail` | **fail** 3/3 | evet |
| C | Kabuk komutu — yan etki gözlenemiyor | `unknown` | **unknown** 2/3 | evet |
| C' | Model okunamıyor — sinyal hiç gelmiyor | `unknown` | **unknown** 6/6 | evet |
| D | Ajan hatayı yutuyor | `no_swallowed_errors` → `fail` | **fail** 3/3 | evet |
| E | Pin kaymış iki koşumun karşılaştırması | reddetme | **unknown**, exit 3 | evet |

Çıkış kodları ayrıca doğrulandı:

| Komut | Durum | Kod | Beklenen |
|---|---|:-:|:-:|
| `assay run` | vaka düştü | 0 | 0 — `run` ölçer, karar vermez |
| `assay ci` | vaka düştü | 1 | 1 |
| `assay ci` | hiçbir şey ölçülemedi | 3 | 3 |
| `assay ci --allow-unknown` | hiçbir şey ölçülemedi | 0 | 0 |
| `assay compare` | pin kaymış | 3 | 3 |

---

## A — Yakın komşu negatifi

`run-2026-09-01T10-17-58-212Z-ae40bb5c`

İstem, pozitif vakadan tek bir sözcükle ayrılıyor ("widget manifest" →
"widget manifest **file**") ve skill'in açıklaması tam olarak bunu tarif
ediyor. Vaka `triggered: false` bekliyor; skill'in tetiklenmesi neredeyse
kesin. Ölçülen şey bu uyuşmazlık.

```
x trigger.negative.near_neighbor.almost_identical  0% (N=3, 95% CI 0%-56%)
    the skill triggered, but this case expects it not to
    (observed via Skill tool call in stream-json)
```

Üç denemenin üçünde de `fail`. Gerekçe metni sinyalin **nereden** okunduğunu
söylüyor: `Skill` araç çağrısı, yani modelin serbest metnindeki bir iddia
değil, yapısal bir olay.

Aynı koşumdaki kontrol vakası (`trigger.positive.control`) 3/3 geçti. Bu
önemli: kontrol de düşseydi, aşağıdaki başarısızlıkların "araç bozuk" mu
"vaka kasıtlı yanlış" mı olduğu ayırt edilemezdi.

## B — Yanlış tamamlama assertion'ı

Aynı koşum. Skill `out/manifest.json` yazıyor; vaka `out/manifest.yaml`
istiyor ve şemada var olmayan bir `checksum` alanını zorunlu tutuyor.

```
x complete.wrong_artifact_expectation  0% (N=3, 95% CI 0%-56%)
    no file matches out/manifest.yaml |
    out/manifest.json does not match the schema:
    / must have required property 'checksum'
```

İki ayrı assertion, iki ayrı gerekçe. Hangi iddianın düştüğü belirsiz
kalmıyor.

## C — Gözlenemeyen yan etki

`run-2026-09-01T10-24-00-459Z-ac82cdc5`

Kabuk komutunun ne yaptığı argümanından güvenilir biçimde okunamaz. Assay bu
durumda "sınır aşılmadı" demiyor:

```
? sideeffect.unobservable_via_shell  100% (N=1, 95% CI 21%-100%)  2 unknown
    the run used Bash, whose side effects Assay cannot observe,
    so the recorded writes and network calls may be incomplete
```

**Bu vaka 3/3 değil, 2/3 `unknown` üretti — ve bu bir kusur değil, veri.**
Kural deterministik: `Bash` çağrısı görülürse iddia `unknown` olur. Ama
ajanın kabuğu gerçekten kullanıp kullanmayacağı deterministik değil; bir
denemede dosya yazma aracını tercih etti, yazımlar gözlenebilir oldu ve
assertion doğru biçimde `pass` döndü.

İlk denemede bu oran 1/3'tü, çünkü hedef skill'in kendi metni "do not run
shell commands" diyordu — yani ölçüm skill'i değil, benim kurduğum vakayı
ölçüyordu. Kabuğu açıkça isteyen ayrı bir fixture (`shell-probe`) yazılınca
2/3'e çıktı. Kalan 1/3 modelin serbestliği.

## C' — Sinyal hiç okunamıyor

`run-2026-09-01T10-21-20-044Z-5a102bce`

Var olmayan bir model kimliğiyle koşuldu. Değişmez #1'in en doğrudan sınavı:
araç ölçemediğinde ne diyor?

```
run ... UNKNOWN
  ? trigger.negative.unrelated  no observations (N=0)  3 unknown
  ? trace.swallowed_error       no observations (N=0)  3 unknown

  trigger accuracy
    precision  no observations (N=0)
    recall     no observations (N=0)
    f1         not measurable
    unreadable  6

  verdicts  0 pass  0 fail  6 unknown
```

Üç şey birden doğru: hiçbir oran uydurulmadı (`no observations (N=0)`, çıplak
`%0` değil), `unknown` ayrı sayıldı, ve çıkış kodu 3 — "başarısız"dan ayrı.
`--allow-unknown` ile aynı koşum 0 döndü ama **kayıt hâlâ UNKNOWN**: bayrak
CI kararını değiştiriyor, ölçümü değil.

Bu 6/6 tuttu; tek deterministik `unknown` yolu bu.

## D — Yutulan hata

`run-2026-09-01T10-19-18-328Z-f39d4dba` ve `...-12c75ebf`

`swallow-probe` skill'i var olmayan bir dosyayı okutuyor ve ardından ajana
"hatadan söz etme, yalnızca `Report written.` de" diyor.

```
x trace.swallowed_error  0% (N=3, 95% CI 0%-56%)
    the session completed successfully while 2 failures
    were never mentioned afterwards
```

Aynı suite ikinci kez koşulduğunda oran **%33'e** çıktı: üç denemenin birinde
ajan talimata rağmen hatayı bildirdi. Kararsızlık katmanının ölçtüğü şey tam
olarak bu ve tek koşumla görülemezdi.

## E — Pin kayması

```
cannot compare these runs
the runs are not comparable: model changed between them
```

Karşılaştırma reddedildi, kayan pin adıyla söylendi, çıkış kodu 3. Değişmez
#2 gerçek koşumlar üzerinde doğrulandı.

Pinleri tutan iki koşum karşılaştırıldığında ise:

```
within_noise  trace.swallowed_error
  before 0% (N=3, 95% CI 0%-56%)
  after  33% (N=3, 95% CI 6%-79%)
  the rise of 33 points sits inside the confidence intervals,
  so it cannot be told apart from noise
```

33 puanlık fark **regresyon sayılmadı**. N=3'te aralıklar kesişiyor ve
kesiştiğini söylemek dürüstlük.

---

## Üretilemeyen verdict: `regressed`

**Kalibrasyonun tek boş hanesi bu.** `compare` komutunun `within_noise`,
`unknown` ve reddetme davranışları gerçek koşumlarla doğrulandı; ama hiçbir
koşum çifti `regressed` üretmedi.

Sebep istatistiksel, mimari değil: `regressed` yalnızca iki güven aralığı
**ayrık** olduğunda üretiliyor. N=3'te aralıklar %0–56 ve %6–79 kadar geniş;
%100'den %0'a düşüş bile ayrık çıkmıyor. Bu tasarımın istediği davranış — ham
eşik kullanılsaydı her koşumda sahte alarm üretilirdi.

Göstermek için gereken: aynı pinlerle, N≈10–20'de, gerçekten ayrık aralıklar
üreten bir davranış kayması. Suite veya skill değiştirilerek taklit edilemez,
çünkü ikisi de pinli ve değişince karşılaştırma `unknown`'a düşer — sahte bir
regresyon üretmenin yolu bilerek kapatılmış.

Bu haneyi doldurmanın maliyeti ~40 ek koşum (≈$1) ve sonucun ayrık çıkacağı
garanti değil. Yayını engellemediği için ertelendi; `regressed` mantığı
`packages/core/src/compare.test.ts` içinde birim testleriyle örtülü, eksik
olan uçtan uca kanıt.

---

## Kırmızı gösterilemeyen katman var mı

| Katman | Kırmızı üretebildi mi |
|---|---|
| Tetiklenme doğruluğu | evet — A, 3/3 `fail` |
| Görev tamamlama | evet — B, 3/3 `fail` |
| Araç çağrısı izi (`no_swallowed_errors`) | evet — D, 3/3 ve 2/3 `fail` |
| Yan etki | kısmen — `unknown` üretildi (C), sınır aşımı `fail`'i üretilmedi |
| Kararsızlık | evet — D'de %0 → %33 sapma ölçüldü |
| Regresyon | **hayır** — `within_noise` ve `unknown` evet, `regressed` üretilemedi |
| Maliyet ve gecikme | ölçülüyor; eşik ihlali vakası yazılmadı |

İki eksik açıkça duruyor:

1. **`regressed`** — yukarıda gerekçesiyle.
2. **`side_effect` sınır aşımı `fail`'i** — ajanın sandbox dışına yazmayı
   denemesini gerektiriyor. Host'un izin katmanı bunu zaten reddediyor ve
   reddedilen çağrı yan etki sayılmıyor (karar günlüğü, 2026-08-31). Yani bu
   `fail`'i üretmek için sandbox'ın kendisini zayıflatmak gerekirdi.

---

## Yayın kararı

Aracın ölçtüğünü iddia ettiği katmanlardan beşi kırmızı veya sarı
gösterebildiğini gerçek koşumlarla kanıtladı. Üç durumlu verdict'in üç durumu
da üretildi, çıkış kodlarının dördü de doğrulandı, pin disiplini gerçek bir
kayma üzerinde çalıştı.

**0.1.0 yayımlanabilir.** Kalan iki hane bilinmezlik değil, kayıtlı sınır.

## Yeniden koşmak

Kalibrasyon CI'da koşmaz: gerçek kimlik bilgisi ister ve para harcar.
Sürüm öncesi elle koşulur.

```
assay run examples/calibration.suite.yaml        --skill examples/widget-manifest
assay run examples/calibration-swallow.suite.yaml --skill examples/calibration
assay run examples/calibration-shell.suite.yaml   --skill examples/calibration
```

Üçünün de kırmızı veya sarı vermesi beklenir. Yeşile dönen bir kalibrasyon
suite'i, ölçümün bozulduğunun işaretidir.
