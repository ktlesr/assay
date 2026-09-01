# Dogfooding Raporu

**Tarih:** 2026-08-31 · **Adım:** 1.6 · **Host:** Claude Code 2.1.251 ·
**Model:** `claude-haiku-4-5-20251001`

Assay'i gerçek skill'ler üzerinde koşturduk. Bu bir tanıtım metni değil,
mühendislik raporu: aracın başarısız olduğu ve ölçemediği yerler de burada.

Raporda elle yazılmış tek bir ölçüm yok; tablolar `tools/dogfood-report.mjs`
ile `.assay/dogfood-out/` altındaki gerçek koşum kayıtlarından üretildi.
Yeniden üretmek için: `node tools/dogfood-report.mjs`.

## Neyi ölçtük ve neden

**anthropics/skills** deposundan üç doküman skill'i: `docx`, `pdf`, `xlsx`.
Seçim sebebi tek: **birbirlerinin en zor negatifi.** "Bunu bir belgeye çevir"
üçünü birden çağırabilir. Yakın-komşu vakası yazmak için ideal bir üçlü, ve
tetiklenme doğruluğunun asıl sınavı orada.

Skill'ler repoda vendor'lanmadı (proprietary lisans). Yerel kurulumdan
`.assay/dogfood/<skill>/` altına kopyalanıp `--plugin-dir` ile izole oturuma
yüklendi. Suite dosyaları `examples/dogfood/` altında.

Her skill için beş vaka: iki pozitif (biri formatı adıyla anan, biri anmayan),
iki yakın komşu (kardeş formatlar), bir alakasız. Her vaka **10 tekrar**.

## Ölçülen skill'ler

| Skill | Verdict | Precision | Recall | F1 | Unknown | Maliyet | Süre |
|---|---|---|---|---|---|---|---|
| `docx` | pass | 100% (N=20, 95% CI 84%–100%) | 100% (N=20, 95% CI 84%–100%) | 1.00 | 0 | $3.71 | 31.3 dk |
| `pdf` | pass | 100% (N=20, 95% CI 84%–100%) | 100% (N=20, 95% CI 84%–100%) | 1.00 | 0 | $1.76 | 11.4 dk |
| `xlsx` | **fail** | 100% (N=14, 95% CI 78%–100%) | **70% (N=20, 95% CI 48%–85%)** | 0.82 | 0 | $1.81 | 12.7 dk |

### `docx`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail |
|---|---|---|---|---|
| `trigger.positive.explicit` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.positive.implicit` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.negative.near_neighbor.pdf` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.negative.near_neighbor.xlsx` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.negative.unrelated` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |

### `pdf`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail |
|---|---|---|---|---|
| `trigger.positive.explicit` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.positive.implicit` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.negative.near_neighbor.docx` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.negative.near_neighbor.xlsx` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.negative.unrelated` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |

### `xlsx`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail |
|---|---|---|---|---|
| `trigger.positive.explicit` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.positive.implicit` | tetiklenmeli | **40% (N=10, 95% CI 17%–69%)** | 4 | 6 |
| `trigger.negative.near_neighbor.docx` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.negative.near_neighbor.pdf` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |
| `trigger.negative.unrelated` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 |

**Toplam:** 150 attempt · 641 araç çağrısı · **$7.28** · 55 dakika ajan süresi ·
6 fail · **0 unknown**.

---

## frontend-design — otomatik tetiklenme ölçümü (2026-09-01)

Ayrı bir koşum: `anthropics/skills` `frontend-design`. Öncekilerden iki farkı
var. Birincisi, **hiçbir istemde skill adı geçmiyor ve `/frontend-design`
yazılmıyor** — ölçülen şey modelin istemden skill'i kendi seçmesi, komut
çalıştırması değil. İkincisi, yakın komşular başka bir skill değil: aynı alanın
(frontend) tasarım kararı içermeyen işleri.

Koşum: `run-2026-09-01T13-26-03-631Z-b018d5fc`. Tablolar
`node tools/dogfood-report.mjs frontend-design` ile kayıttan üretildi;
bu bölümde de elle yazılmış ölçüm yok.

| Skill | Verdict | Precision | Recall | F1 | Unknown | Maliyet | Süre |
|---|---|---|---|---|---|---|---|
| `frontend-design` | fail | 100% (N=25, 95% CI 87%–100%) | 83% (N=30, 95% CI 66%–93%) | 0.91 | 0 | $5.32 | 67.6 dk |

| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |
|---|---|---|---|---|---|
| `trigger.positive.new_page` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.visual_overhaul` | tetiklenmeli | 50% (N=10, 95% CI 24%–76%) | 5 | 5 | 0 |
| `trigger.positive.new_screen` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.style_tweak` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.library_setup` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.component_test` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.refactor` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated_db` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated_concept` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |

**Toplam:** 90 attempt · 360 araç çağrısı · $5.32 · 68 dakika ajan süresi · 5 fail · 0 unknown

### Bulgu — düşen vaka skill'i değil, benim vaka kurgumu ölçtü

`visual_overhaul` 10 denemenin 5'inde tetiklenmedi. Ham ize bakınca sebep
skill'de değil çıktı:

```
assistant  "I'll help you give that dashboard a polished visual identity.
            First, let me explore the project to find the dashboard code..."
Glob  **/*dashboard*      -> bos
Glob  **/*analytics*      -> bos
Glob  **/*.{html,jsx,tsx} -> bos
Bash  ls -la              -> bos
assistant  "I see the repository is empty. To help redesign your analytics
            dashboard, I need to know: Do you have existing dashboard code?"
```

İstem "bizim analytics dashboard'umuz" diyor, yani var olan bir artefakta atıf
yapıyor. İzole çalışma dizininde öyle bir şey yok. Ajan dosyaları arıyor,
bulamıyor ve yarı yarıya bir olasılıkla tasarım işine hiç geçmeden soru sorup
duruyor — skill de bu yüzden tetiklenmiyor.

Ayırt edici kanıt maliyette: başarısız denemeler $0.032–0.053, başarılı olanlar
$0.033–0.224. Düşenler işi hiç yapmamış.

Bu, bu raporun kendi "vaka yazma sürtünmesi" listesindeki 1. maddenin canlı
tekrarı: **dosyaya veya mevcut koda atıf yapan istem fixture ister.** Uyarıyı
yazmıştık ve aynı tuzağa düştük. Doğru okuma şu: bu vakanın ölçtüğü şey
`frontend-design`'ın tetiklenme doğruluğu değil, boş bir dizinde var olmayan
bir dashboard'u aramanın sonucu. **%50, skill hakkında bir bulgu değildir.**

Düzeltmesi: vakaya bir `setup.fixtures` eklenip basit ve çirkin bir dashboard
bileşeni konmalı; ölçüm ancak o zaman skill'i ölçer. Diğer iki pozitif
(`new_page`, `new_screen`) sıfırdan üretim istediği için bu sorundan etkilenmedi
ve ikisi de 10/10.

### Yakın komşular yeterince zor değildi

**Dördü de 10/10 doğru davrandı. Bu iyi bir sonuç değil, zayıf bir vaka seti
işareti.** Değişmez #5'in varlık sebebi ayrım gücünü ölçmek; hiçbiri
kırılmayan bir negatif kümesi, ayrım gücünü ölçmemiş demektir. Ölçtüğümüz tek
şey, modelin "tek bir padding değerini değiştir" ile "sıfırdan pricing sayfası
tasarla" arasındaki farkı görebildiği oldu — ki bu zaten bekleniyordu.

Sebep kurguda: dördü de **yapmak** değil, mevcut bir şeyi düzeltmek, test
etmek, kurmak veya yeniden düzenlemek istiyor. Skill'in açıklaması ise "build
web components, pages, or applications" diyor. Yani negatiflerim, skill'in
tetiklenme cümlesinin dışında kalıyordu — komşu değil, uzak akraba.

Gerçek sınır şurada: **bileşen veya sayfa İNŞA eden ama tasarım kararı
istemeyen** istekler. Önerilen daha sınırda set:

| Vaka | İstem çekirdeği | Neden zor |
|---|---|---|
| `spec_bound_component` | "`<DataTable>` bileşenini yaz. `tokens.css`'teki mevcut değerleri birebir kullan, yeni renk/boşluk/tipografi üretme." | "Bileşen yaz" tetikleyici cümlenin tam ortasında; yasak olan yalnızca estetik karar |
| `implement_given_design` | "Figma çıktısı ekte. Bu ayarlar sayfasını spec'teki değerlerle birebir uygula, hiçbir estetik seçim yapma." | Sayfa inşa ediliyor ama tasarım zaten verilmiş |
| `headless_primitive` | "Erişilebilir, tamamen stilsiz bir `<Dialog>` primitifi ve `useDisclosure` hook'u yaz. Hiç CSS yok." | Bileşen inşası + sıfır görsel karar |
| `framework_port` | "Bu pricing sayfasını Bootstrap sınıflarından Tailwind utility'lerine çevir. Piksel çıktısı birebir aynı kalacak." | Sayfa üzerinde çalışılıyor, görünüm değişmeyecek |
| `a11y_only` | "Mevcut checkout akışına ARIA etiketleri ve odak yönetimi ekle. Görsel hiçbir şey değişmeyecek." | Arayüz işi, görsel karar yok |

Ters yönde bir negatif de eksik: **"design" sözcüğü geçen ama frontend olmayan**
istekler ("veritabanı şemasını tasarla", "logo tasarla"). Mevcut sette skill'in
sözcüğe mi işe mi tepki verdiği ayrılamıyor.

Bu set koşulmadı; öneri olarak duruyor. Koşulursa beklenti, en az birinin
kırılması — kırılmazsa skill'in ayrım gücü gerçekten yüksek demektir ve o zaman
sonuç bir şey söyler.

---

## frontend-design — sınırda vaka seti (2026-09-01)

İlk koşumda dört yakın komşunun dördü de 10/10 doğru davranmıştı ve bunu
"vaka seti yeterince zor değil" diye kaydetmiştik. Bu koşum o iddiayı sınıyor.

Değişenler: beş yeni negatif, hepsi **bileşen veya sayfa inşa eden ama tasarım
kararı istemeyen** işler; iki **ters yönde** negatif ("design" sözcüğü var,
frontend yok); mevcut koda atıf yapan her vakaya `setup.fixtures`.

Koşum: `run-2026-09-01T15-10-01-791Z-211291f9`. Tablolar
`node tools/dogfood-report.mjs frontend-design-borderline` ile kayıttan
üretildi.

| Skill | Verdict | Precision | Recall | F1 | Unknown | Maliyet | Süre |
|---|---|---|---|---|---|---|---|
| `frontend-design-borderline` | pass | 100% (N=20, 95% CI 84%–100%) | 100% (N=20, 95% CI 84%–100%) | 1.00 | 0 | $6.22 | 79.3 dk |

| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |
|---|---|---|---|---|---|
| `trigger.positive.control_new_page` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.visual_overhaul_fixed` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.spec_bound_component` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.implement_given_design` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.headless_primitive` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.framework_port` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.a11y_only` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.reverse.database_schema` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.reverse.logo` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |

**Toplam:** 90 attempt · 346 araç çağrısı · $6.22 · 79 dakika ajan süresi · 0 fail · 0 unknown

### Fixture, ilk koşumun düşen vakasını tamamen açıkladı

`visual_overhaul` ilk koşumda fixture'sız %50 tetikliyordu. Tek değişiklikle —
çalışma dizinine gerçek bir Bootstrap dashboard'u koymak — **%100** oldu.

| | Fixture yok | Fixture var |
|---|---|---|
| `visual_overhaul` | 50% (N=10, 95% CI 24%–76%) | **100% (N=10, 95% CI 72%–100%)** |

Yani o %50, `frontend-design` hakkında hiçbir şey söylemiyordu; boş bir dizinde
var olmayan bir dashboard'u arayan ajanı ölçüyordu. Bu, raporun "vaka yazma
sürtünmesi" listesindeki 1. maddenin deneysel kanıtı: **mevcut koda atıf yapan
istem fixture olmadan ölçüm değil, gürültü üretir.**

### Yine hiçbir negatif kırılmadı — ve bu sefer sebebi farklı

**Yedi negatifin yedisi de 10/10 doğru davrandı. Toplam 0 fail.**

Bu sefer "iş hiç yapılmadı" açıklaması geçersiz. Kayıttaki yazım ve araç
sayıları negatiflerde gerçek çalışma olduğunu gösteriyor:

| Vaka | Ort. maliyet | Araç çağrısı | Dosya yazımı |
|---|---|---|---|
| `spec_bound_component` | $0.042 | 40 | 10 |
| `implement_given_design` | $0.047 | 27 | 12 |
| `headless_primitive` | $0.086 | 63 | 41 |
| `framework_port` | $0.087 | 30 | 10 |
| `a11y_only` | $0.045 | 42 | 10 |

Ajan `DataTable`'ı yazdı, ayarlar sayfasını uyguladı, Dialog primitifini ve
hook'u üretti (denemede ~4 dosya), sayfayı Tailwind'e çevirdi, checkout'u
erişilebilir yaptı. **İşler yapıldı ve skill hiçbirinde çağrılmadı.** Kontrol
pozitifi aynı koşumda 10/10 tetiklediği için "skill hiç tetiklenmiyor"
açıklaması da elenmiş durumda.

İki ters yönde negatif de temiz: "veritabanı şemasını tasarla" ve "logo
tasarla" hiçbir denemede tetiklemedi.

> **Düzeltme (ikinci koşum).** Bu paragrafın ilk hâli buradan "skill 'design'
> sözcüğüne değil, işin frontend olmasına tepki veriyor" sonucunu çıkarıyordu.
> Aynı suite ikinci kez koşulduğunda `logo` vakası 8/10'a düştü ve iddia
> çürüdü. Ayrıntı ve düzeltilmiş yorum aşağıda: *"İkinci koşum aynı seti
> çürüttü"*. Tek koşumdan çıkarılan bir sonucun nasıl çöktüğünün kaydı olarak
> bırakıldı.

### Ama sonuç hâlâ ihtiyatlı okunmalı: negatiflerde açık dışlama cümlesi var

Kendi setimin zayıflığı şurada: **yedi negatifin beşinde istemin içine "tasarım
yapma" anlamına gelen bir cümle koydum.**

- "do not introduce any new colour, spacing, radius or font value"
- "take no aesthetic decisions of your own"
- "Ship zero styling — no CSS file, no inline styles"
- "This is a mechanical port, not a redesign"
- "Do not change how anything looks"

Bu raporun 2. bulgusu zaten şunu söylüyordu: **açık dışlama cümleleri işe
yarıyor.** Orada cümle skill'in açıklamasındaydı, burada istemin içinde — ama
mekanizma aynı. Yani ölçtüğüm şey büyük ihtimalle "model açık bir olumsuz
talimata uyuyor mu" oldu, "model tasarım işini tasarım olmayandan ayırt
edebiliyor mu" değil. Birincisi kolay, ikincisi asıl soru.

Gerçek kullanıcı o cümleleri yazmaz. "DataTable bileşeni yaz" der, "yeni renk
üretme" demez.

**Bir sonraki iterasyon:** aynı beş görev, dışlama cümleleri çıkarılmış hâlde.

| Vaka | Sadeleştirilmiş istem |
|---|---|
| `spec_bound_component` | "`src/` içine bir `DataTable` bileşeni yaz. Mevcut `tokens.css`'i kullan." |
| `implement_given_design` | "`settings-page.spec.json`'daki ayarlar sayfasını uygula." |
| `headless_primitive` | "Erişilebilir bir `Dialog` primitifi ve `useDisclosure` hook'u yaz." |
| `framework_port` | "`pricing.html`'i Bootstrap'tan Tailwind'e çevir." |
| `a11y_only` | "`Checkout.jsx`'teki erişilebilirlik sorunlarını düzelt." |

Beklenti: en az birinin kırılması. Kırılmazsa `frontend-design`'ın ayrım gücü
gerçekten yüksektir ve bunu üç bağımsız set üzerinden söyleyebiliriz.

### İkinci koşum aynı seti çürüttü: `logo` sızdırıyor

Aynı suite ikinci kez koşuldu (`run-2026-09-01T15-43-42-398Z-4dcd4874`,
90 attempt, $6.32, 87.9 dk). **Sonuç aynı çıkmadı.**

| Vaka | Koşum 1 | Koşum 2 |
|---|---|---|
| `reverse.logo` | 100% (N=10, 95% CI 72%–100%) | **80% (N=10, 95% CI 49%–94%)** |
| diğer sekiz vaka | 100% | 100% |

Yukarıdaki "logo hiçbir denemede tetiklemedi, yani skill sözcüğe değil işe
tepki veriyor" cümlesi **tek koşuma dayanıyordu ve fazla ileri gidiyordu.**
İkinci koşumda logo istemi iki denemede skill'i çağırdı.

Birleşik tahmin, iki koşumun 20 denemesi üzerinden:

    reverse.logo   90% (N=20, 95% CI 70%–97%)

`assay compare` ile karşılaştırıldığında (dört pin de tutuyor) verdict
`within_noise`:

```
within_noise  trigger.negative.reverse.logo
  before 100% (N=10, 95% CI 72%–100%)
  after  80% (N=10, 95% CI 49%–94%)
  the drop of 20 points sits inside the confidence intervals,
  so it cannot be told apart from noise
```

Yani araç "regresyon" demiyor ve **demememesi doğru**: N=10'da aralıklar
kesişiyor. Ama iki koşumun toplamı, sızıntının gerçek olduğunu gösteriyor —
tek koşumla "temiz" demek burada yanlış olurdu. Değişmez #3'ün ("tekrar
varsayılanı asla 1 değil") bir üst basamağı: bazı vakalar için N=10 da az.

### Sızıntının sebebi: tetikleyen şey alan değil, teslim edilebilirin biçimi

İki başarısız denemenin ham izi sebebi doğrudan söylüyor:

```
Skill  {"skill":"frontend-design",
        "args":"Design a logo for Ember & Oak coffee roastery.
                Create an HTML/SVG mockup showing the logo concept..."}
Write  ember-oak-logo.html
```

Sekiz denemede model istemi bir **açıklama görevi** olarak okudu ve düz metin
cevap verdi — hiç araç çağırmadı, deneme başına $0.023. İki denemede ise
**teslim edilebiliri HTML/SVG olarak yeniden çerçeveledi** ve skill tam o anda
devreye girdi ($0.12–0.16).

Bu, yukarıdaki "sözcüğe değil işe tepki veriyor" yorumunu düzeltiyor:

- `database_schema` 20/20 temiz kaldı, çünkü çıktısı hiçbir okumada HTML olamaz.
- `logo` sızdı, çünkü olabilir.

**Sınır "design" sözcüğü de değil, "frontend" alanı da değil; üretilecek
artefaktın web teknolojisi olup olmadığı.** Logo, poster, e-posta şablonu,
sunum, sosyal medya görseli — hepsi HTML/SVG olarak teslim edilebilir ve
hepsi aynı sızıntının adayı.

Skill yazarına somut öneri: `frontend-design`'ın açıklamasında dışlama cümlesi
**yok**. Bu raporun 2. bulgusu dışlama cümlelerinin işe yaradığını
düşündürüyordu; buraya "Do NOT use for logos, print, or brand identity work"
benzeri bir cümle eklemek bu %10'u kapatabilir — ve Assay bunu ölçebilir.
Ürünün asıl vaadi tam olarak bu cümle.

### Beş sınırda negatif iki koşumda da kırılmadı

100 denemenin 100'ü doğru:

    bes sinirda negatif, birlesik   100% (N=100, 95% CI 96%–100%)

Bu, tek koşumdan çok daha güçlü bir sonuç. Ama yukarıdaki çekince aynen
geçerli: beşinin de isteminde açık bir dışlama cümlesi var, yani ölçülen şey
büyük ihtimalle "model açık olumsuz talimata uyuyor mu". Dışlama cümlesi
olmayan üçüncü iterasyon hâlâ koşulmadı ve asıl soruyu o cevaplayacak.

Nitekim setin **tek kırılan vakası, dışlama cümlesi olmayan tek negatifti.**
Bu tesadüf olabilir, ama hipotezle tutarlı ve ucuza sınanabilir.

### İki koşumun birlikte söylediği

Ölçüm tarafında üç şey kanıtlandı. Fixture disiplini bir vakayı gürültüden
sinyale çevirdi (`visual_overhaul`: %50 → %100). Kontrol pozitifi sayesinde
"her şey geçti" sonucu "araç ölçmüyor" ile karıştırılamadı. Ve **aynı suite'in
iki koşumu aynı sonucu vermedi** — tek koşumdan çıkarılmış bir iddia (`logo`
temiz) ikinci koşumda çürüdü. Bu, ürünün tekrar sayısı ısrarının somut
karşılığı; üstelik burada N=10 bile yetmedi.

`assay compare` iki koşumu karşılaştırdı, dört pini de doğruladı ve düşüşe
`within_noise` dedi. Doğru davranış: N=10'da %100 ile %80 ayırt edilemez.
Sızıntının gerçek olduğunu söyleyen şey karşılaştırma değil, iki koşumun
havuzlanmış 20 denemesi.

Skill tarafında sonuç **koşullu olumlu, bir çekinceyle**:

- İki gerçek tasarım görevinde 40/40 tetikledi.
- Beş sınırda frontend görevinde 100/100 tetiklenmedi.
- Ama `logo` vakasında 20 denemenin 2'sinde sızdı ve sebebi belli: tetikleyen
  şey alan değil, teslim edilebilirin web teknolojisi olması.

Ve asıl çekince duruyor: sınırda negatiflerin beşi de isteme açıkça "tasarım
yapma" diyor. Bu yüzden 100/100, ayrım gücünün üst sınırı değil alt sınırı.
Setin tek kırılan vakasının, dışlama cümlesi taşımayan tek negatif olması
bu şüpheyi güçlendiriyor.

---

## Bulgu 1 — xlsx skill'i kendi tarif ettiği vakada tetiklenmiyor

En önemli sonuç bu.

`xlsx` skill'inin **kendi açıklaması** şunu vaat ediyor:

> Also trigger for cleaning or restructuring messy tabular data files
> (malformed rows, misplaced headers, junk data) into proper spreadsheets.

Tam olarak o vakayı yazdık:

> This CSV has the header on the third row and some junk rows above it.
> Clean it up so I can open it properly. The file is messy.csv.

Sonuç: **40% (N=10, %95 GA %17–%69).**

Tek koşumla bakan biri yazı tura atmış olurdu. On koşum bunu bir ölçüme
çevirdi.

### Kök neden iki katmanlı

İz iki farklı başarısızlık gösterdi.

**Katman 1 — vakayı biz yanlış yazmıştık.** İstem `messy.csv` diyordu ama
sandbox'ta o dosya yoktu. Ajan dosyayı arıyor, bulamıyor ve skill'i çağırmak
yerine kullanıcıya soruyordu:

> The file `messy.csv` isn't in the current directory. Could you provide the
> file or let me know where it's located?

Yani vaka skill'i değil, **eksik dosyayı** ölçüyordu. `setup.fixtures` eklenip
aynı vaka yeniden koşuldu
(`examples/dogfood/xlsx-with-fixture.suite.yaml`): **80% (N=10, %95 GA
%49–%94).**

**Katman 2 — kalan başarısızlık gerçek.** Dosya yerindeyken bile ajan iki
koşumda skill'i hiç çağırmadı; işi `Read` + `Write` ile kendisi yaptı:

> I can see the issue—there are 3 junk rows at the top before the actual
> header. Let me clean it up...

Bu, tetiklenme hatasının klasik biçimi: **model işi kendi çözebildiği için
skill devreye girmiyor.** CSV'den satır silmek modelin zaten yapabildiği bir
şey. Kullanıcı "temizledim" cevabını alıyor, ama skill'in vaat ettiği
biçimlendirme kuralları ve elektronik tablo çıktısı devreye girmiyor —
kullanıcı bunu fark etmez.

### Assay bu iyileşmeyi bile kanıtlanmış saymıyor

%40 → %80 dört katına çıkmış gibi görünüyor. Ama aralıklar %17–%69 ve %49–%94;
**kesişiyorlar.** Assay'in kendi karşılaştırma kuralına göre bu fark
`within_noise` — N=10 ile gürültüden ayırt edilemez.

Bu bir kusur değil, ürünün çalışması. Aralık göstermeyen bir araç buraya
"%100 iyileşme" başlığı atardı ve yanlış olurdu. Farkı gerçekten kanıtlamak
için N büyütmek gerekiyor. Dürüstlüğün bedeli bu ve ödenmeli.

## Bulgu 2 — açık dışlama cümleleri işe yarıyor gibi

Üç skill'in de yakın-komşu vakaları **10/10** doğru reddedildi. docx, pdf ve
xlsx birbirini hiç çalmadı — oysa istemler kasten benzer.

Üçünün de açıklamasında açık bir dışlama cümlesi var:

- docx: "Do NOT use for PDFs, spreadsheets, Google Docs..."
- xlsx: "Do NOT trigger when the primary deliverable is a Word document..."

Bu tek gözlem nedensellik kurmuyor. Ama iddiayı **ölçülebilir** kılıyor: aynı
skill'lerin dışlama cümlesi çıkarılmış sürümleriyle karşılaştırmak, Assay'in
yapabileceği ve bugüne kadar kimsenin yapmadığı bir deney. Skill yazarına
"açıklamana şu cümleyi ekle, precision şu kadar artıyor" demek — ürünün asıl
vaadi bu.

## Bulgu 3 — kırılan precision değil, recall

Üç skill de **precision 100%**: hiçbiri yanlış yerde tetiklenmedi. Kırılan
taraf **recall** — tetiklenmesi gerekirken tetiklenmemek.

Bu, suite yazarken nereye yatırım yapılacağını söylüyor. Yanlış tetiklenmeyi
yakalamak için yazdığımız yakın-komşu vakaları hiç kırmızı vermedi; asıl sinyal
pozitif vakaların **kararsızlığında** çıktı.

Küçük ama önemli bir düzeltme: değişmez #5 negatif vakayı zorunlu tutuyor ve
bu doğru — negatifsiz bir suite yanlış tetiklenmeyi *yapısal olarak* göremez.
Ama bu üç skill'de asıl kusur diğer taraftaydı. İkisi de gerekli.

---

## Aracın kendisinde bulunanlar

**Ölçüm tarafı sağlam çalıştı.** 150 attempt, **0 unknown**. Adaptör her
koşumda tetiklenme sinyalini okudu; çapraz kontrol hiç devreye girmedi.
Fizibilite raporunun "yüksek güvenilirlik" değerlendirmesi 150 koşumda tuttu.

**Yavaşlık gerçek bir kısıt.** docx suite'i **31 dakika** sürdü ve **$3.71**
tuttu — tek başına diğer ikisinin toplamı kadar. Sebep: docx skill'i pozitif
vakalarda gerçekten Word belgesi üretmeye çalışıyor, attempt başına ~2 dakika.
On tekrar × beş vaka bir CI adımı için uzun. Koşumlar şu an **sıralı**;
paralellik eklenmeli.

**Vaka yazma deneyimi — üç sürtünme noktası:**

1. **Dosyaya atıf yapan istem fixture istiyor.** Bunu zor yoldan öğrendik ve
   bir ölçümü boşa harcadık. Doğrulayıcı bunu yakalayabilir: istemde dosya
   uzantısı geçiyor ama `setup.fixtures` yoksa uyarı. Yazılmadı, iş listesinde.
2. **`--skill` bir plugin dizini istiyor.** `~/.claude/skills/docx` doğrudan
   verilemiyor; `.claude-plugin/plugin.json` sarmalayıcısı elle yazıldı. CLI
   bunu kendisi yapabilir ve yapmalı.
3. **Yakın komşu id'sini elle işaretlemek gerekiyor.** `near_neighbor` segmenti
   unutulursa doğrulayıcı yalnızca uyarı veriyor. Hata yapmak suite yazmayı
   zorlaştırırdı; uyarı kalıyor ama uyarının görülmesi gerekiyor.

## Ölçülemeyenler

**Görev tamamlama katmanı bu raporda yok.** Üç doküman skill'i de Python
betikleri çalıştırıyor ve izole çalışma dizininde bağımlılıkları yok. Artefakt
vakaları eklenseydi ölçtüğümüz şey skill değil, sandbox'ın Python kurulumu
olurdu. Doğru cevap ölçmemek; yanlış cevap ölçüp `fail` demekti.

Tamamlama katmanı `examples/widget-manifest.suite.yaml` ile ayrıca doğrulandı
(docs/adapter-validation.md): `file_exists`, `file_valid`, `json_schema`
gerçek bir koşumda çalıştı.

**Yan etki katmanı da ölçülemezdi.** Bu skill'ler `Bash` kullanıyor ve 1.3
güvenlik incelemesinden sonra kabuk kullanan koşumlarda `side_effect`
assertion'ı `unknown` üretiyor — kabuk komutunun ne yazdığını göremiyoruz.
Suite'lere koymadık çünkü sonucu baştan belliydi. Bu, aracın bilinen tavanı.

**`no_swallowed_errors` bu koşumlarda tetiklenmedi.** Daha önce 1.2'de gerçek
bir vakada tetiklendi: ajan bir PowerShell hatasından sonra toparlayıp
başarısız adımdan hiç söz etmeden bitirmişti.

---

## Faz 1 geçiş kriterleri

| Kriter | Durum |
|---|---|
| 1 gerçek host üzerinde koşuyor | ✅ Claude Code |
| 3–5 gerçek skill ölçüldü | ✅ docx, pdf, xlsx |
| Her skill için pozitif + negatif + yakın komşu | ✅ beşer vaka |
| En az 10 tekrar | ✅ 10 |
| Trigger için pass / fail / unknown üretiliyor | ✅ 150 attempt, 0 unknown |
| Artefakt doğrulaması çalışıyor | ✅ (adapter-validation.md) |
| Araç çağrısı izi okunuyor | ✅ 641 araç çağrısı |
| `no_swallowed_errors` gerçek bir vakada tetiklendi | ✅ (adapter-validation.md) |
| HTML ve terminal rapor | ✅ |
| CI exit code doğru | ✅ 0 / 1 / 2 / 3 |

Hepsi tutuyor.

## Bu rapordan çıkan iş listesi

1. **Paralel koşum.** 150 attempt 55 dakika sürdü; CI için fazla.
2. **Dosya adı geçen istemde fixture uyarısı.** Doğrulayıcıya.
3. **`--skill` bare skill dizinini kabul etsin.** Sarmalayıcıyı CLI yazsın.
4. **xlsx bulgusu yukarı akışa bildirilmeli.** Skill kendi açıklamasında
   tarif ettiği vakada 10'da 8 tetikleniyor; "messy tabular data" cümlesi
   ölçülebilir biçimde eksik çalışıyor.
