# Host Fizibilite Raporu

**Tarih:** 2026-08-31 · **Adım:** 0.6 · **Amaç:** Assay'in gerçekte neyi
kanıtlayabileceğini belirlemek. Bu raporun sonundaki değerlendirme Faz 1'e
geçilip geçilmeyeceğini belirler.

Bu bir mühendislik raporudur. Deneyle görülen ile belgeden okunan ayrı ayrı
işaretlenmiştir. Doğrulanamayan her iddia **DOĞRULANMADI** etiketi taşır.

---

## Matris

| Host | Skill discovery | Trigger observable | Tool trace | Completion | Genel |
|---|---|---|---|---|---|
| **Claude Code** | Evet — **yüksek** ✅ deneyle | Kısmen — **yüksek** (model seçtiğinde) ✅ deneyle | Evet — **yüksek** ✅ deneyle | Evet — **orta** ✅ deneyle | **Ölçülebilir** |
| **OpenAI Codex** | Evet — **orta** 📄 belge | Kısmen — **düşük** 📄 belge | Evet — **orta** 📄 belge | Evet — **orta** 📄 belge | **Muhtemelen ölçülebilir, doğrulanmadı** |
| **GitHub Copilot** | Evet — **orta** 📄 belge | Kısmen — **düşük** 📄 belge | Kısmen — **düşük** 📄 belge | Kısmen — **düşük** 📄 belge | **Belirsiz, doğrulanmadı** |

✅ = bu makinede deneyle görüldü · 📄 = yalnızca belgeden okundu, **DOĞRULANMADI**

---

## Claude Code — deneyle doğrulandı

**Sürüm:** 2.1.251 · **Yöntem:** Tek kullanımlık bir plugin (`assay-probe`)
yazıldı, `--plugin-dir` ile oturuma yüklendi, `claude -p --output-format
stream-json --verbose` ile üç koşum yapıldı ve çıktı incelendi. Ayrıca bu
makinedeki 245 gerçek oturum transkripti (`~/.claude/projects/**/*.jsonl`)
tarandı.

### A. Skill discovery — Evet, güvenilirlik **yüksek** ✅

Koşumun ilk olayı `system/init` ve aktif kurulumun tamamını taşıyor:

```json
{ "type": "system", "subtype": "init",
  "session_id": "...", "cwd": "...", "model": "claude-haiku-4-5-20251001",
  "permissionMode": "dontAsk", "claude_code_version": "2.1.251",
  "tools": [27 ad], "skills": [119 ad], "agents": [10 ad],
  "plugins": [{ "name": "assay-probe", "path": "...", "source": "assay-probe@inline", "version": "0.0.1" }],
  "memory_paths": { "auto": "..." } }
```

Kontrol kaldıraçları da var ve çalışıyor:

| Kaldıraç | Ne yapar | Durum |
|---|---|---|
| `--plugin-dir <path>` | Skill'i yalnızca bu oturuma yükler | ✅ doğrulandı — `plugins` listesinde `assay-probe@inline` göründü |
| `CLAUDE_CONFIG_DIR=<temiz dizin>` | Kullanıcının global skill'lerini devre dışı bırakır | ✅ doğrulandı — skill sayısı **119 → 19**'a düştü, `plugins` yalnızca `assay-probe` |
| `--disable-slash-commands` | Tüm skill'leri kapatır | 📄 belgeden |
| `--bare` | Plugin sync, CLAUDE.md keşfi, auto-memory kapalı | ⚠️ **ANTHROPIC_API_KEY gerektirir** (aşağıya bakınız) |

**Bulgu:** Assay'in dört pininden birini (aktif skill seti) *ölçebilmek* değil,
*kontrol edebilmek* gerekiyor ve bu mümkün. Bu, coexistence testinin şemada
bugün yer almasını da haklı çıkarıyor.

### B. Trigger observability — Kısmen, güvenilirlik **yüksek** ✅

İki farklı çağrı yolu var ve **yalnızca biri gözlenebilir:**

**1. Model kendi seçtiğinde → açık `Skill` tool_use.** Gerçek transkriptlerden
(12 dosyada bulundu):

```json
{ "type": "tool_use", "id": "toolu_016jYvaCUg3W1FX6vvCDVbWQ",
  "name": "Skill",
  "input": { "skill": "frontend-design", "args": "..." } }
```

Skill kimliği `input.skill` alanında, metinden çıkarım yok, belirsizlik yok.
**Assay'in ölçmek istediği tam olarak bu yol** — tetiklenme doğruluğu, modelin
seçim yapmasıyla ilgilidir.

**2. Kullanıcı `/skill-adı` yazdığında → `Skill` tool_use YOK.** ✅ deneyle:
`claude -p "/assay-probe"` koşumu skill'in gövdesini çalıştırdı
(`ASSAY_PROBE_FIRED` çıktısı geldi) ama akışta hiç `tool_use` görünmedi. CLI
slash komutunu kendisi çözüyor ve skill içeriğini bağlama enjekte ediyor.

**Sonuç:** Assay tetiklenmeyi model seçtiğinde güvenilir okur; kullanıcının
elle çağırdığı yolu okuyamaz. Bu bir kısıt değil, doğru davranış — elle
çağrılan bir skill'in "tetiklenme doğruluğu" diye bir ölçüsü yoktur.

**DOĞRULANMADI:** Bir skill'in içeriğinin `Skill` tool_use olmadan otomatik
enjekte edildiği üçüncü bir yol olup olmadığını kanıtlayamadım. Yokluğu
kanıtlanamaz; adaptör bu ihtimale karşı `complete: false` bildirmelidir.

### C. Structured trace — Evet, güvenilirlik **yüksek** ✅

`stream-json` akışı ve disk transkripti aynı yapıyı taşıyor:

- `tool_use` blokları: `id`, `name`, `input` (tam argümanlar)
- `tool_result` blokları: `is_error: true|false`, `content`
- `assistant` mesajları: `thinking` ve `text` blokları ayrı ayrı
- `system/hook_started`, `hook_response` olayları (`--include-hook-events`)

Bu makinedeki tek bir gerçek oturumda **21 adet `is_error: true`** tool_result
bulundu. `no_swallowed_errors` ölçümünün ihtiyaç duyduğu ham sinyal mevcut:
hata olayı, hatadan sonraki asistan mesajları, ve oturum sonu.

Metin parse etmek gerekmiyor. Bu, Assay'in `TraceEvent` tipine doğrudan
eşleniyor.

### D. Completion signal — Evet, güvenilirlik **orta** ⚠️ ✅

Akışın son olayı `result`:

```json
{ "type": "result", "subtype": "success", "is_error": false,
  "num_turns": 1, "stop_reason": "end_turn", "terminal_reason": "completed",
  "duration_ms": 217826, "total_cost_usd": 0.048094,
  "usage": { "input_tokens": 10, "output_tokens": 210,
             "cache_creation_input_tokens": 23517, ... },
  "permission_denials": [], "session_id": "..." }
```

Maliyet ve gecikme katmanı bedavaya geliyor: `total_cost_usd`, `duration_ms`,
`usage`.

**Ama güvenilirlik neden "yüksek" değil — kritik bulgu ⚠️**

`CLAUDE_CONFIG_DIR` deneyinde koşum kimlik doğrulaması olmadan başladı ve
`"Not logged in · Please run /login"` metniyle bitti. Buna rağmen:

```
RESULT success turns=1 cost=0
```

`subtype: "success"`, `is_error: false`. **Hiç gerçekleşmemiş bir koşum
"başarılı" olarak raporlandı.**

Bu, Assay'in üç durumlu verdict tasarımının neden zorunlu olduğunun canlı
kanıtı. Adaptör `subtype: success`'e tek başına güvenemez; çapraz kontrol
şart:

- `total_cost_usd === 0` ve `usage.output_tokens === 0` → koşum olmadı → `unknown`
- `num_turns === 0` → `unknown`
- `terminal_reason !== 'completed'` → `unknown` veya `fail`

Bu kontroller `HostAdapter.finalize` içinde 1.1'de uygulanacak.

### Ek bulgular

**Skill seti kirliliği ölçümü bozuyor — pratikte en büyük engel.** İzole
edilmemiş bir koşumda 119 skill aktifti. `assay-probe` doğal dille
tetiklenmedi; model işi doğrudan yaptı ve komşu bir skill'in aracına
(`Artifact`) uzandı. Temiz `CLAUDE_CONFIG_DIR` ile skill sayısı 19'a düştü.
**Assay her koşumu izole bir config dizininde yürütmek zorunda**, yoksa
ölçtüğü şey skill değil, kullanıcının kurulumudur.

**Pin 3 (sistem promptu hash'i) doğrudan verilmiyor.** `init` mesajı `model`,
`claude_code_version`, `tools`, `skills`, `agents`, `plugins` ve `output_style`
veriyor; sistem promptunun kendisini veya hash'ini vermiyor. Adaptör bu
alanlardan türetilmiş bir *ortam hash'i* hesaplayabilir — ama bu sistem
promptu hash'i değildir ve öyle etiketlenmemelidir.

**Windows tuzağı:** Git Bash `/assay-probe` argümanını
`C:/Program Files/Git/assay-probe` yoluna çeviriyor (MSYS yol dönüşümü).
Adaptör süreçleri doğrudan spawn etmeli, kabuk üzerinden değil.

---

## ⚠️ Rekabet bulgusu: `claude plugin eval`

Spike sırasında beklenmedik bir şey çıktı ve raporun en önemli parçası bu.

**Anthropic, Claude Code ile birlikte birinci taraf bir skill/plugin eval
koşucusu dağıtıyor:** `claude plugin eval`.

```
claude plugin eval [target]
  Run eval cases (<eval dir>/**/case.yaml or prompt.md + graders/*.md)
  against a plugin and report scored results.
```

Yetenekleri (`--help` çıktısından, ✅ deneyle okundu):

| Yetenek | `claude plugin eval` | Assay Faz 1 planı |
|---|---|---|
| Vaka dosyası | `case.yaml` + `graders/*.md` | `suite.yaml` |
| Tekrar | `--runs`, varsayılan **3** | varsayılan ≥ 2 |
| Tetiklenme ölçümü | `--ablation with-without`, `tool_used: Skill` grader'ı "plugin-fired indicator" | tetiklenme suite'i |
| Skorlama | **LLM judge** (`--judge-model`, varsayılan haiku) | LLM judge **yok** |
| CI eşiği | `--threshold`, exit 1 | exit code |
| Rapor | self-contained HTML, claude.ai'a yayımlama | HTML + terminal |
| Maliyet tavanı | `--max-cost-usd` | maliyet katmanı |
| MCP mock'ları | `--mocks record\|off` | yok |
| Vaka yazma yardımı | `claude plugin eval init` (röportaj) | yok |

Bu, Assay'in Faz 1 kapsamının büyük kısmıyla **doğrudan örtüşüyor** — Claude
Code için. Kötü haberi yumuşatmıyorum: "Claude Code skill'lerimi CI'da test
etmek istiyorum" diyen bir kullanıcının bugün ücretsiz ve birinci taraf bir
cevabı var.

### Assay'in ayakta kalan farkları

Bunlar analizle çıkarıldı, kullanıcıyla doğrulanmadı — **pazar iddiası olarak
DOĞRULANMADI:**

1. **Vendor-bağımsızlık.** `claude plugin eval` yalnızca Claude Code'u koşar.
   Agent Skills açık bir standart ve Codex ile Copilot da destekliyor. Aynı
   skill'in üç host altında aynı davranıp davranmadığını ölçen kimse yok.
2. **Judge yok.** `claude plugin eval` skorlamayı bir LLM'e yaptırıyor.
   Kararsızlık ölçen bir aracın kendisinin kararsız olması, bu raporda
   `no_swallowed_errors` için verdiğimiz kararın tam tersi. Deterministik
   skorlama gerçek bir farklılaşma.
3. **Üç durumlu verdict.** `--threshold` skoru ikili bir kapıdan geçiriyor.
   Yukarıdaki "not logged in ama success" bulgusu, ölçülemeyen koşumun
   ölçülmüş sayılmasının ne kadar kolay olduğunu gösteriyor.
4. **Hafıza.** Eval koşucusu tek koşumu bilir. Regresyon, pin kayması ve
   zaman içindeki eğilim hosted katmanın konusu.
5. **`no_swallowed_errors`.** Grader listesinde bir muadili görülmedi.

### Bunun anlamı

Assay'in konumlandırması **"Claude Code skill'leri için test koşucusu"
olamaz** — o boşluk doldu. Ayakta kalabilecek konumlandırma:

> **Agent Skills için vendor-bağımsız, deterministik regresyon koşucusu.**

Yani rakip `claude plugin eval` değil, onun *kapsamadığı* soru: "bu skill
Codex'te ve Copilot'ta da çalışıyor mu, ve geçen aya göre bir şey bozuldu mu?"

---

## OpenAI Codex — belgeden, **DOĞRULANMADI**

CLI bu makinede kurulu değil (`codex: yok`). Aşağıdakilerin hiçbiri deneyle
görülmedi.

**A. Skill discovery — orta.** Skill'ler `SKILL.md` biçiminde ve dört kapsamdan
yükleniyor: repo içi `.agents/skills`, kullanıcı `$HOME/.agents/skills`, admin
`/etc/codex/skills`, ve OpenAI'ın gömülü skill'leri. `~/.codex/config.toml`
içinde `[[skills.config]]` girdileriyle davranış ayarlanabiliyor;
`allow_implicit_invocation` gibi politika alanları var. Kapsam kontrolü
mümkün görünüyor ama session-only yükleme (`--plugin-dir` muadili) belgede
görülmedi.

**B. Trigger observability — düşük.** İki çağrı yolu belgeleniyor: açık
`$skill-adı` ve prompt eşleşmesiyle örtük seçim. **Hangi skill'in
etkinleştirildiğini bildiren bir olay veya log alanı belgede yok.** Assay'in
en kritik sinyali burada okunamıyor olabilir; tespit büyük ihtimalle
transkriptten çıkarım gerektirir.

**C. Tool trace — orta.** Codex SDK akışlı olay yayıyor: `item.completed`,
`turn.completed` (içinde `usage`). Belgeye göre olaylar "araç çağrılarını,
akışlı yanıtları ve dosya değişikliği bildirimlerini" kapsıyor. Tam olay adları
ve hata olaylarının yapısı belgelenmemiş; SDK kaynağına bakmak gerekir.

**D. Completion — orta.** `turn.completed` token kullanımını taşıyor;
`outputSchema` ile yapılandırılmış çıktı mümkün.

**Tahmin — hangi vaka tipleri UNKNOWN döner:** tetiklenme vakalarının
tamamı (pozitif, negatif, yakın komşu) ve tüm coexistence vakaları. Görev
tamamlama ve araç izi vakaları muhtemelen ölçülebilir.

---

## GitHub Copilot — belgeden, **DOĞRULANMADI**

CLI bu makinede kurulu değil (`copilot: yok`).

**A. Skill discovery — orta.** Proje skill'leri `.github/skills`,
`.claude/skills` veya `.agents/skills`; kişisel skill'ler `~/.copilot/skills`
veya `~/.agents/skills`. Etkileşimli oturumda `/skills reload` ve
`/skills info <ad>` var — ama bunlar etkileşimli komutlar, programatik değil.

**B. Trigger observability — düşük.** "Copilot bir skill kullanmayı seçtiğinde
SKILL.md dosyası ajanın bağlamına enjekte edilir." Enjeksiyon bir araç çağrısı
değil; **dışarıdan gözlenebilir bir olay üretip üretmediği belgede yok.**
Copilot SDK'nın skill dokümanında da olay veya callback bahsi yok.

**C. Tool trace — düşük.** `-p` ile etkileşimsiz koşum, `--log-level`
(none/error/warning/info/debug/all) ve `--log-dir` var; loglar varsayılan
olarak `~/.copilot/logs/` altında ve başlangıçta budanıyor. **Yapılandırılmış
JSON akışı belgelenmemiş** — log parse etmek gerekir, ki bu kırılgan ve sürüm
değişiminde sessizce bozulur.

**D. Completion — düşük.** Etkileşimsiz modda çıkış kodu var; yapılandırılmış
bir sonuç nesnesi belgelenmemiş. Ayrıca açık hata kayıtları var: etkileşimsiz
modun beklenmedik şekilde erken çıkması ve `-p` modunda workspace
`.mcp.json`'ın sessizce atlanması gibi.

**Tahmin — hangi vaka tipleri UNKNOWN döner:** tetiklenme ve coexistence
vakalarının tamamı; araç izi vakalarının çoğu; `no_swallowed_errors` büyük
ihtimalle hepsi.

---

## Değerlendirme

### Hangi host en temiz sinyali veriyor?

**Claude Code, açık farkla.** Dördü de gözlenebilir, üçü yüksek güvenilirlikte,
metin parse etmeye hiç gerek yok, ve kurulum kapsamı hem kontrol hem rapor
edilebiliyor. Faz 1'in adaptörü bu olmalı.

Codex ikinci sırada ama tetiklenme sinyali belgelenmemiş; adaptör yazmadan
önce SDK kaynağını okumak gerekir. Copilot üçüncü ve şu anki belgelenmiş
yüzeyiyle Assay'in çekirdek ölçümü için yeterli değil.

### Faz geçiş kriteri

> "En az bir hostta trigger sinyali orta veya yüksek güvenilirlikle okunabiliyor
> olmalı."

**Karşılandı.** Claude Code'da model kendi seçtiğinde tetiklenme, açık bir
`Skill` tool_use olarak **yüksek** güvenilirlikte okunuyor ve bu deneyle
doğrulandı. Ürünün kapsamını daraltmak gerekmiyor.

### Ama kapsam yine de değişmeli

Geçiş kriteri teknik nedenle değil, **rekabet nedeniyle** yeniden
değerlendirilmeli. `claude plugin eval` Faz 1'in tek-host senaryosunu zaten
karşılıyor. Assay tek host için yazılırsa, ücretsiz ve birinci taraf bir aracın
soluk bir kopyası olur.

Önerilen kapsam düzeltmesi:

1. **Faz 1 Claude Code adaptörüyle başlar** — sinyal en temiz olan burada, ve
   motoru gerçek veriyle doğrulamanın tek yolu bu.
2. **Faz 1'in çıkış kriterine ikinci host eklenir.** Roadmap'te "sonraki
   dalga"ya yazılmış olan çapraz-host uyumluluk matrisi, ürünün kenar
   süslemesi değil, **var oluş gerekçesi** hâline geliyor. Codex adaptörü Faz
   1'e çekilmeli ya da en azından fizibilitesi 1.1'den önce SDK kaynağı
   okunarak kesinleştirilmeli.
3. **Deterministik skorlama ve üç durumlu verdict öne çıkarılır.** Bunlar
   "titiz mühendislik" değil, tek gerçek teknik farklılaşma.

Bu değişiklik roadmap'i ve product.md'yi etkiliyor; kullanıcı onaylamadan
uygulanmayacak.

### Durdurucu olmayan ama çözülmesi gereken üç şey

1. **İzolasyon zorunlu.** Her koşum kendi `CLAUDE_CONFIG_DIR`'ında yürümeli.
   ✅ mekanizma doğrulandı.
2. **Kimlik bilgisi gerekli.** İzole config OAuth oturumunu devralmıyor;
   `--bare` de OAuth okumuyor. Faz 1 koşumları için **`ANTHROPIC_API_KEY`
   ya da `claude setup-token` ile üretilmiş uzun ömürlü bir token gerekiyor.**
   Uydurulmadı; kullanıcıdan istenecek.
3. **Pin 3 türetilecek.** Sistem promptu hash'i doğrudan verilmiyor;
   `init` alanlarından bir ortam hash'i hesaplanacak ve raporda sistem promptu
   hash'i olarak değil, kendi adıyla gösterilecek.

---

## Kanıt

Deney artefaktları oturum scratchpad'inde tutuldu, repoya alınmadı (koşum
artefaktı, `.gitignore` kapsamında):

| Dosya | Ne |
|---|---|
| `probe-plugin/` | Tek kullanımlık `assay-probe` plugin'i |
| `positive.jsonl` | Belirsiz istem — skill tetiklenmedi, model taslak istedi |
| `pos2.jsonl` | Taslaklı istem — skill tetiklenmedi, model işi doğrudan yaptı (119 skill aktif) |
| `explicit.jsonl` | `/assay-probe` — skill çalıştı, `Skill` tool_use **yok** |
| `isolated.jsonl` | Temiz `CLAUDE_CONFIG_DIR` — 19 skill, ama "not logged in" + `subtype: success` |

Toplam deney maliyeti: **0.114 USD**, dört koşum.

Gerçek transkript taraması: `~/.claude/projects/**/*.jsonl`, 245 dosya,
12'sinde `Skill` tool_use.

### Kaynaklar

- [Codex — Build skills](https://learn.chatgpt.com/docs/build-skills)
- [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)
- [Codex TypeScript SDK README](https://github.com/openai/codex/tree/main/sdk/typescript)
- [GitHub Copilot — About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [GitHub Copilot CLI — Adding agent skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
- [GitHub Copilot CLI — command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- [GitHub Copilot SDK — Custom skills](https://docs.github.com/en/copilot/how-tos/copilot-sdk/features/skills)
- [GitHub Copilot now supports Agent Skills (changelog)](https://github.blog/changelog/2025-12-18-github-copilot-now-supports-agent-skills/)
