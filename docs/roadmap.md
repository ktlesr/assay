# Yol Haritası

Dört faz. Sıra bir ilkeye dayanıyor: **önce host sinyalini kanıtla, sonra
SaaS'ı inşa et.** Faz 0 ve 1 bitmeden Faz 2'ye geçilmez.

Her adımın somut bir çıktısı var. Çıktı üretilmeden adım kapanmaz.

---

## FAZ 0 — Fizibilite

**Amaç:** Assay'in gerçekte neyi kanıtlayabileceğini belirlemek. Bu fazın
çıktısı git/gitme kararıdır.

| Adım | Çıktı |
|---|---|
| 0.1 Proje anayasası | Repo hijyeni, CLAUDE.md, `docs/` (product, invariants, stack, decisions, workflow, roadmap) |
| 0.2 Monorepo iskeleti | pnpm workspace, paketler, ortak tsconfig, bağımlılık kuralının ihlal yakaladığını kanıtlayan test |
| 0.3 Vaka seti şeması | YAML şeması + Zod doğrulayıcı; negatif vaka zorunluluğu şema seviyesinde |
| 0.4 Assertion motoru | Deterministik assertion'lar, üç durumlu verdict üretimi |
| 0.5 Adaptör arayüzü | Host adaptör sözleşmesi + MockAdapter (yalnızca test aracı) |
| 0.6 Host fizibilite spike ⚠️ | `docs/host-feasibility.md` — Claude Code / Codex / Copilot için dört sinyalin okunabilirlik matrisi |

### Faz 0 → Faz 1 geçiş kriteri

En az bir hostta **trigger sinyali orta veya yüksek güvenilirlikle**
okunabiliyor olmalı.

Okunamıyorsa ürünün kapsamı yeniden tanımlanmalı: tetiklenme katmanı
olmadan Assay bir ajan entegrasyon testi aracına dönüşür ve o alanda
rekabet çok daha sert. Bu durumda 0.6 raporundan sonra durulur.

0.6 tamamlanmadan Faz 1'e geçilmez.

---

## FAZ 1 — CLI ürünü

**Amaç:** `assay run ./suite.yaml` gerçek bir skill'i gerçek bir hostta
güvenilir ölçüyor.

| Adım | Çıktı |
|---|---|
| 1.1 Gerçek adaptör | 0.6'da en temiz sinyali veren host için çalışan adaptör |
| 1.2 Runner, sandbox ve yerel store | Sandbox içinde N tekrarlı koşum, kanonik kayıt, `.assay/runs/` dosya store |
| 1.3 Sandbox güvenlik incelemesi | Sandbox kaçış yüzeyi raporu ve kapatılan açıklar |
| 1.4 CLI | `assay run`, terminal ve HTML rapor, doğru CI exit code |
| 1.5 GitHub Action | PR'da koşan action |
| 1.6 Dogfooding | `docs/dogfooding.md` — 3–5 gerçek skill üzerinde mühendislik raporu |

### Faz 1 → Faz 2 geçiş kriteri

Hepsi birden tutmalı:

- 1 gerçek host üzerinde koşuyor
- 3–5 gerçek skill ölçüldü
- Her skill için pozitif + negatif + yakın-komşu vakası var
- En az 10 tekrarla koşuldu
- Trigger için `pass` / `fail` / `unknown` üretiliyor
- Artefakt doğrulaması çalışıyor
- Araç çağrısı izi okunuyor
- `no_swallowed_errors` gerçek bir vakada tetiklendi
- HTML ve terminal rapor var
- CI exit code doğru

Bunlar tutuyorsa çekirdek ürün riski büyük ölçüde çözülmüştür. Faz 2 ancak
bundan sonra anlamlı.

---

## FAZ 2 — Hosted katman

**Amaç:** Geçmiş, regresyon karşılaştırması, ekip görünürlüğü.

| Adım | Çıktı |
|---|---|
| 2.1 Veri modeli | `packages/db` Prisma şeması, `core` kanonik tiplerinden türetilmiş |
| 2.2 Tema sistemi ve tasarım dili | Koyu/açık tema, tokenlar, `/dev/components` ayakta |
| 2.3 Bileşen katmanı | `packages/ui` — oran gösterimi N ve GA olmadan render edilemez |
| 2.4 Dashboard | Koşum geçmişi, regresyon görünümü, EmptyState |
| 2.5 Kimlik doğrulama | Auth.js, rol alanı |
| 2.6 Admin panel | Kullanıcı ve koşum yönetimi |
| 2.7 Tanıtım sayfası | Yalnızca gerçek koşum çıktısı; uydurma rakam, logo, referans yok |

### Faz 2 → Faz 3 geçiş kriteri

- Yerel store ve hosted şema aynı kanonik modeli paylaşıyor, ayrışma yok
- Dashboard'daki her sayı gerçek bir koşumdan geliyor
- Hiçbir oran N ve güven aralığı olmadan render edilmiyor
- `unknown` ayrı bir durum olarak gösteriliyor, hata kovasına düşmüyor

---

## FAZ 3 — Sağlamlaştırma

| Adım | Çıktı |
|---|---|
| 3.1 Tam güvenlik incelemesi | Sandbox, auth, admin ve veri sınırlarının raporu |
| 3.2 Test ve CI | Kapsam eşiği, CI pipeline'ı yeşil |
| 3.3 Deploy | Dokploy üzerinde çalışan kurulum |

---

## 0.2.0 — Sandbox tavanı: reddedilen komut

**Amaç:** Ölçümün "skill bunu yapamadı" ile "Assay buna izin vermedi"yi
ayırması.

Adaptör `--permission-mode acceptEdits` ile koşuyor: `Write` serbest, kabuk
çalıştırma onay bekliyor ve etkileşimsiz koşumda onaylayacak kimse yok. Redde
ait metin izde duruyor ama sınıflandırılmıyor, dolayısıyla iki farklı
başarısızlık aynı görünüyor. Ölçüldü: `webapp-testing` tamamlama koşumunda
10 denemenin 10'unda en az bir kabuk çağrısı reddedildi ve 4'ü
`no_swallowed_errors`'ı tetikledi ([measurements.md](measurements.md),
[blockers.md](blockers.md)).

| Adım | Çıktı |
|---|---|
| 0.2.0-a Reddi sınıflandır | `TraceEvent.refusal`; izin reddi yüzünden düşen artefakt assertion'ı `fail` değil `unknown` üretir |
| 0.2.0-b Redde ayrı cümle | `no_swallowed_errors` "gerçek hata bildirilmedi" ile "Assay'in reddi bildirilmedi"yi ayrı raporlar |
| 0.2.0-c Komut allowlist'i | Vaka seti `sandbox: { allow_commands: [...] }` beyan eder; runner host'un `--allowedTools` biçimine çevirir, izin genişlemesi `suiteHash`'e girer |

**Geçiş kriteri.** Bir kabuk çalıştıran tamamlama vakası, komut allowlist'i
verildiğinde `pass`/`fail` üretebiliyor; verilmediğinde `unknown` üretiyor ve
sebebini yazıyor. Hiçbir durumda izin reddi `fail` olarak raporlanmıyor.

**Neden konteyner değil.** Konteyner sandbox (A1'in yükseltme yolu) bu üçünü de
gereksiz kılmaz: konteynerin içinde de bir izin modeli seçmek gerekiyor. Sıra
bu yüzden böyle — önce ölçümün dürüstlüğü, sonra izolasyonun sertliği.
Konteyner Faz 3'te kalıyor ([sandbox-security.md](sandbox-security.md), A1).

---

## Sonraki dalga

Faz 3'ten sonra değerlendirilecek. **Şimdi yapılmayacak.**

**Skill collision testing.** Aynı hostta birden çok skill aktifken hangisinin
yanlış tetiklendiğini sistematik ölçen çarpışma matrisi. Şema desteği 0.3'te
hazırlanır (`active_skills` alanı), motor Faz 2 sonrasına kalır. Ekosistemin
gerçek sorunu tek skill'de değil, çakışmada.

**Model update certification.** Kullanıcının skill setini eski ve yeni model
altında koşturup "47 güvenli, 2 regresyon, 1 bilinmiyor" raporu üretmek.
Kurumsal satın alma gerekçesi büyük ihtimalle burada.

**Çapraz-host uyumluluk matrisi.** Bir skill'in Claude Code, Codex ve Copilot
altında nasıl davrandığı. Agent Skills açık bir standart olduğu için bu,
vendor-bağımsız bir güvenilirlik katmanı olma yolu.

Faz 1'e çekilmesi 0.6'da değerlendirildi ve **reddedildi**: Codex tetiklenmeyi
yapısal bir olay olarak yayınlamıyor (tek kanıt asistan mesajının serbest
metni) ve skill seti izole edilemiyor. Ölçülemeyen bir şeye adaptör yazmak
olurdu. Yapısal bir skill olayı çıktığı gün yeniden değerlendirilecek —
`codex exec --json` akışının geri kalanı zaten yeterli.
Ayrıntı: [host-feasibility.md](host-feasibility.md).

---

## Denetim noktaları

Otonom modda sessizce aşınan şeyler. Her rapordan sonra kontrol edilir:

- `docs/decisions.md` gerçekten dolduruluyor mu
- Verdict hâlâ üç durumlu mu; `unknown` "hata" kovasına taşınmış mı
- Oranlar bir yerde çıplak yüzdeye dönmüş mü
- Tekrar varsayılanı 1'e çekilmiş mi
- Sinyal okunamadığında makul bir varsayılan üretilmiş mi
- LLM judge "sadece şurada" diye eklenmiş mi
- Arayüzde uydurma veri belirmiş mi
- Yerel store ile hosted şema ayrışmaya başlamış mı

Bunların her biri tek başına makul bir gerekçeyle gelir. Hepsi kabul
edildiğinde ürünün tek farkı kalmaz.
