# Assay — Claude Code Prompt Planı (Otonom Mod, Fazlı)

AI ajan skill'lerinin gerçekten çalışıp çalışmadığını ölçen değerlendirme platformu. VS Code + Claude Code ile, tam kontrol Claude Code'da olacak şekilde. Hiçbir prompt sana soru sormaz, onay beklemez.

**Sıra değişti.** Önceki sürüm auth ve dashboard'ı erken yapıyordu. Artık sıra şu ilkeye göre: **önce host sinyalini kanıtla, sonra SaaS'ı inşa et.**

---

## Faz yapısı

```
FAZ 0  Fizibilite        → Assay neyi kanıtlayabilir? Git/gitme kararı.
FAZ 1  CLI ürünü         → assay run gerçek bir skill'i güvenilir ölçüyor.
FAZ 2  Hosted katman     → Geçmiş, dashboard, hesap.
FAZ 3  Sağlamlaştırma    → Güvenlik, test, deploy.
```

Faz 0 ve 1 bitmeden Faz 2'ye geçme. Faz 0'ın çıktısı ürünün devam edip etmeyeceğini belirler.

---

## Otonom mod sözleşmesi

`CLAUDE.md`'ye ekle.

```
OTONOM ÇALIŞMA SÖZLEŞMESİ

Bu projede tam yetkiye sahipsin. Kullanıcıya soru sorma, onay isteme,
seçenek sunma. Karar ver, uygula, sonucu raporla.

Belirsizlikle karşılaştığında:
1. Mevcut bilgiyle en makul kararı ver.
2. Kararı ve gerekçesini docs/decisions.md'ye yaz.
3. Devam et.

docs/decisions.md formatı — her karar için:
  ## <tarih> — <karar başlığı>
  Bağlam: neden bir karar gerekti
  Seçenekler: değerlendirdiklerin
  Karar: seçtiğin
  Gerekçe: neden
  Geri dönüş maliyeti: düşük / orta / yüksek

Her prompt'un sonunda kısa bir uygulama raporu ver: ne yaptın, hangi
kararları verdin, neyi doğruladın, hangi test geçti.

SADECE ŞU ÜÇ DURUMDA DUR VE SOR:
1. Sır gerekiyor — API anahtarı, OAuth credential, veritabanı şifresi,
   deploy erişimi. Uydurma, placeholder koy ve neyin gerektiğini söyle.
2. Geri alınamaz işlem — üretim veritabanı silme, force push, kayıt
   silme, harici servise gerçek para harcayan çağrı.
3. docs/invariants.md ile çelişki.

Bunların dışında hiçbir şey için durma.

Her adımdan sonra kendi işini doğrula: testleri koş, tip kontrolü yap,
lint çalıştır, mümkünse ekran görüntüsü al ve incele. Doğrulamadan
tamamlandı deme.
```

---

## Veri gerçekliği kuralı

`CLAUDE.md`'ye ekle.

```
VERİ GERÇEKLİĞİ

Arayüzde, demolarda, seed'lerde ve raporlarda elle uydurulmuş sahte veri
kullanma. Ekranda görünen her sayı gerçek bir koşumdan gelmeli.

- Hardcoded örnek koşum, elle yazılmış JSON fixture, uydurma yüzde yok.
- UI için veriye ihtiyacın olduğunda runner'ı gerçekten çalıştır ve çıkan
  kayıtları seed olarak kullan. Veri üretmenin yolu ölçüm yapmaktır.
- Seed script'i sabit dosya okumaz; runner'ı bir örnek suite üzerinde
  koşturur ve sonucu yazar.
- Landing page'de gerçek olmayan müşteri sayısı, test sayısı, logo veya
  referans yok. Örnek çıktı göstereceksen gerçek bir koşumun çıktısını
  göster.

İSTİSNA — test kodu:
Birim ve entegrasyon testlerinde sahte girdi normaldir. MockAdapter bir
test aracıdır; asla arayüze veya seed'e veri beslemek için kullanılmaz.

Gerçek veri henüz üretilemiyorsa ekranı boş bırak ve EmptyState göster.
Boş ekran, uydurma veriden iyidir.
```

---

## Geliştirme modu

`CLAUDE.md`'ye ekle.

```
GELİŞTİRME MODU — GÖRÜNÜR ÇALIŞMA

Kullanıcı arayüzü çalışırken izliyor. Uygulama her adımda ayakta kalmalı.

- pnpm dev tek komutla çalışsın ve çalışır kalsın. Derlemeyi bozan bir
  değişiklik yaptıysan sonraki işe geçmeden düzelt.
- Arayüzü etkileyen her adımdan sonra ekran görüntüsü al, kendin incele,
  düzelt, sonra raporla. Koyu ve açık temada.
- Raporunda hangi URL'lerin gezilebilir olduğunu listele.
- Yarım kalan ekranda beyaz sayfa veya çökme bırakma.
- Yeni sayfayı navigasyondan erişilebilir yap.
- Port çakışması, derleme hatası veya çalışmayan sayfa varsa raporun en
  başında bildir.

/dev/components sayfası Faz 2'nin ilk gününden ayakta olsun.
```

---

## Değişmezler

- **Üç durumlu verdict:** `pass` / `fail` / `unknown`. Sinyal alınamadıysa asla `pass` yazılmaz.
- **Pin zorunluluğu:** skill sürümü, model kimliği, sistem promptu hash'i, vaka seti sürümü.
- **N > 1:** tekrar sayısı varsayılanı asla 1 olmaz.
- **Güven aralığı:** hiçbir oran, N ve aralık olmadan gösterilmez.
- **Negatif vaka zorunlu:** yakın komşu negatifi olmayan tetiklenme suite'i geçersizdir.
- **v0'da LLM judge yok.**

---

# FAZ 0 — Fizibilite

Amaç: Assay'in gerçekte neyi kanıtlayabileceğini belirlemek. Bu fazın sonunda git/gitme kararı verilir.

## 0.1 — Proje anayasası

```
Assay adında yeni bir projeye başlıyoruz. Bu repo boş.

[Otonom çalışma sözleşmesi, veri gerçekliği ve geliştirme modu bloklarını
buraya yapıştır.]

ÜRÜN
Assay — AI ajan skill'lerinin gerçekten çalışıp çalışmadığını ölçen bir
değerlendirme platformu. Adı metalürjideki tahlil işleminden geliyor: bir
numunenin iddia edilen değil gerçek muhtevasını belirlemek.

Konumlandırma: Agent Skills için CI test koşum aracı. "Jest / Playwright
for Agent Skills". Genel amaçlı LLM eval aracı DEĞİL.

İki parçalı:
- Açık kaynak SDK (Apache-2.0) — ölçen taraf. Platform olmadan tam çalışır.
- Hosted platform — hatırlayan taraf. Geçmiş, regresyon, ekip.

Ölçtüğü katmanlar: tetiklenme doğruluğu, görev tamamlama, araç çağrısı izi,
yan etkiler ve güvenlik, kararsızlık, regresyon, maliyet ve gecikme.
Roadmap'te ayrıca: skill coexistence / collision testing.

DEĞİŞMEZLER
Bir uygulama önerisi bunlardan birini ihlal ediyorsa uygulamadan önce dur:
- Verdict üç durumlu: pass / fail / unknown. Sinyal alınamadıysa unknown.
- Karşılaştırma için dört pin zorunlu: skill sürümü, model kimliği,
  sistem promptu hash'i, vaka seti sürümü.
- Tekrar sayısı varsayılanı asla 1 değil.
- Hiçbir oran, N ve güven aralığı olmadan gösterilmez.
- Tetiklenme suite'i negatif ve yakın-komşu vakası içermek zorunda.
- v0'da LLM judge yok.

YIĞIN
Next.js App Router, TypeScript strict, PostgreSQL + Prisma (Faz 2),
pnpm monorepo, Tailwind + shadcn/ui, Auth.js, Dokploy VPS.
Faz 1'de kalıcılık yerel: SQLite veya dosya tabanlı store.

ŞİMDİ YAP
1. Repo hijyeni: .gitignore, .editorconfig, .nvmrc, LICENSE (Apache-2.0),
   README taslağı (uydurma rozet, rakam, kullanıcı sayısı yok).
2. CLAUDE.md — minimal, @import direktifleri, artı üç sözleşme bloğu.
3. docs/product.md — ürün tanımı, konumlandırma, iki parçalı mimari,
   hedef kullanıcı, ölçüm katmanları, roadmap (coexistence testing dahil).
4. docs/invariants.md — değişmezler, her biri için neden var olduğu.
5. docs/stack.md — yığın ve gerekçesi. Faz 1 yerel / Faz 2 hosted ayrımı.
6. docs/decisions.md — boş karar günlüğü.
7. docs/workflow.md — üç sözleşmenin tam metni.
8. docs/roadmap.md — dört fazlı geliştirme sırası, her adımın çıktısı ve
   faz geçiş kriterleri.

Node sürümü, paket yöneticisi, lint/format araçları ve commit
konvansiyonunu kendin seç, decisions.md'ye kaydet.

Kod yazma; bu adım sadece iskelet ve anayasa.
```

---

## 0.2 — Monorepo iskeleti

```
docs/stack.md'yi oku. pnpm workspace monorepo iskeletini kur. Otonom çalış.

Paketler:
- packages/core      → şema tipleri, kanonik kayıt tipleri, assertion
                       motoru, skorlama. Saf TypeScript, I/O yok.
- packages/runner    → sandbox koşumu, adaptör arayüzü, kayıt katmanı,
                       yerel store.
- packages/cli       → SDK'nın komut satırı yüzü. Apache-2.0.
- packages/adapters  → her host ortamı için bir adaptör.
- apps/web           → Next.js (FAZ 2'de doldurulacak, şimdilik iskelet).
- packages/db        → Prisma (FAZ 2'de doldurulacak, şimdilik boş).
- packages/ui        → tema ve bileşenler (FAZ 2).

Kritik kural: core hiçbir şeye bağımlı olmayacak. runner core'a bağlı.
web runner'a doğrudan bağlanmayacak. Bu sınırı eslint veya
dependency-cruiser ile makine seviyesinde zorla.

TypeScript strict, tüm paketlerde. Ortak tsconfig base.

Kur, bağımlılık kuralının gerçekten ihlal yakaladığını bir testle kanıtla.
```

---

## 0.3 — Vaka seti şeması ve doğrulayıcı

```
packages/core içinde vaka seti YAML şemasını ve doğrulayıcısını yaz.
Otonom çalış.

Zod ile şema tanımla, YAML'ı parse edip Zod'dan geçir. Hedef format:

version: 1
target:
  skill: docx
  source: anthropics/skills@<commit-sha>
environment:
  host: <host-id>
  model: <model-id>
  system_prompt_hash: <sha256>
  active_skills: [docx, pdf, xlsx]    # coexistence için, v0'da opsiyonel
runs: 10
cases:
  - id: trigger.positive.explicit
    prompt: "..."
    expect: { triggered: true }
  - id: trigger.negative.near_neighbor.pdf
    prompt: "..."
    expect: { triggered: false }
  - id: coexistence.collision.pdf_steals
    prompt: "..."
    expect: { triggered: true, not_triggered: [pdf] }   # v0'da opsiyonel
  - id: complete.creates_valid_document
    prompt: "..."
    setup: { fixtures: ./fixtures/draft.md }
    expect:
      triggered: true
      assertions:
        - { type: file_exists, path: "out/*.docx" }
        - { type: file_valid, format: docx }
        - { type: trace, rule: no_swallowed_errors }
        - { type: side_effect, writes_within: ["out/"], network: deny }

ÖNEMLİ: active_skills ve coexistence vaka tipi v0'da zorunlu değil ama
ŞEMADA BUGÜN yer alsın. Sonradan eklemek mevcut suite dosyalarını bozar;
bugün eklemek bedava.

Doğrulama kuralları, her biri eyleme dönük hata mesajıyla:
- runs < 2 → hata
- Hiç negatif vaka yok → hata
- Yakın komşu negatifi yok → uyarı
- Dört pin alanından biri eksik → hata
- Vaka id'leri benzersiz ve hiyerarşik olmalı
- coexistence vakası var ama active_skills boş → hata

Yaz, kapsamlı unit test ekle, koş, raporla.
```

---

## 0.4 — Assertion motoru

```
packages/core içinde assertion motorunu yaz. Otonom çalış.

v0'da iki tip:

1. Deterministik: file_exists (glob), file_valid (docx/pdf/xlsx/json/yaml),
   json_schema, exit_code, file_content_matches.

2. İz tabanlı, TraceEvent dizisi üzerinde: tool_called, tool_sequence,
   tool_args_valid, no_swallowed_errors.

no_swallowed_errors: bir TraceEvent isError=true ise ve ajan sonrasında
hatayı bildirmeden başarıyla bitirdiyse FAIL. Ayrı modül olarak yaz.
Ürünün ayırt edici özelliği bu — en az 8 test vakası (hata var/yok ×
bildirdi/bildirmedi × kısmi bildirim × belirsiz).

Her assertion PASS / FAIL / UNKNOWN dönebilmeli. Veri eksikse UNKNOWN ve
neden. Hiçbir assertion veri yokluğunda PASS dönmez — tip seviyesinde zorla.

LLM judge YAZMA.

Ayrıca packages/core içinde kanonik kayıt tiplerini tanımla: Run, Case,
Attempt, TraceEvent, EnvDiff, AssertionResult, Verdict. Bunlar hem yerel
store'un hem de ileride hosted DB'nin tek doğruluk kaynağı olacak; Prisma
şeması Faz 2'de bu tiplerden türetilecek. Şimdi doğru tanımla.

Yaz, testleri koş, kapsam raporunu göster.
```

---

## 0.5 — Adaptör arayüzü

```
packages/runner içinde adaptör arayüzünü tanımla. Otonom çalış.

Adaptör bir host ortamını temsil eder, skill'i değil. Dört yetenek:

interface HostAdapter {
  id: string;
  start(config: RunConfig): Promise<AgentSession>;
  readTriggerSignal(session: AgentSession): Promise<TriggerSignal>;
  readTrace(session: AgentSession): Promise<TraceEvent[]>;
  finalize(session: AgentSession): Promise<SessionResult>;
}

Kritik: readTriggerSignal okuyamazsa hata fırlatmaz,
{ available: false, reason } döner. Runner bunu gördüğünde attempt'i
UNKNOWN işaretler. Tahmin yürütme ve varsayılan üretme yasak —
TriggerSignal tipini öyle tasarla ki "bilinmiyor" görmezden gelinemesin.

MockAdapter yaz: sinyal yokluğu, kısmi trace, çöken oturum gibi kenar
durumları simüle etsin. SADECE test içindir; arayüze veya seed'e veri
beslemek için kullanılamaz.

Yaz, testleri koş, raporla.
```

---

## 0.6 — HOST FİZİBİLİTE SPIKE ⚠️

**Projenin en kritik adımı.** Bu adımın çıktısı ürünün devam edip etmeyeceğini belirler.

```
Bu bir araştırma görevi. Üretim kodu yazma; amaç Assay'in gerçekte neyi
kanıtlayabileceğini belirlemek. Otonom çalış.

Üç host ortamını incele:
1. Claude Code
2. OpenAI Codex
3. GitHub Copilot

Her biri için tek bir soruyu cevapla:
"Assay, X skill'inin gerçekten tetiklendiğini güvenilir biçimde
kanıtlayabilir mi?"

Dört sinyali araştır:
A. Skill discovery — skill'ler nereden yükleniyor, koşum sırasında hangi
   skill setinin aktif olduğu programatik olarak kontrol edilebilir mi?
B. Trigger observability — bir skill'in tetiklendiği açıkça loglanıyor mu,
   yoksa transkriptten çıkarım mı gerekiyor? Çıkarım gerekiyorsa ne kadar
   güvenilir?
C. Structured trace — araç çağrısı akışı yapılandırılmış olarak
   erişilebilir mi, yoksa metin parse etmek mi gerekiyor?
D. Completion signal — oturumun bittiği ve nasıl bittiği tespit edilebilir mi?

Her sinyal için üç şey raporla: erişilebilir mi (evet/hayır/kısmen), hangi
mekanizmayla, güvenilirlik değerlendirmesi (yüksek/orta/düşük ve neden).

Mümkünse iddiaları küçük deneylerle doğrula — bir skill kur, tetikle,
çıktıyı incele. Doğrulayamadığın her iddiayı "doğrulanmadı" olarak işaretle.
Belgelerden okuduğunla deneyle gördüğünü ayrı ayrı yaz.

ÇIKTI: docs/host-feasibility.md içinde şu matris ve altında her hücrenin
gerekçesi:

Host          | Skill discovery | Trigger observable | Tool trace | Completion | Genel
Claude Code   |                 |                    |            |            |
Codex         |                 |                    |            |            |
Copilot       |                 |                    |            |            |

Sonunda net bir değerlendirme yaz:
- Hangi host en temiz sinyali veriyor?
- Trigger sinyali hiçbir hostta güvenilir okunamıyorsa bunu açıkça söyle.
  Bu durumda Assay'in tetiklenme katmanı çalışmaz ve ürünün kapsamı
  değişmelidir. Kötü haberi yumuşatma.
- Kısmi okunabilirlik varsa, hangi vaka tiplerinin UNKNOWN döneceğini
  tahmin et.

Bu raporu yazdıktan sonra dur. Bir sonraki adıma geçme.
```

**Faz geçiş kriteri:** En az bir hostta trigger sinyali orta veya yüksek güvenilirlikle okunabiliyor olmalı. Değilse ürünün kapsamı yeniden tanımlanmalı — tetiklenme katmanı olmadan Assay bir ajan entegrasyon testi aracı olur, ki orada rekabet çok daha sert.

---

# FAZ 1 — CLI ürünü

Hedef: `assay run ./suite.yaml` gerçek bir skill'i gerçek bir hostta güvenilir ölçüyor.

## 1.1 — Gerçek adaptör

```
docs/host-feasibility.md'yi oku. En temiz sinyali veren host için gerçek
adaptörü yaz. Otonom çalış.

Prompt 0.5'teki HostAdapter arayüzünü uygula.

Erişemediğin her sinyal için { available: false, reason } dön. Varmış gibi
tasarlama, tahmin üretme, makul varsayılan koyma.

Fizibilite raporunda "kısmen" veya "düşük güvenilirlik" işaretlediğin her
sinyal için, adaptörün o durumda ne yaptığını açıkça test et ve raporla.

Yaz, gerçek bir skill üzerinde manuel doğrula, raporla.
```

---

## 1.2 — Runner, sandbox ve yerel store

```
packages/runner içinde koşum motorunu yaz. Otonom çalış.

Akış: Suite yükle → doğrula → her Case için N attempt → her attempt için
temiz sandbox → adaptörle koş → trace + env diff topla → assertion'ları
çalıştır → verdict üret → yerel store'a yaz.

Sandbox:
- Her attempt için izole çalışma dizini
- Öncesi/sonrası dosya sistemi snapshot'ı ve diff'i
- Ağ çağrılarının kaydı; deny politikasında engelleme
- Runner sandbox'ın temiz kurulduğunu kendi doğrulasın; doğrulayamazsa
  attempt UNKNOWN

İzolasyon teknolojisini kendin seç. Kriter: kurulum kolaylığı değil,
izolasyon güvenilirliği. Kararı kaydet.

Yerel store: SQLite veya dosya tabanlı. packages/core'daki kanonik kayıt
tiplerini kullan. Hosted DB Faz 2'de bu tiplerden türetilecek, o yüzden
şemayı buna göre kur — iki tarafın ayrışmasına izin verme.

Skorlama (packages/core içinde ayrı modül):
- Tetiklenme: precision, recall, F1
- Tamamlama oranı, pass@k
- Varyans ve Wilson güven aralığı
- Toplam token, süre, araç çağrısı sayısı

Oran döndüren hiçbir fonksiyon çıplak sayı dönmesin; { value, n, ciLow,
ciHigh } dönsün, tip seviyesinde zorla. UNKNOWN'lar orandan hariç tutulur
ama ayrıca sayılır.

Yaz, gerçek adaptörle uçtan uca koşum yap, çıktıyı raporla.
```

---

## 1.3 — Sandbox güvenlik incelemesi

**Not:** Tam güvenlik incelemesi Faz 3'te. Bu, sandbox'a özel ve erken yapılmalı — Faz 1'den itibaren kullanıcı kodu çalıştırıyoruz.

```
/security-review skilini kullan. Sadece sandbox yüzeyine odaklan.

İncele:
1. Sandbox kaçışı — test edilen ajan sandbox dışına çıkabilir mi?
2. Dosya sistemi sınırları — allowlist dışına yazma engelleniyor mu?
3. Ağ politikası — deny gerçekten engelliyor mu, yoksa sadece logluyor mu?
4. Kaynak tüketimi — bir koşum sonsuza kadar sürebilir mi, disk
   doldurabilir mi?
5. Sır sızıntısı — transkript ve artefaktlarda API key, token
6. Attempt'ler arası kirlenme — bir koşum diğerinin ortamını etkiliyor mu?

Kritik ve yüksek bulguları doğrudan düzelt. Her bulgu için şiddet, sömürü
senaryosu, ne yaptığın.
```

---

## 1.4 — CLI

```
packages/cli içinde komut satırı aracını yaz. Apache-2.0 yayınlanacak, o
kalitede. Otonom çalış.

Komutlar:
  assay init                  → örnek suite dosyası oluştur
  assay validate <suite.yaml> → sadece doğrula
  assay run <suite.yaml>      → koş, yerel rapor üret
  assay compare <a> <b>       → iki koşumu karşılaştır (pin kontrolüyle)
  assay ci                    → CI modu, eşik altında exit 1
  assay report <run-id>       → yerel raporu göster
  assay push <run-id>         → hosted platforma gönder (Faz 2, opsiyonel)

Kritik: CLI platform olmadan tam çalışmalı. push opsiyonel eklenti gibi
davransın.

Çıktı iki formatta: terminal (renkli, okunabilir) ve tek dosyalık HTML
rapor. HTML rapor paylaşılabilir olsun — bir PR'a veya Slack'e atılabilsin.

Her iki formatta da: UNKNOWN'lar ayrı ve dikkat çekici, oranların yanında
her zaman N ve güven aralığı. compare komutunda dört pin uyuşmuyorsa
karşılaştırma üretme; hangi pin'in değiştiğini söyle.

Apache-2.0 LICENSE, README, CONTRIBUTING. README'de gerçek olmayan rakam
veya rozet yok.

Yaz, ağ bağlantısı olmadan çalıştığını test et, raporla.
```

---

## 1.5 — GitHub Action

**Bu bir iç CI kurulumu değil, ürünün kendisi.** Kullanıcının kendi reposuna koyacağı Action.

```
Assay'i kullanıcıların repolarına kurulabilir bir GitHub Action haline
getir. Otonom çalış.

Hedef deneyim:
  pull request → skill dosyası değişti → assay run → regresyon tespit
  edildi → PR check FAILED, yorumda karne

Yap:
1. action.yml — girdi parametreleri: suite yolu, eşikler, host, model.
2. Action runner script'i — assay ci komutunu sarar.
3. PR yorumu — karne özeti: tetiklenme, tamamlama, UNKNOWN sayısı, önceki
   koşumla fark. Yorum her koşumda yenilenmeli, yeni yorum eklememeli.
4. Check annotation — hangi vaka neden başarısız oldu.
5. Artifact yükleme — HTML rapor.
6. examples/ altında kullanıma hazır workflow dosyası ve README.

Baseline yönetimi: karşılaştırılacak önceki koşum nereden gelecek? Artifact
mı, dosya mı, hosted mı? Kararı kendin ver ve kaydet. Faz 2'de hosted
baseline eklenecek, tasarımı buna açık tut.

Kendi repomuzda gerçek bir PR ile test et, sonucu raporla.
```

---

## 1.6 — Dogfooding

**Faz 1'in gerçek sınavı.**

```
Assay'i gerçek skill'ler üzerinde çalıştır ve ürünün gerçekten işe yarayıp
yaramadığını raporla. Otonom çalış.

Yap:
1. Herkese açık gerçek skill'lerden 3-5 tanesini seç (örneğin
   anthropics/skills reposundaki doküman skill'leri). Seçimini gerekçelendir.
2. Her biri için elle vaka seti yaz: pozitif, negatif ve yakın-komşu
   vakalar, artı en az bir tamamlama vakası.
3. Her suite'i en az 10 tekrarla koştur.
4. Sonuçları docs/dogfooding.md'ye yaz.

Raporda şunlar olsun:
- Her skill için tetiklenme precision/recall, tamamlama oranı, UNKNOWN
  sayısı ve nedenleri
- Hangi vaka tipleri güvenilir ölçülebildi, hangileri ölçülemedi
- no_swallowed_errors gerçek bir vakada tetiklendi mi
- Aracın kendisinde bulduğun hatalar ve eksikler
- Vaka seti yazma deneyimi: neresi zor, hangi hata mesajı yetersizdi

TON: Bu bir pazarlama metni değil, bir mühendislik raporu. Aracın
başarısız olduğu yerleri gizleme; asıl değerli bilgi orada.
```

**Faz geçiş kriteri:**

```
1 gerçek host
3-5 gerçek skill
her skill için positive + negative + near-neighbor
en az 10 tekrar
trigger PASS / FAIL / UNKNOWN üretiliyor
artifact doğrulaması çalışıyor
tool trace okunuyor
no_swallowed_errors gerçek bir vakada tetikleniyor
HTML ve terminal rapor
CI exit code doğru
```

Bunlar tutuyorsa çekirdek ürün riski büyük ölçüde çözülmüştür. Faz 2 ancak bundan sonra anlamlı.

---

# FAZ 2 — Hosted katman

## 2.1 — Veri modeli

```
packages/db içinde Prisma şemasını kur. Otonom çalış.

KRİTİK: packages/core'daki kanonik kayıt tiplerinden türet. Yerel store ile
hosted DB aynı kavramsal modeli paylaşmalı; ayrışmaya izin verme. Farklılık
gerekiyorsa gerekçesini kaydet.

Modeller: Suite, Case, Run, Attempt, TraceEvent, EnvDiff, AssertionResult.
Artı Auth.js için User, Account, Session, VerificationToken. User'a role
alanı (USER | ADMIN).

Zorunlu kısıtlar — DB seviyesinde:
- verdict UNKNOWN ise unknownReason NOT NULL (check constraint)
- Run'ın dört pin alanı NOT NULL
- Case.expectTriggered NOT NULL
Uygulama katmanında: Suite kaydedilirken en az bir trigger_negative vakası.

İndeksleme, cascade ve JSON alan stratejisini kendin belirle.

Yaz, migration üret, kısıtların çalıştığını testle kanıtla.
```

---

## 2.2 — Tema sistemi ve tasarım dili

```
/frontend-design skilini kullan. İki geçişli süreci tam uygula — onay
bekleme; kendi planını kendin eleştir ve koda geç.

apps/web ve packages/ui için tasarım sistemini kur.

BRIEF:
Assay, AI ajan skill'lerinin doğru çalışıp çalışmadığını ölçen bir
değerlendirme platformu. Kullanıcı, ajan geliştiren mühendis. Arayüzün
birincil işi ölçüm sonuçlarını kesinlik iddiası olmadan dürüstçe göstermek.
Ekranların çoğu yoğun sayısal veri — oranlar, güven aralıkları, tekrar
sayıları, iz akışları, diff'ler.

TASARIM YÖNÜ (bağlayıcı):
- Premium, editoryal, kurumsal estetik. Ölçüm aleti hissi, dashboard hissi
  değil. Ürünün adı metalürjik tahlilden geliyor; bu dünya bir referans
  noktası olabilir.
- Koyu mürekkep veya lacivert temelli koyu tema; açık tema eşdeğer
  kalitede, sonradan eklenmiş gibi durmayacak.
- Serif + sans eşleşmesi. Fraunces + Inter başlangıç noktası; daha iyi bir
  eşleşme bulursan kendi kararınla değiştir ve gerekçelendir.
- Hairline border, tabular numeral, ölçülü hareket.
- Gradient ve yumuşak gölge yok.

VERDICT RENKLERİ — kritik:
UNKNOWN yeşile ya da kırmızıya yakın hiçbir ton almayacak; nötr ama
görmezden gelinemeyecek bir muamele görecek. Renk tek taşıyıcı olmasın —
şekil veya işaret de farklılaşsın.

YAP:
1. Tasarım planı: 4-6 isimli hex ile palet, tipografi rolleri, layout
   konsepti (ASCII wireframe), ilkeler.
2. Kendi planını eleştir: hangi kısım herhangi bir SaaS için de
   üretebileceğin genel bir varsayılan? Değiştir.
3. Kod: CSS değişkeni token sistemi, koyu ve açık tema, Tailwind
   entegrasyonu, flash'sız tema geçişi, sistem tercihi desteği.

Planı, eleştiriyi ve ne değiştirdiğini raporla. İki temada ekran görüntüsü al.
```

---

## 2.3 — Bileşen katmanı

```
/impeccable ve /frontend-design skillerini kullan. Otonom çalış.

packages/ui içinde paylaşılan bileşen katmanı. Token sistemine tam uy —
hiçbir bileşen kendi rengini veya boşluğunu hardcode etmeyecek.
shadcn/ui temel alınacak ama varsayılan görünümüyle bırakılmayacak.

Bileşenler:
- Modal / Dialog, Alert, AlertDialog
- Warning box — info, warning, danger
- Confirm dialog — yıkıcı işlemler için
- Toast, Tooltip, Popover, Dropdown
- Table — tabular numeral, sıralanabilir, yoğun veri
- Badge — verdict durumları, renk + şekil farkı
- MetricValue — oran + N + güven aralığı. N olmadan render edilemesin;
  prop zorunlu ve TypeScript seviyesinde zorlanmış olsun.
- TraceViewer — araç çağrısı akışı, hata dönenler işaretli
- EmptyState, ErrorState

Yazım dili: aktif fiil, cümle düzeni büyük harf, hata mesajları özür
dilemez ve belirsiz olmaz, bir eylem akış boyunca aynı adı taşır.

Erişilebilirlik: görünür klavye odağı, modallarda focus trap,
reduced-motion, kontrast oranları.

/dev/components demo sayfası; her bileşen iki temada yan yana. Ekran
görüntüsü al, kendi çıktını incele, düzelt, raporla.
```

---

## 2.4 — Dashboard

```
apps/web içinde dashboard'u yaz. packages/ui bileşenlerini kullan.
Otonom çalış. Veri gerçekliği kuralı geçerli: ekrandaki her sayı gerçek
bir koşumdan gelecek. Faz 1'de ürettiğin dogfooding koşumlarını seed
olarak kullan.

Ekranlar:
1. Suite listesi
2. Suite detayı — vakalar, geçmiş koşumlar, trend
3. Koşum detayı (skill karnesi) — ana ekran:
   - Tetiklenme: precision / recall / F1, her biri N ve güven aralığıyla
   - Tamamlama oranı, pass@k
   - Varyans ve flaky işaretlemesi
   - UNKNOWN sayısı ve nedenleri — ayrı, göz ardı edilemez bölüm
   - Maliyet ve süre
4. Attempt detayı — iz görüntüleyici, yutulan hata uyarısı, ortam diff'i
5. Regresyon karşılaştırma — dört pin uyuşmuyorsa karşılaştırma gösterme;
   hangi pin'in değiştiğini açıkla.

Kritik: hiçbir oran çıplak yüzde değil; UNKNOWN hiçbir ekranda gizlenmez;
veri yoksa yönlendirici EmptyState.

Her ekranı bitirince ekran görüntüsü al, incele, düzelt.
```

---

## 2.5 — Kimlik doğrulama

```
apps/web içinde Auth.js (NextAuth v5) kurulumu. Otonom çalış.

Sağlayıcılar:
1. Credentials — e-posta + parola, Argon2id. Kayıt, e-posta doğrulama,
   parola sıfırlama.
2. Google OAuth.

Gereksinimler:
- Prisma adapter, database session
- Aynı e-posta ile iki yöntem kullanımında hesap birleştirme: sessiz
  birleştirme yok, açık onay
- Rate limiting: giriş ve parola sıfırlama
- Rol tabanlı erişim, middleware ile /admin koruması
- CSRF, secure cookie, session rotation

Ayrıca CLI'ın push komutu için API token mekanizması: token üretme,
listeleme, iptal etme.

Google OAuth credential'ları için .env.example'a placeholder koy ve
raporunda hangi değerlerin gerektiğini listele.

Auth sayfalarını mevcut tema ile biçimlendir.

Yaz, E2E testlerini kur, koş, raporla.
```

---

## 2.6 — Admin panel

```
apps/web içinde /admin bölümü. Sadece ADMIN erişebilir. Otonom çalış.

Ekranlar: kullanıcı yönetimi, ekip yönetimi, koşum izleme, sistem sağlığı
(sandbox kullanımı, kuyruk, adaptör durumu), kullanım ve kota, denetim kaydı.

Güvenlik:
- Her yıkıcı işlem confirm dialog ister
- Rol değiştirme ve askıya alma audit log'a yazar
- Admin bir kullanıcının verisini görüntülediğinde loglanır
- Kendi rolünü düşürme engellenir; son admin silinemez

Görsel dil dashboard'la aynı; ayrı tasarım dili üretme.
```

---

## 2.7 — Tanıtım sayfası

```
/frontend-design skilini kullan. İki geçişli süreci uygula.

apps/web içinde landing page. Otonom çalış.

BRIEF:
Hedef kitle: AI ajanı ve skill geliştiren mühendisler. Bugün skill'lerini
elle deneyip "sanırım çalışıyor" diyorlar.

Konumlandırma cümlesi: Agent Skills için CI test koşum aracı.

Anlatılacak temel fikirler, satış dili olmadan:
- Tek koşum yalan söyler. Aynı test 10 kez koşulduğunda %60 çıkabilir.
- Çıktı doğru görünse bile süreç bozuk olabilir: araç hata döner, ajan
  yutup "tamamlandı" der.
- "Bilinmiyor" gerçek bir sonuçtur ve gizlenmez.

Hero: varsayılan çözüm büyük başlık ve gradient aksan — kullanma. Bu ürünün
dünyasındaki en karakteristik şey ölçümün kendisi. Faz 1 dogfooding'inden
çıkan GERÇEK bir karneyi, gerçek bir iz akışını veya 10 tekrarın gerçek
dağılımını hero'ya koy. Uydurma çıktı kullanma.

Bölümler: hero, problem, nasıl çalışır, açık kaynak SDK ve GitHub Action,
fiyatlandırma, SSS, footer. Fiyatlandırma rakamlarını kendin öner,
kaydet, sayfada taslak olduğunu belli et.

Rakam uydurma — gerçek olmayan müşteri sayısı, test sayısı, logo, referans
yok.

Koyu ve açık temada eşit kalitede, mobilde tam çalışsın.
```

---

# FAZ 3 — Sağlamlaştırma

## 3.1 — Tam güvenlik incelemesi

```
/security-review skilini kullan. Tüm kod tabanı. Otonom çalış.

1. Sandbox kaçışı (Faz 1'deki incelemeyi tekrar et, yeni yüzeyleri ekle)
2. Auth: session, hesap birleştirme, rol yükseltme, API token
3. Çok kiracılı veri izolasyonu
4. Sır sızıntısı — transkript ve loglarda
5. Injection: SQL, komut, prompt
6. Rate limiting ve kaynak tüketimi
7. Bağımlılık güvenliği

Kritik ve yüksek bulguları düzelt. Orta/düşük olanları düzelt veya
gerekçesiyle ertele. Geri alınamaz değişiklik gerekiyorsa dur ve bildir.
```

---

## 3.2 — Test ve CI

```
Test altyapısını tamamla. Otonom çalış.

- packages/core: unit test, özellikle no_swallowed_errors ve güven aralığı
- packages/runner: MockAdapter ile entegrasyon testi
- apps/web: E2E (Playwright) — kayıt, giriş, Google OAuth, suite
  oluşturma, koşum görüntüleme, tema geçişi
- Erişilebilirlik: axe
- Görsel regresyon: /dev/components, iki tema

GitHub Actions: lint, typecheck, test, build. Ana dala doğrudan push kapalı.

Kendi ürünümüzü kendi üzerimize uygula: repo içinde örnek bir suite CI'da
koşsun.

Kapsam eşiklerini kendin belirle ve gerekçelendir.
```

---

## 3.3 — Deploy

```
Dokploy VPS'e deploy hazırlığı. Otonom çalış.

- Dockerfile (multi-stage, pnpm monorepo)
- docker-compose: web, postgres, worker
- Ortam değişkeni şeması ve doğrulama
- Migration stratejisi
- Sandbox worker'ı için kaynak limitleri ve izolasyon
- Yedekleme: veritabanı ve koşum artefaktları
- Sağlık kontrolü uçları

Sırları .env.example'da placeholder bırak, hangilerinin doldurulması
gerektiğini listele. Gerçek deploy'u sen yapma; hazırlığı tamamla,
komutları belgele.
```

---

# Sonraki dalga (roadmap'e yaz, şimdi yapma)

**Skill Collision Testing.** Aynı hostta birden çok skill aktifken hangisinin yanlış tetiklendiğini sistematik ölçen çarpışma matrisi. Şema desteği 0.3'te hazır (`active_skills`), motor Faz 2 sonrası.

**Model Update Certification.** Kullanıcının tüm skill'lerini eski ve yeni model altında koşturup "47 güvenli, 2 regresyon, 1 bilinmiyor" raporu üretmek. Kurumsal satın alma gerekçesi büyük ihtimalle burada.

**Çapraz-host uyumluluk matrisi.** Bir skill'in Claude Code, Codex ve Copilot altında nasıl davrandığı. Agent Skills açık standart olduğu için bu, vendor-bağımsız bir güvenilirlik katmanı olma yolu.

---

# Denetim noktaları

Otonom modda sessizce aşınan şeyler. Her rapor sonrası kontrol et:

- `docs/decisions.md` gerçekten dolduruluyor mu
- Verdict hâlâ üç durumlu mu, UNKNOWN "hata" kovasına taşınmış mı
- Oranlar bir yerde çıplak yüzdeye dönmüş mü
- `runs` varsayılanı 1'e çekilmiş mi
- Sinyal okunamadığında makul bir varsayılan üretilmiş mi
- LLM judge "sadece şurada" diye eklenmiş mi
- Arayüzde uydurma veri belirmiş mi
- Yerel store ile hosted şema ayrışmaya başlamış mı

Bunlar tek tek makul gerekçelerle gelir. Hepsi kabul edildiğinde ürünün tek farkı kalmaz.
