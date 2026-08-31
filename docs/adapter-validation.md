# Adaptör Doğrulaması — Claude Code

**Tarih:** 2026-08-31 · **Adım:** 1.1 · **Adaptör:** `claude-code` ·
**Host sürümü:** 2.1.251 · **Model:** `claude-haiku-4-5-20251001`

0.6 fizibilite raporu Claude Code'un dört sinyali de verdiğini gösterdi. Bu
rapor, adaptörün o sinyalleri gerçekten okuduğunu **canlı bir koşumla**
gösteriyor. Aşağıdaki her sayı gerçek bir koşumdan geliyor; ham kayıtlar
`.assay/adapter-probe.json` içinde (`.gitignore` kapsamında).

Yeniden üretmek için: `node tools/live-adapter-probe.mjs`.

## Koşum kurulumu

Tek kullanımlık bir plugin (`assay-probe`) ve içinde tek bir skill
(`widget-manifest`) yazıldı. Skill'in tüm davranışı tek satır çıktı vermek:
`ASSAY_PROBE_FIRED`. Böylece tetiklenip tetiklenmediği tartışmasız görülüyor.

Her attempt:

- kendi geçici `CLAUDE_CONFIG_DIR`'ında koştu → aktif skill sayısı **22**
  (izole edilmemiş bir koşumda 119'du)
- skill `--plugin-dir` ile yalnızca o oturuma yüklendi
- istem stdin'den gitti, argüman olarak değil

## Sonuçlar

| Vaka | Tetiklenmeli mi | Tetiklendi mi | Verdict | İz olayı | `no_swallowed_errors` | Gecikme | Maliyet |
|---|---|---|---|---|---|---|---|
| `trigger.positive.explicit` | evet | **evet** | pass | 6 | pass | 4016 ms | $0.0277 |
| `trigger.negative.near_neighbor.readme` | hayır | **hayır** | pass | 2 | pass | 3759 ms | $0.0237 |
| `trigger.negative.unrelated` | hayır | **hayır** | pass | 2 | pass | 6591 ms | $0.0250 |

**Tetiklenme doğruluğu: 3/3.** Pozitif vaka tetikledi; yakın komşu (aynı
taslak, ama "README bölümü yap") ve alakasız vaka tetiklemedi.

Bu üç koşum tek tekrarlı olduğu için **kararsızlık ölçüsü yok**; N=1 bir gözlem,
ölçüm değil (değişmez #3). Gerçek suite koşumu 1.2'de N tekrarla gelecek.

## Dört sinyalin durumu

**Skill discovery ✅** — `system/init` aktif skill setini verdi (22 skill),
`plugins` listesinde `assay-probe` göründü.

**Trigger ✅** — pozitif vakada akışta `Skill` araç çağrısı belirdi ve
`input.skill` alanı `assay-probe:widget-manifest` dedi. Adaptör bunu hedef
skill `widget-manifest` ile eşleştirdi; plugin ad alanı soyuluyor, başka
hiçbir gevşetme yok. **Metinden çıkarım yapılmadı.**

**Tool trace ✅** — pozitif vakada 6, negatiflerde 2 kanonik olay üretildi.

**Completion ✅** — `result` olayı okundu, çapraz kontrolden geçti, maliyet ve
gecikme kaydedildi.

## Pin durumu

| Pin | Durum |
|---|---|
| 1 — skill sürümü | Suite'ten gelir (`target.source`) |
| 2 — model kimliği | `init.model` → `claude-haiku-4-5-20251001` ✅ |
| 3 — sistem promptu hash'i | **Host vermiyor.** `systemPromptHash` boş bırakıldı |
| 4 — vaka seti sürümü | Suite'ten gelir (`version`) |

Pin 3 yerine `init` alanlarından deterministik bir **ortam hash'i** türetiliyor:

```
sha256:2f3b587755279acbeed725655f545147161ba8a73fedf2103ae5b35166f6728d
```

Üç koşumda da aynı çıktı — gerçek bir kayma detektörü. Ama sistem promptu
hash'i **değil** ve öyle etiketlenmiyor ([decisions.md](decisions.md)).

## Fizibilite raporunda "kısmen" işaretlenen sinyaller

Plan 1.1, kısmi veya düşük güvenilirlikli her sinyal için adaptörün o durumda
ne yaptığının açıkça test edilmesini istiyor.

### Trigger — "kısmen": yalnızca model seçtiğinde

Kullanıcının `/skill-adı` ile elle çağırdığı yol `Skill` aracı üretmiyor.
Bu yol `explicit-slash.jsonl` fixture'ıyla test ediliyor: adaptör o akışta
`triggered: false` görür — çünkü gerçekten *modelin seçimi* olmamıştır.

Assay hiçbir zaman slash komutu göndermiyor; istem her zaman doğal dil.
Yine de fixture testte duruyor ki davranış sessizce değişmesin.

### Completion — çapraz kontrol gerekiyor

Host `subtype: "success"` alanında yanıltıcı olabiliyor (0.6'da iki kez
gözlendi). Adaptör dört alanı birden kontrol ediyor: `is_error`, `num_turns`,
`usage.output_tokens`, `terminal_reason`.

Altı bozuk oturum senaryosu test ediliyor ve **hiçbiri `triggered: false`
üretmiyor** — hepsi `available: false` döner:

| Senaryo | Sonuç |
|---|---|
| `result` olayı hiç yok | `available: false` |
| Host hata bildirdi | `available: false` |
| `num_turns === 0` | `available: false` |
| `output_tokens === 0` | `available: false` |
| `terminal_reason !== 'completed'` | `available: false` |
| Süreç hiç başlamadı | `available: false` |

Ölçülemeyen bir koşumu "tetiklenmedi" saymak, her negatif vakayı bedavaya
geçirirdi. Bu, değişmez #1'in adaptör seviyesindeki karşılığı.

## Windows'a özgü iki bulgu

**Node 22 `.cmd` dosyalarını kabuk olmadan spawn etmiyor** (CVE-2024-27980).
Kabuğa düşünce de çok satırlı istemler bozuluyor — ilk canlı koşumda iki vaka
tam bu yüzden `unknown` döndü ve akış hiç gelmedi. Adaptör artık PATH üzerinde
`claude.exe` arayıp doğrudan spawn ediyor; kabuk yalnızca `.exe` bulunamazsa
devreye giriyor.

**İstem stdin'den gidiyor**, argüman olarak değil. Hem çok satırlı istemler
bozulmuyor hem de uzun istemler ARG_MAX sınırına takılmıyor.

## Maliyet ve gecikme

Üç koşum, toplam **$0.0764**. Ortalama gecikme **4789 ms**.

Bu, N tekrarlı gerçek bir suite için bütçe tahmini veriyor: 10 vaka × 10 tekrar
≈ 100 koşum ≈ **$2.5**, ≈ 8 dakika (paralellik olmadan).

---

# Uçtan Uca Doğrulama — 1.2

**Tarih:** 2026-08-31 · **Adım:** 1.2 (runner, sandbox, store, skorlama)

`examples/widget-manifest.suite.yaml` — 4 vaka × 3 tekrar, gerçek skill,
gerçek host. Yeniden üretmek için: `node tools/e2e-run.mjs`.

## Sonuç

```
run run-2026-08-31T16-44-09-018Z-33693426 → PASS

  trigger.positive.explicit                100% (N=3, 95% CI 44%–100%)
  trigger.negative.near_neighbor.readme    100% (N=3, 95% CI 44%–100%)
  trigger.negative.unrelated               100% (N=3, 95% CI 44%–100%)
  complete.writes_valid_manifest           100% (N=3, 95% CI 44%–100%)

trigger precision 100% (N=6, 95% CI 61%–100%)
trigger recall    100% (N=6, 95% CI 61%–100%)
f1                1.00
unknown triggers  0

totals: 12 attempts · 12 tool calls · 218/6981 tokens · $0.3402 · 89.2s
```

N=3 iken aralık %44–%100. Dar değil ve olmamalı: üç koşum üç koşum kadar şey
söyler. Değişmez #4'ün pratikteki karşılığı bu.

## Assay ilk gerçek kusurunu buldu

İlk koşumda tamamlama vakası 0/3 geçti. Sebep aracın kendisi değildi:
**skill'in talimatı belirsizdi.**

`docs`taki ilk hâli "write the manifest to `out/manifest.json` in the current
working directory" diyordu. İz bunu gösterdi:

```
attempt 0:  PowerShell New-Item -Path "D:\assay\examples\widget-manifest\
              skills\widget-manifest\out"        → ERR blocked
            Write D:\...\skills\widget-manifest\out\manifest.json → ERR denied
            "I don't have permission to write to that directory."

attempt 1:  PowerShell New-Item -Path "out"      → ERR requires approval
            Write out/manifest.json              → ok
            "Created a widget manifest with..."
```

Ajan bazen yolu **skill'in kendi dizinine** göre çözdü, bazen çalışma dizinine.
Aynı istem, aynı model, farklı davranış — tam da Assay'in ölçmek için var
olduğu şey.

Skill'in talimatı netleştirildi ("resolve against the current working
directory, not this skill's base directory; use the file-writing tool
directly, do not run shell commands") ve **aynı suite 12/12 geçti.**

## `no_swallowed_errors` gerçek bir vakada tetiklendi

İkinci koşumda attempt #2 şu gerekçeyle düştü:

> the session completed successfully while a failure was never mentioned
> afterwards

İz doğruluyor: PowerShell çağrısı hata verdi, ajan `Write` ile toparladı ve
"Created a widget manifest with..." diyerek bitirdi — başarısız adımdan hiç
söz etmeden.

Bu bir **yanlış pozitif değil**, kuralın tam olarak vaat ettiği şey. Ama
nüansı kayda geçiyoruz: kural, "başarısız oldu ve sakladı" ile "başarısız
oldu, toparladı, söylemedi" arasında ayrım yapmıyor. İkincisi zararsız
görünebilir; yine de kullanıcı transkripti okuduğunda o adımın engellendiğini
bilmez. Faz 1'in geçiş kriteri bu kuralın gerçek bir vakada tetiklenmesini
istiyordu — tetiklendi.

## İzin politikası düzeltildi

İlk koşumda adaptör `--permission-mode dontAsk` kullanıyordu ve host `Write`'ı
reddediyordu; hiçbir tamamlama vakası ölçülemezdi. Varsayılan `acceptEdits`
oldu: ajan sandbox çalışma dizinine yazabiliyor.

Ağ araçları (`WebFetch`, `WebSearch`) varsayılan olarak reddediliyor.
`side_effect: { network: deny }` iddiası buna dayanıyor — ve tavanı burada:
engelleme host'un araç izni katmanında, işletim sistemi seviyesinde değil.

Reddedilen çağrılar artık yan etki sayılmıyor: denenmiş ama gerçekleşmemiş bir
yazımı `writes` listesine koymak yalan olurdu. Çağrı-sonuç bağı için
`TraceEvent`'e `id` ve `callId` alanları eklendi.

## Ne ölçüldü, ne ölçülmedi

| Katman | Durum |
|---|---|
| Tetiklenme doğruluğu | ✅ precision/recall/F1, N ve GA ile |
| Görev tamamlama | ✅ `file_exists`, `file_valid`, `json_schema` |
| Araç çağrısı izi | ✅ 12 çağrı kaydedildi |
| Yan etkiler | ✅ `writes_within`, `network: deny` |
| Kararsızlık | ⚠️ N=3, aralık geniş; 1.6'da N≥10 |
| Regresyon | ⛔ Faz 2 |
| Maliyet ve gecikme | ✅ $0.3402, 89.2 s |
