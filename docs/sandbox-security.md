# Sandbox Güvenlik İncelemesi

**Tarih:** 2026-08-31 · **Adım:** 1.3 · **Kapsam:** yalnızca sandbox yüzeyi.
Auth, admin ve veri sınırları Faz 3'te.

Faz 1'den itibaren kullanıcı kodu — ölçülen skill'in yönlendirdiği bir ajan —
bizim makinemizde koşuyor. Bu rapor o yüzeyi altı başlıkta inceliyor, bulunan
kritik ve yüksek şiddetli açıkları kapatıyor ve **kapatılamayanları açıkça
yazıyor.**

## Tehdit modeli

Saldırgan **ölçülen skill'in kendisi.** İki yoldan gelir:

1. Kötü niyetli bir skill — kullanıcı üçüncü taraf bir skill'i ölçüyor.
2. Prompt injection — skill masum ama işlediği veri (fixture, web içeriği)
   ajanı yönlendiriyor.

Kazanmak istediği şeyler: sandbox dışına yazmak, ağa çıkmak, koşumu yürüten
makinenin sırlarını okumak, ölçümü kendi lehine bozmak.

**Assay bir hapishane değil.** Ajanın izolasyonunu host sağlıyor; Assay
gözlemliyor ve raporluyor. Bu rapor o sınırı ölçüyor.

---

## Bulgular

| # | Şiddet | Bulgu | Durum |
|---|---|---|---|
| H1 | Yüksek | Ajan sürecine tüm ortam değişkenleri aktarılıyordu | ✅ kapatıldı |
| H2 | Yüksek | Kanıt yakalama sınırsızdı — koşum aracını düşürebilir | ✅ kapatıldı |
| H3 | Yüksek | Koşum kayıtları sır içerebilirdi ve CI artefaktı olarak yükleniyor | ✅ kapatıldı |
| H4 | Yüksek | `bypassPermissions` serbestçe seçilebiliyordu | ✅ kapatıldı |
| M1 | Orta | Kabuk komutlarının yan etkisi görünmüyor, ama iddia ölçülmüş sayılıyordu | ✅ kapatıldı |
| M2 | Orta | Ajana kullanıcının canlı skill dizini veriliyordu | ✅ kapatıldı |
| A1 | Kabul edilen | Dosya sistemi ve ağ sınırı host'un izin katmanına dayanıyor | ⚠️ açık, belgelendi |
| A2 | Kabul edilen | Disk ve CPU kotası yok | ⚠️ açık, belgelendi |

---

### H1 — Tüm ortam ajana aktarılıyordu (Yüksek)

**Neydi.** `ClaudeCodeAdapter.start` alt sürece `{ ...process.env }` geçiriyordu.

**Sömürü.** Ölçülen skill `Bash` ile `env` çalıştırır ya da ajandan
"print your environment" ister. CI'da bu, `GITHUB_TOKEN`, deploy anahtarları
ve diğer sırlar demek. Değerler ajanın çıktısına, oradan iz kaydına, oradan da
yüklenen artefakta düşer.

**Ne yapıldı.** Ortam artık **allowlist**: `PATH`, `HOME`/`USERPROFILE`,
`TEMP`, `SystemRoot`, `PATHEXT`, dil/saat dilimi, proxy ayarları ve host'un
kendi `ANTHROPIC_BASE_URL`'i. Kimlik bilgisi ayrıca ekleniyor. Bunun dışında
hiçbir değişken geçmiyor.

Kalan risk: kimlik bilgisinin kendisi ajanın ortamında. Host'un çalışması için
şart. Bunun için token kullanılmalı, hesap parolası değil; ve token yalnızca
ölçüm için üretilmiş olmalı.

### H2 — Kanıt yakalama sınırsızdı (Yüksek)

**Neydi.** `captureFiles` çalışma dizinindeki **her dosyayı belleğe**
okuyordu.

**Sömürü.** Skill bir döngüde 10 GB dosya üretir. Assay onu belleğe almaya
çalışır ve koşum aracı ölür. Ölçüm aracını ölçtüğü şeyle düşürmek, hem DoS hem
de sonucu bastırmanın yolu.

**Ne yapıldı.** `capture()` sınırlı: dosya başına 8 MB, toplam 64 MB. Sınırı
aşan dosyaların **adları kaydediliyor** ve attempt'in gerekçesine ekleniyor —
sessizce yok sayılmıyorlar, yoksa "dosya yok" diye yanlış bir `fail` üretirdi.

### H3 — Kayıtlar sır içerebilirdi (Yüksek)

**Neydi.** İz (`trace`) araç argümanlarını ve ajan metinlerini olduğu gibi
saklıyordu. GitHub Action bu kayıtları `assay-runs` artefaktı olarak
yüklüyor.

**Sömürü.** Ajan bir sırrı ekrana basar (kendi ortamından, bir fixture'dan,
`curl` çıktısından). Sır kayda girer, artefakta yüklenir; artefaktlar repoya
erişimi olan herkese açıktır.

**Ne yapıldı.** `packages/core/src/redact.ts` — kayıt yazılmadan önce iz,
ortam farkı ve gerekçe metinleri maskeleniyor. Tanınan biçimler: Anthropic
API anahtarı ve OAuth token'ı, OpenAI (yeni ve eski), GitHub, AWS, Google,
Slack, private key bloğu.

Maskeleme sırrın **varlığını** siliyor değil, **değerini**:
`[redacted:github-token]`. Ne tür bir sır sızdığını bilmek, hiç iz
bırakmamaktan iyidir.

**Tavan, açıkça:** yalnızca tanınan biçimler yakalanır. Şirket içi özel bir
token biçimi geçerse görülmez. Bu yüzden maskeleme H1'in yerine geçmez;
ikinci savunma hattıdır.

### H4 — `bypassPermissions` serbestti (Yüksek)

**Neydi.** Adaptör seçeneği `permissionMode: 'bypassPermissions'` kabul
ediyordu. O modda host hiçbir aracı sormadan çalıştırır.

**Sömürü.** Bir kullanıcı "izin istemleri koşumu bloke ediyor" diye bu modu
açar. O andan itibaren ölçülen skill, koşumu yürüten kullanıcının bütün
yetkileriyle rastgele komut çalıştırabilir. CI'da bu, repo yazma yetkisi ve
tüm secret'lar demek.

**Ne yapıldı.** Bu mod artık `allowBypassPermissions: true` olmadan hata
fırlatıyor:

> permissionMode "bypassPermissions" removes every boundary the sandbox
> observes; pass allowBypassPermissions: true to state that you meant it

CLI bu seçeneği hiç sunmuyor. Kapı kapalı değil ama üzerine yazı asıldı.

### M1 — Kabuk komutları yan etki iddiasını sessizce geçiriyordu (Orta)

**Neydi.** `EnvDiff.writes` iki kaynaktan geliyor: çalışma dizini anlık
görüntü farkı ve izdeki `Write`/`Edit` çağrılarının yolları. Bir kabuk komutu
(`Bash`, `PowerShell`) ikisinde de görünmez: `echo x > /etc/y` ne çalışma
dizinini değiştirir ne de `Write` aracı üretir.

**Sömürü.** Suite `side_effect: { writes_within: ['out/'], network: deny }`
diyor. Skill `Bash` ile sandbox dışına yazıyor ve `curl` ile ağa çıkıyor.
Assay hiçbirini görmüyor ve assertion **`pass`** dönüyordu — tam olarak
değişmez #1'in yasakladığı sessiz pass.

**Ne yapıldı.** Kabuk araçları `EnvDiff.unobserved` listesine giriyor ve
`side_effect` assertion'ı o liste boş değilse **`unknown`** üretiyor:

> the run used Bash, whose side effects Assay cannot observe, so the recorded
> writes and network calls may be incomplete

Reddedilen kabuk çağrısı listeye girmiyor — çalışmamış bir komut yan etki
üretmez.

Bunun bedeli gerçek: kabuk kullanan her skill'in yan etki katmanı `unknown`
olur. Doğru bedel bu; alternatifi ölçmediğini ölçtüm demek.

### M2 — Ajana canlı skill dizini veriliyordu (Orta)

**Neydi.** `--plugin-dir` kullanıcının gerçek skill dizinini gösteriyordu.

**Sömürü.** Ajan `SKILL.md`'yi değiştirir. Sonraki attempt'ler değişmiş
skill'i ölçer; N tekrarın tamamı kirlenir ve kullanıcının deposundaki dosya
sessizce değişmiş olur. Canlı koşumda ajanın skill dizinine yazmayı **denediği
görüldü** (host reddetti, ama bu bizim değil host'un sınırıydı).

**Ne yapıldı.** Koşum başında skill dizini geçici bir kopyaya alınıyor;
ajana kopya veriliyor, koşum sonunda siliniyor. Pin 1'in içerik hash'i
**kopyalamadan önce** kaynaktan hesaplanıyor.

---

## Kabul edilen riskler

Bunlar kapatılmadı. Kapatılmamış olmaları bir eksiklik değil, bilinçli bir
kapsam kararı — ama kullanıcının bilmesi gerekiyor.

### A1 — Dosya sistemi ve ağ sınırı host'a dayanıyor

Assay işletim sistemi seviyesinde bir jail kurmuyor. Ajan çalışma dizini
dışına yazamıyorsa bunun sebebi **Claude Code'un kendi izin katmanı**,
Assay değil.

Canlı koşumda bu sınır tuttu: ajan `D:\assay\examples\...` altına yazmayı
denedi ve host reddetti. Ama bu, Assay'in verdiği bir garanti değil; host'un
davranışı sürümle değişebilir.

Ağ da öyle: `WebFetch`/`WebSearch` host tarafından reddediliyor. Süreç kendi
başına soket açarsa (kabuk üzerinden `curl`) Assay bunu görmez — M1 tam olarak
bu yüzden `unknown` üretiyor.

**Yükseltme yolu:** konteyner tabanlı sandbox. Yığında bilinçli olarak yok
([stack.md](stack.md)); bu rapor onu artık gerekçelendiriyor ve Faz 3
değerlendirmesine bırakıyor. Docker'ı bugün eklemek, ölçülmemiş bir şeye
altyapı yazmak olurdu; bugün ölçüldü.

### A2 — Disk ve CPU kotası yok

Attempt başına zaman aşımı var (varsayılan 600 sn) ve kanıt yakalama sınırlı
(H2). Ama ajan çalışma dizinini diski doldurana kadar şişirebilir; yakalama
sınırı belleği korur, diski korumaz.

**Yükseltme yolu:** yine konteyner (`--memory`, `--pids-limit`, tmpfs kotası).

---

## Attempt'ler arası kirlenme

Rapor bunu ayrı bir başlık olarak sorguladı; sonuç temiz:

| Kaynak | Durum |
|---|---|
| Çalışma dizini | Attempt başına ayrı `mkdtemp`, sonunda siliniyor ✅ |
| Host config | Attempt başına ayrı `CLAUDE_CONFIG_DIR` ✅ |
| Skill dizini | Koşum başına kopya, ajan kaynağa dokunamıyor ✅ (M2) |
| Ortam değişkenleri | Allowlist, süreçler arası taşıma yok ✅ (H1) |
| Koşum kaydı | Attempt'ler ayrı yazılıyor ✅ |

Test: `runSuite — her attempt kendi çalışma dizininde koşar` ve
`tüm attempt'ler aynı kopyayı kullanır, kaynağa dokunulmaz`.

---

## Doğrulama

Bütün düzeltmelerden sonra örnek suite gerçek host üzerinde yeniden koşuldu:

```
run run-2026-08-31T17-22-09-055Z-2c9a7995  PASS
  trigger precision 100% (N=4, 95% CI 51%–100%)
  8 attempts · 8 tool calls · $0.1997 · 60.0s
```

Sertleştirme ölçümü bozmadı. 431 test geçiyor; her bulgu için en az bir test:

| Bulgu | Test |
|---|---|
| H1 | `ortam allowlist'i — H1`, 3 vaka |
| H2 | `capture — kaynak tüketimi sınırı`, 3 vaka |
| H3 | `redact`, 8 sır biçimi + `redactDeep` iç içe nesnelerde |
| H4 | `güvenlik sınırları — bypassPermissions bilerek istenmedikçe reddedilir` |
| M1 | `envDiff — gözlenemeyen yan etki yüzeyi` + `side_effect ... unknown` |
| M2 | `runSuite — skill dizini korunur` |

H1'in testi `passthroughEnv`'i doğrudan çağırıyor: ortama `GITHUB_TOKEN` ve
uydurma bir sır konuluyor, çıkan ortamda ikisinin de olmadığı ve `PATH`'in
olduğu doğrulanıyor.

Kalan boşluk: alt sürecin *gerçekten* bu ortamı gördüğü uçtan uca
kanıtlanmadı — bunun için sahte bir host çalıştırılabiliri gerekiyor.
Fonksiyon ile çağrı yeri arasındaki tek satır (`...passthroughEnv()`) kod
incelemesine bırakıldı.
