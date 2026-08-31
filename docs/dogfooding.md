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
