# Ölçüm Raporu — anthropics/skills üç skill

**Tarih:** 2026-09-03 · **Host:** Claude Code · **Model:**
`claude-haiku-4-5-20251001` · **Ölçen:** `@ktlsr/assay@0.1.0`, npm'den
(`npx`), yerel derleme değil.

Bu koşumun iki amacı vardı: gerçek skill'lerin tetiklenme sınırını ölçmek ve
yayımlanan paketin dışarıdan kurulduğunda gerçekten çalıştığını doğrulamak.

Rapordaki tablolarda elle yazılmış tek bir sayı yok; hepsi
`node tools/measurement-report.mjs <root> <suite...>` ile gerçek koşum
kayıtlarından üretildi.

**Pinler.** Skill kaynağı `anthropics/skills@53048666b05b4799081517d00e09e0a2dd688678`,
model kimliği yukarıda, suite sürümü 1. Sistem promptu hash'ini host vermiyor;
kayıt bunun yerine ortam hash'i tutuyor (bkz. docs/decisions.md, pin 3).

---

## Neden bu üç skill

Ölçüt tek bir soruydu: **sınırı belirsiz olanı seç.** Net sınırlı bir skill'i
ölçmenin bilgi değeri yok — cevabı baştan biliniyor.

| Skill | İddia ettiği dar iş | Etrafındaki kalabalık alan |
|---|---|---|
| `webapp-testing` | çalışan yerel bir web uygulamasını tarayıcıda sürmek | birim testi, API testi, statik kod okuma, Playwright yapılandırması |
| `mcp-builder` | MCP sunucusu **inşa etmek** | var olanı yapılandırmak, var olanı kullanmak, Anthropic API araç tanımı, düz REST servisi |
| `doc-coauthoring` | yapılandırılmış bir **birlikte yazma oturumu** | README üretimi, düzyazı düzenleme, sürüm notları, docstring |

Üçünün ortak özelliği: iddia ettikleri iş, ajanın skill olmadan da zaten
yaptığı bir şeyin dar bir alt kümesi. Ayrım gücü ancak yakın komşuyla ölçülür.

## Kurulum ve izolasyon

Her skill kendi plugin dizinine kuruldu
(`plugins/<skill>/skills/<skill>/SKILL.md` + `.claude-plugin/plugin.json`) ve
`--skill` ile yalnızca o koşuma yüklendi. Adaptör her attempt için temiz bir
`CLAUDE_CONFIG_DIR` açtığı için kullanıcının 119 skill'lik kurulumu devrede
değil: her koşumda tek bir hedef skill aktif.

Hiçbir istemde skill adı geçmiyor. Ölçülen şey modelin istemden skill'i kendi
seçmesi; komut çalıştırmak değil.

## Vaka seti tasarımı

Her skill için 3 pozitif + 4 yakın komşu negatifi + 2 alakasız negatif, her
vaka 10 tekrar. Dosyaya atıf yapan istemler `setup.fixtures` ile gerçek
dosyalarla koşuldu — atıf yapıp dosyayı vermemek skill'i değil eksik dosyayı
ölçer (bu tuzağa 1.6'da düşülmüştü, bkz. docs/dogfooding.md).

**İlk turda üç setten ikisi 90/90 geçti.** Bu skill'in mükemmel olduğu değil,
**setin yeterince zor olmadığı** anlamına gelir. Bu yüzden her skill için
ikinci, sınırda bir set yazıldı ve koşuldu. Aşağıdaki iki tablo bu yüzden
yan yana duruyor: fark skill'in değil, vaka setinin farkı.

---

## Sonuçlar

| Vaka seti | Verdict | Precision | Recall | Unknown | Maliyet | Süre |
|---|---|---|---|---|---|---|
| `doc-coauthoring` | pass | 100% (N=30, 95% CI 89%–100%) | 100% (N=30, 95% CI 89%–100%) | 0 | $3.26 | 25.0 dk |
| `doc-coauthoring-borderline` | fail | 51% (N=59, 95% CI 38%–63%) | 100% (N=30, 95% CI 89%–100%) | 0 | $2.68 | 16.6 dk |
| `mcp-builder` | pass | 100% (N=30, 95% CI 89%–100%) | 100% (N=30, 95% CI 89%–100%) | 0 | $5.93 | 69.7 dk |
| `mcp-builder-borderline` | pass | 100% (N=30, 95% CI 89%–100%) | 100% (N=30, 95% CI 89%–100%) | 0 | $8.39 | 116.6 dk |
| `webapp-testing` | fail | 100% (N=29, 95% CI 88%–100%) | 97% (N=30, 95% CI 83%–99%) | 0 | $4.72 | 50.5 dk |
| `webapp-testing-borderline` | fail | 91% (N=33, 95% CI 76%–97%) | 100% (N=30, 95% CI 89%–100%) | 0 | $5.39 | 59.7 dk |

### `doc-coauthoring`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |
|---|---|---|---|---|---|
| `trigger.positive.design_doc` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.proposal` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.tech_spec` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.readme` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.edit_prose` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.release_notes` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.docstrings` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.regex` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.docker` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |

### `doc-coauthoring-borderline`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |
|---|---|---|---|---|---|
| `trigger.positive.runbook` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.adr` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.one_pager` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.customer_email` | tetiklenmemeli | 90% (N=10, 95% CI 60%–98%) | 9 | 1 | 0 |
| `trigger.negative.near_neighbor.talk_abstract` | tetiklenmemeli | 0% (N=10, 95% CI 0%–28%) | 0 | 10 | 0 |
| `trigger.negative.near_neighbor.self_review` | tetiklenmemeli | 0% (N=10, 95% CI 0%–28%) | 0 | 10 | 0 |
| `trigger.negative.near_neighbor.job_description` | tetiklenmemeli | 20% (N=10, 95% CI 6%–51%) | 2 | 8 | 0 |
| `trigger.negative.unrelated.regex` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.docker` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |

### `mcp-builder`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |
|---|---|---|---|---|---|
| `trigger.positive.typescript_server` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.python_server` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.implicit_no_acronym` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.configure` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.consume` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.api_tools` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.plain_service` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.git` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.css` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |

### `mcp-builder-borderline`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |
|---|---|---|---|---|---|
| `trigger.positive.explicit_anchor` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.implicit_stdio` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.implicit_portable` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.openai_functions` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.langchain_tools` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.claude_code_plugin` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.agent_cli` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.git` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.css` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |

### `webapp-testing`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |
|---|---|---|---|---|---|
| `trigger.positive.console_debug` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.screenshot` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.flow_walkthrough` | tetiklenmeli | 90% (N=10, 95% CI 60%–98%) | 9 | 1 | 0 |
| `trigger.negative.near_neighbor.unit_test` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.static_read` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.playwright_config` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.api_probe` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.types` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.shell` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |

### `webapp-testing-borderline`

| Vaka | Beklenen | Geçiş oranı | Pass | Fail | Unknown |
|---|---|---|---|---|---|
| `trigger.positive.console_debug` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.rendered_value` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.positive.responsive_overlap` | tetiklenmeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.public_scrape` | tetiklenmemeli | 70% (N=10, 95% CI 40%–89%) | 7 | 3 | 0 |
| `trigger.negative.near_neighbor.pdf_render` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.load_test` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.near_neighbor.grpc_service` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.types` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |
| `trigger.negative.unrelated.shell` | tetiklenmemeli | 100% (N=10, 95% CI 72%–100%) | 10 | 0 | 0 |

**Toplam:** 540 attempt · 7934 iz olayı · **$30.36** · 338 dakika ajan süresi.

---

## Karne: `doc-coauthoring`

**İlk set: 90/90, sıfır sızıntı. Sonraki set: precision %51.** Aynı skill,
aynı model, aynı pinler. Değişen tek şey negatiflerin nasıl kurulduğu.

İlk setin izleri ayrımın nerede yapıldığını gösterdi: üç pozitifte ajanın
**ilk eylemi** `Skill` çağrısı — hiçbir şeye dokunmadan karar veriyor. Dört
negatifte doğrudan `Read`/`Write` ile işe başlıyor ve skill'i hiç düşünmüyor.

Ama ayrım konuda değildi. İlk setteki dört negatifin dördünde de ajanın
önünde **dönüştüreceği bir kaynak** vardı: JS export'ları, 2000 kelimelik bir
kılavuz, commit listesi, bir Python dosyası. Üç pozitifte içerik yalnızca
kullanıcının kafasındaydı. Yani set "birlikte yazma işi mi" ekseninde değil,
"ortada dönüştürülecek bir şey var mı" ekseninde ayrışmıştı — istemeden.

İkinci set o değişkeni sabitledi: dört yakın komşunun da içeriği yalnızca
kullanıcının kafasında, sıfırdan yazılacak ve yapılandırılmış. Değişen tek şey
**belge olup olmadıkları**.

| Yakın komşu | Sızma |
|---|---|
| konferans konuşması özeti | **10/10** |
| performans öz değerlendirmesi | **10/10** |
| iş ilanı | **8/10** |
| müşteriye e-posta | 1/10 |

Ham izde sebep ajanın kendi ağzından yazılı — iş ilanı vakasında `Skill`
çağrısından hemen önce:

> "I'll help you turn that knowledge into a compelling job posting. Let me use
> a structured workflow to gather your context and build this out together."

**Bulgu.** `doc-coauthoring`'in gerçek sınırı "bu bir belge mi" değil,
"içerik yalnızca kullanıcının kafasında mı ve yapılandırılması gerekiyor mu".
Sızma vektörü açıklamadaki son ifade: *"or similar structured content."* Bir
öz değerlendirme ve bir iş ilanı bu tanımı karşılıyor. Yalnızca e-posta
tuttu — çünkü e-posta gözle görülür biçimde belge değil.

## Karne: `mcp-builder`

**İki bağımsız set, 180 attempt, tek hata yok.** Precision ve recall her iki
sette de %100 (N=30, %95 GA %89–%100).

İlk setin negatifleri "MCP" sözcüğünü paylaşıyordu ama işin şeklini
paylaşmıyordu. `doc-coauthoring` dersinden sonra ikinci set o boşluğu
kapattı: dört yakın komşunun da işi harfiyen açıklamadaki cümle — "bir dış
servisi, iyi tasarlanmış araçlar üzerinden bir LLM'e açmak" — ve değişen tek
şey protokolün MCP olmaması: OpenAI function calling, LangChain tool
wrapper'ları, Claude Code plugin'i, ajanın süreceği bir CLI.

Dördü de 10/10 tuttu. Pozitif tarafta, "MCP" hiç geçmeyen iki istem
(stdio üzerinden konuşan bağlayıcı; üç istemcinin de bağlanabileceği tek
sunucu) 10/10 tetikledi.

**Bulgu.** `mcp-builder` ölçtüğümüz iki zorluk seviyesinde de sağlam. Protokol
kimliğini işin şeklinden ayırt ediyor: aynı iş MCP değilse tetiklenmiyor, MCP
ise adı anılmasa bile tetikleniyor. Bu sette kırılamadı; daha sınırda bir set
için öneri aşağıda.

## Karne: `webapp-testing`

**İlk set: 89/90 — kıran şey bir negatif değil, bir pozitif.**
Recall %97 (N=30, %95 GA %83–%99).

`flow_walkthrough` 7. denemede skill hiç çağrılmadı. İzde ajan sunucuyu
başlatıyor, `reset.html`'i okuyor, hatayı kaynaktan görüyor ve tarayıcıyı hiç
açmadan cevaplıyor:

> "I can see the bug directly in the code."

**Bulgu 1.** `webapp-testing`'in recall'ı, hatanın kaynakta görünür olduğu
durumda düşüyor. Tarayıcı ancak statik okuma sorunu çözemediğinde kazanıyor.
Benim pozitifim iki yoldan da çözülebiliyordu, yani temiz bir pozitif değil
sınırda bir pozitifti.

İkinci set bunu düzeltti: üç pozitifin de cevabı render edilmiş sayfada
(ekrandaki sayı verisiyle çelişiyor; 375px'te bir katman düğmeyi kapatıyor).
Üçü de 10/10 tetikledi — yani düzeltme işe yaradı.

İkinci setin negatifleri skill'in iddiasını bir kesişim olarak ele aldı
(*tarayıcı gerekiyor* **ve** *yerel web uygulaması testi*) ve kesişimin
dışındaki hücreleri yokladı. Üçü tuttu, biri sızdı:

| Yakın komşu | Sızma |
|---|---|
| genel bir siteden veri kazıma (tarayıcı var, yerel test yok) | **3/10** |
| HTML'i PDF'e render etmek | 0/10 |
| yerel uygulamaya yük testi (yerel test var, tarayıcı yok) | 0/10 |
| yerel gRPC servisini sınamak | 0/10 |

**Bulgu 2.** Sızan vaka tarayıcı gerektiren ama yerel uygulama testi olmayan
tek vaka. İzde ajan doğrudan söylüyor: *"I'll use the webapp-testing skill to
open the browser, navigate to the URL..."* Yani skill "tarayıcı sür" işine
tetikleniyor, "yerel web uygulamasını test et" işine değil; açıklamadaki iki
koşuldan yalnızca birini taşıyor.

**Dürüstlük notu.** Bu vakadaki 7 "geçiş"in hepsi ayrım gücünden gelmiyor.
Geçen denemelerin bir kısmında ajan işi hiç yapmadı — "I can't directly open
and interact with a graphical browser in your environment" deyip skill'i
yalnızca **düzyazıda** önerdi. Adaptör bunu tetiklenme saymıyor (yalnızca
`Skill` araç çağrısı sayılıyor) ve bu doğru; ama vaka kısmen "reddetti" diye
geçti, "ayırt etti" diye değil. Gerçek precision bu vakada ölçülenden düşük
olabilir.

---

## Hiçbir negatifin kırılmadığı yerler ve daha sınırda öneriler

Sözleşme gereği açıkça: **`mcp-builder` iki sette de hiç kırılmadı.** Bu,
setin yeterince zor olmadığı ihtimalini içerir.

Bir sonraki tur için, ölçülmemiş kalan sınır:

- **Var olan bir MCP sunucusunun araç tanımlarını yeniden yazmak.** "Model
  `search_tickets`'ı kullanıcı aramasında çağırıyor; açıklamaları ve şemaları
  ayırt edici hâle getir." Skill'in içeriğinin büyük kısmı tam olarak araç
  tasarımı kalitesi — bu vaka pozitif de olabilir. Yer gerçeği tartışmalı
  olduğu için bu turda **negatif olarak kullanılmadı**; ayrı bir pozitif
  olarak ölçülmeli.
- **MCP sunucusunu test etmek / hata ayıklamak**, inşa etmek değil.
- **MCP istemcisi yazmak** (sunucu değil).
- **Bir MCP sunucusunu başka bir dile taşımak** — inşa mı, göç mü?

`doc-coauthoring` için ölçülmemiş sınır: kullanıcının bütün olguları peşinen
verdiği bir olay sonrası raporu (postmortem). Yapılandırılmış, sıfırdan ve
belge — ama bağlam aktarımı gerekmiyor, yani workflow'un ilk aşaması boş.
Yer gerçeği tartışmalı olduğu için bu turda kullanılmadı.

`webapp-testing` için: **spec yazmak ama koşmamak.** "Checkout akışı için
Playwright spec'lerini yaz, ben sonra koşarım." Skill Playwright script'i
yazmakla ilgili, dolayısıyla bu da pozitif olabilir; ayrı ölçülmeli.

Bu dört başlığın ortak özelliği: yer gerçeği benim için de belirsiz. Belirsiz
yer gerçeğiyle negatif yazmak, skill'i değil benim kanaatimi ölçer.

---

## Yöntemin kendisi hakkında bir bulgu

En pahalı ders skill'lerle ilgili değil, **vaka setiyle** ilgili.

`doc-coauthoring` aynı skill, aynı model ve aynı pinlerle iki kez ölçüldü.
Precision %100 ve %51 çıktı. Aradaki fark tamamen negatiflerin nasıl
kurulduğundan geliyor. İlk set, farkında olmadan skill'in sınırını değil
başka bir değişkeni (ortada dönüştürülecek bir kaynak var mı) ölçüyordu ve
o değişken üzerinde skill kusursuz görünüyordu.

Bunun pratik sonucu: **yalnızca "geçti" raporlayan bir tetiklenme suite'i,
skill hakkında olduğu kadar suite hakkında da bir ifadedir.** Değişmez #5
negatif ve yakın komşu zorunluluğu koyuyor; bu koşum onun yeterli olmadığını
gösteriyor. Yakın komşunun *hangi eksende* yakın olduğu da denetlenmeli:
negatifler pozitiflerden yalnızca ölçülmek istenen özellikte ayrılmalı, başka
hiçbir şeyde değil.

Somut öneri: bir tetiklenme suite'i 90/90 geçtiğinde bu bir başarı değil, bir
**uyarı** olarak okunmalı ve rapor bunu söylemeli. `assay` bugün bunu
söylemiyor.

---

## `@ktlsr/assay@0.1.0` — paket kalitesi

Paket npm'den `npx` ile kuruldu ve altı koşumun tamamını yürüttü: 540 attempt,
0 `unknown`, doğru çıkış kodları. Ölçüm zinciri dışarıdan kurulmuş hâliyle
çalışıyor — yerel derlemeye hiç dokunulmadı.

Görülen kusurlar:

**1. `assay init` bir dizin verilince ham yığın izi ile çöküyor.**
Yardım metni "write an example suite next to a skill" diyor ve argüman
`init [path]`; bu ifade doğal olarak skill dizinini işaret ediyor. Oysa
argüman bir **dosya** yolu. Dizin verildiğinde yakalanmamış bir istisna
çıkıyor (`EISDIR: illegal operation on a directory`) ve Node yığın izi
basılıyor. Diğer kullanım hataları düzgün biçimde exit 2 ve tek satırlık
mesaj üretiyor; burada o sözleşme bozuluyor. Düzeltme küçük: hedefi yazmadan
önce dizin mi diye bakmak ve `EXIT.usage` döndürmek. Yardım metni de
"write an example suite file" olmalı.

**2. Rapor 90/90 geçen bir suite ile zayıf bir suite'i ayırt etmiyor.**
Yukarıdaki yöntem bulgusunun araç tarafındaki karşılığı. `assay` bugün
"tüm negatifler geçti" durumunu bir uyarı olarak işaretlemiyor.

Bunun dışında `validate`, `run`, `report`, `--html`, `--store`, `--repeat` ve
`setup.fixtures` beklendiği gibi çalıştı. `--repeat 1` uyarısı yerinde ve
kayıtta işaretli. Hiçbir oran N ve güven aralığı olmadan basılmadı; altı
koşumda da `unknown` üretilmedi.

---

## Yeniden üretmek

```
git clone --depth 1 https://github.com/anthropics/skills.git
# skill'i plugins/<skill>/skills/<skill>/ altina kopyala, plugin.json ekle
npx @ktlsr/assay validate suites/<skill>.suite.yaml
npx @ktlsr/assay run suites/<skill>.suite.yaml --skill plugins/<skill> --store .runs-<skill>
npx @ktlsr/assay report
```

Vaka setleri ve fixture'lar `examples/measurements/` altında. Tablolar
`node tools/measurement-report.mjs <root> <suite...>` ile kayıtlardan
üretilir.
