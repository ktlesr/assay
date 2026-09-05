# Karar Günlüğü

Otonom modda verilen her belirsizlik kararı buraya yazılır.

Format:

```
## <tarih> — <karar başlığı>
Bağlam: neden bir karar gerekti
Seçenekler: değerlendirilenler
Karar: seçilen
Gerekçe: neden
Geri dönüş maliyeti: düşük / orta / yüksek
```

---

## 2026-08-31 — Node 22 LTS, `.nvmrc` ile pinli

Bağlam: Runtime sürümü seçilmeli. Adaptörler alt süreç ve dosya sistemi
işi yapacak; sürüm sapması sandbox davranışını değiştirebilir.
Seçenekler: Node 20 LTS · Node 22 LTS · Node 24 (current) · Bun
Karar: Node 22.20.0, `.nvmrc` ile pinli.
Gerekçe: Makinede kurulu sürüm bu ve aktif LTS. Node 24 henüz LTS değil.
Bun cazip ama adaptörlerin alt süreç/izolasyon davranışı Node ekosisteminde
daha öngörülebilir ve Assay'in kendisi bir ölçüm aracı — kendi altında
sürpriz istemiyoruz.
Geri dönüş maliyeti: düşük

## 2026-08-31 — pnpm workspace, paket yöneticisi olarak pnpm

Bağlam: Monorepo'da bağımlılık sınırlarını zorlamak gerekiyor;
`packages/core` hiçbir şeye bağımlı olmamalı.
Seçenekler: npm workspaces · yarn · pnpm workspace
Karar: pnpm 10.19.0, workspace modu.
Gerekçe: Katı `node_modules` düzeni sayesinde bildirilmemiş bağımlılık
kazara çözülmez. Bağımlılık kuralı yalnızca lint'te değil, disk düzeninde
de zorlanmış olur. Yığın kararı zaten pnpm yönündeydi.
Geri dönüş maliyeti: düşük

## 2026-08-31 — ESLint 9 flat config + Prettier

Bağlam: Lint ve format aracı seçilmeli. Lint'in asıl işi stil değil,
paketler arası bağımlılık sınırını makine seviyesinde zorlamak.
Seçenekler: ESLint + Prettier · Biome · yalnızca tsc
Karar: ESLint 9 flat config + Prettier. Bağımlılık sınırı için
`no-restricted-imports`; yetmezse dependency-cruiser eklenir.
Gerekçe: Biome daha hızlı ama mimari sınır kuralları için ESLint eklenti
ekosistemi hâlâ gerekli. `web → runner` yasağını kural olarak ifade
edebilmek bu seçimin tek sebebi; stil ikincil.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Test koşucusu Vitest

Bağlam: Assertion motoru ve şema doğrulayıcı için test gerekiyor.
Seçenekler: Vitest · node:test · Jest
Karar: Vitest.
Gerekçe: TS/ESM ile ek yapılandırma istemiyor, monorepo workspace desteği
var. `node:test` yeterli olurdu ama Faz 2'de React bileşen testi gelince
ikinci bir koşucu eklemek gerekirdi.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Conventional Commits

Bağlam: Commit konvansiyonu seçilmeli.
Seçenekler: serbest · Conventional Commits · gitmoji
Karar: Conventional Commits. Gövdede ne yapıldığı ve verilen kararlar.
Gerekçe: Otonom modda commit'leri ajan atıyor; makine tarafından üretilen
geçmişin makine tarafından okunabilir olması ileride changelog ve
sürümleme otomasyonunu bedavaya getirir.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Lisans Apache-2.0, NOTICE dosyasıyla

Bağlam: SDK açık kaynak olacak; lisans seçilmeli.
Seçenekler: MIT · Apache-2.0 · çift lisans
Karar: Apache-2.0, `NOTICE` dosyası ile birlikte. Copyright sahibi
"Assay contributors".
Gerekçe: Ürün tanımında zaten Apache-2.0 belirtilmiş. Patent hükmü,
kurumsal kullanıcının hukuk incelemesinden geçmeyi kolaylaştırıyor —
hedef kullanıcının bir kısmı kurumsal ekip.
Geri dönüş maliyeti: yüksek (lisans değişimi katkıcı onayı ister)

## 2026-08-31 — Faz 1 kalıcılığı dosya tabanlı, SQLite değil

Bağlam: Faz 1'de koşum kayıtları bir yere yazılmalı; yığın "SQLite veya
dosya tabanlı store" diyerek seçimi açık bırakmış.
Seçenekler: SQLite (better-sqlite3) · JSON dosya store · hiç kalıcılık yok
Karar: `.assay/runs/` altında sürümlü JSON dosya store.
Gerekçe: Faz 1'in ihtiyacı dört pin + N tekrarın kaydı ve tekrar okunması;
bunun için sorgu motoru gerekmiyor. Dosya store'un iki ek getirisi var:
kayıtlar insan tarafından okunabilir ve doğrudan CI artefaktı olarak
yüklenebilir. Native bağımlılık (better-sqlite3) eklemek, aracın kendi
kurulumunu kırılganlaştırır. Faz 2'de Postgres zaten gelecek; SQLite ara
istasyonu iki kez migration demek.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Git kökü: d:\assay içinde ayrı repo

Bağlam: `D:\` sürücüsünün tamamı halihazırda bir git reposu. `d:\assay`
içinde çalışırken `git status` binlerce alakasız dosya gösteriyor.
Seçenekler: D:\ reposunun alt dizini olarak çalışmak · d:\assay içinde
ayrı `git init`
Karar: `d:\assay` içinde ayrı repo (`git init -b main`), remote
`ktlesr/assay`.
Gerekçe: Assay bağımsız yayımlanacak açık kaynak bir SDK. Sürücü genelindeki
repoya karışması hem sır sızıntısı riski hem de anlamsız bir geçmiş demek.
İç içe repo, dış repo tarafından yok sayılır.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Bağımlılık sınırı: ESLint `no-restricted-imports`, dependency-cruiser değil

Bağlam: `core → hiçbir şey` ve `web ↛ runner` kuralları makine seviyesinde
zorlanmalı. 0.2 iki araç arasında seçim bırakmıştı.
Seçenekler: dependency-cruiser (ayrı araç, ayrı config, grafik doğrulama) ·
ESLint `no-restricted-imports` bölgeleri · yalnızca kod incelemesi
Karar: `eslint.config.js` içinde paket başına bir `no-restricted-imports`
bölgesi. Kuralın gerçekten ihlal yakaladığı `tools/dependency-boundaries.test.ts`
ile kanıtlanır (9 yasak + 6 serbest vaka + core'un dependencies'inin boş olduğu).
Gerekçe: ESLint zaten yığında. İkinci bir araç, ikinci bir config ve ikinci bir
CI adımı demek. Kuralın kendisi bir testle korunduğu için dependency-cruiser'ın
sunduğu ek güvence marjinal. Grafik seviyesinde döngü tespiti gerekirse sonradan
eklenir.
Geri dönüş maliyeti: düşük

## 2026-08-31 — `apps/web` Faz 2'ye kadar düz CSS

Bağlam: Yığın Tailwind + shadcn/ui diyor ama tema sistemi 2.2 adımının konusu.
0.2'de web yalnızca iskelet.
Seçenekler: Tailwind'i şimdi kur · 2.2'ye kadar düz CSS
Karar: `apps/web/app/globals.css` içinde CSS değişkenleriyle düz CSS; koyu/açık
tema `prefers-color-scheme` ile.
Gerekçe: Tema token sistemi 2.2'nin çıktısı. Şimdi Tailwind kurmak, 2.2'de
yeniden tasarlanacak bir yapılandırmayı iki kez yazmak olur. İskelet sayfanın
ihtiyacı 60 satır CSS.
Geri dönüş maliyeti: düşük

## 2026-08-31 — `apps/web/postcss.config.mjs` boş dosya olarak var

Bağlam: `D:\postcss.config.mjs` (başka bir projeye ait) Next'in yukarı doğru
config aramasına takılıyordu; dev sunucusu `@tailwindcss/postcss` bulunamadı
diye 500 veriyordu.
Seçenekler: Next config'te postcss yolunu sabitlemek · yerel boş postcss config
Karar: `apps/web/postcss.config.mjs` → `export default { plugins: {} }`.
Gerekçe: Aramayı proje sınırında durduran en küçük çözüm. Tailwind 2.2'de zaten
buraya eklenecek. Bu, geliştirme makinesine özgü bir kaza değil: monorepo'yu
başka bir kökün altına klonlayan herkes aynı sızıntıyı yaşar.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Tek kök Vitest yapılandırması

Bağlam: Monorepo'da test koşumu paket başına mı, kökten mi?
Seçenekler: paket başına vitest config + workspace/projects · tek kök config
Karar: Kökte tek `vitest.config.ts`, `packages/*/src/**/*.test.ts` ve
`tools/**/*.test.ts` glob'ları.
Gerekçe: Paketler aynı ortamı (node) paylaşıyor. Yedi ayrı config, tek satırlık
bir glob'un yaptığı işi yapardı. Faz 2'de `apps/web` jsdom ortamı isterse
`projects` alanına o zaman geçilir.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Kullanıcıya görünen metinler İngilizce, kod yorumları ve docs Türkçe
Bağlam: Doğrulayıcı hata mesajları yazılırken dil seçilmeli. Proje Türkçe
yürüyor ama SDK Apache-2.0 ve uluslararası skill yazarlarını hedefliyor.
Seçenekler: her şey Türkçe · her şey İngilizce · ayrım
Karar: Kullanıcıya görünen her string (doğrulama hataları, ileride CLI çıktısı
ve rapor) İngilizce. Kod yorumları, docs/ ve commit mesajları Türkçe.
Gerekçe: "Jest for Agent Skills" konumlandırmasıyla Türkçe hata mesajı veren bir
CLI tutarsız olur. Mesajlar koda dağılınca sonradan çevirmek ucuz değil; bugün
seçmek bedava. Türkçe docs projeyi yürüten için okuma maliyetini düşürüyor ve
dışarıya sızmıyor.
Geri dönüş maliyeti: orta

## 2026-08-31 — core'un I/O yasağı lint kuralı, `dependencies: {}` kuralı değil
Bağlam: 0.2'de "core hiçbir şeye bağımlı değil" testi `dependencies` nesnesinin
boş olmasını şart koşuyordu. 0.3'te core'a zod ve yaml gerekti.
Seçenekler: zod/yaml'ı runner'a taşıyıp core'u bağımsız tutmak · testi
"@assay/* bağımlılığı yok" olarak daraltıp I/O yasağını ayrıca zorlamak
Karar: İkincisi. `dependencies` içinde `@assay/*` olmaması + `packages/core`
içinde Node yerleşiklerinin (`node:*`, `fs`, `path`, `child_process`, `net`,
`crypto`, ...) `no-restricted-imports` ile yasaklanması. Yedi yasak ve iki
serbest vaka testte.
Gerekçe: Asıl kural "core saf hesaplamadır, tarayıcıda da aynı davranır" idi;
`dependencies: {}` bunun kaba bir vekiliydi. Zod ve yaml saf hesaplama, I/O
yapmıyor. Node yerleşiklerini yasaklamak niyeti doğrudan ifade ediyor ve daha
sıkı: core'a `node:fs` sızarsa lint yakalar, oysa eski kural yakalamazdı.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Yakın-komşu vakası id konvansiyonuyla işaretlenir
Bağlam: Değişmez #5 yakın-komşu negatifi ister; doğrulayıcının bunu tanıması
gerekiyor.
Seçenekler: vakaya ayrı `kind: near_neighbor` alanı · id içinde `near_neighbor`
segmenti
Karar: id segmenti. `trigger.negative.near_neighbor.pdf`.
Gerekçe: id'ler zaten hiyerarşik ve zorunlu. İkinci bir alan, aynı bilgiyi iki
yerde tutmak ve ikisinin çelişme ihtimalini yaratmak olurdu. Plan dosyasındaki
örnek de bu konvansiyonu kullanıyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — `version` vaka seti sürümü, ayrıca şema sürümü alanı yok
Bağlam: Dördüncü pin "vaka seti sürümü". Plan örneğinde tek bir `version: 1`
alanı var ve bunun şema sürümü mü vaka seti sürümü mü olduğu belirsiz.
Seçenekler: iki ayrı alan (`version` + `suite_version`) · tek alan, vaka seti
sürümü · içerik hash'ini core'da hesaplamak
Karar: Tek alan; `version` vaka seti sürümüdür ve vakalar değiştiğinde artırılır.
İçerik hash'i core'da hesaplanmaz, runner koşum kaydına yazar.
Gerekçe: İki sürüm alanı, biri hep unutulacak iki alan demek. Hash core'da
hesaplanamaz çünkü `node:crypto` I/O yasağının kapsamında ve tarayıcıda yok;
üstelik hash'in doğal yeri kaynağı okuyan taraf. Beyan edilen sürüm insan
niyetini, runner'ın yazdığı hash gerçeği taşır — biri unutulursa diğeri yakalar.
Geri dönüş maliyeti: orta (suite dosyalarına alan eklemek geriye dönük kırar)

## 2026-08-31 — Kanıt modeli: core değerlendirir, runner toplar
Bağlam: `file_exists`, `file_valid`, `side_effect` gibi assertion'lar dosya
sistemine bakmak zorunda; ama core I/O yapmıyor.
Seçenekler: assertion motorunu runner'a taşımak · core'a dosya okuma vermek ·
runner'ın topladığı `Evidence` nesnesini core'a girdi vermek
Karar: Üçüncüsü. `Evidence { files?, trace?, exitCode?, env? }` — her alan
opsiyonel, çünkü toplanamamış olabilir. Runner kanıtı toplar, core değerlendirir.
Gerekçe: Motoru runner'a taşımak core'u boşaltır ve ileride hosted tarafın aynı
kaydı yeniden değerlendirmesini imkânsız kılar. Kanıt nesnesi ayrıca ölçümü
yeniden üretilebilir yapar: aynı Evidence her zaman aynı verdict'i verir.
Geri dönüş maliyeti: yüksek (motorun konumu mimarinin merkezinde)

## 2026-08-31 — "Veri yokken pass yok" kuralı sevk katmanında zorlanıyor
Bağlam: Değişmez #1 "hiçbir assertion veri yokluğunda PASS dönmez, tip
seviyesinde zorla" diyor.
Seçenekler: her değerlendiricide elle kontrol · sevk katmanının kanıtı önceden
çözmesi · sonuç tipinde kısıt
Karar: Her assertion tipi hangi kanıt alanlarına ihtiyaç duyduğunu `REQUIRES`
tablosunda bildirir. Sevk katmanı eksik alan görürse değerlendiriciyi **hiç
çağırmaz** ve `unknown` üretir. Değerlendiricilerin girdi tipinde (`Resolved<K>`)
o alanlar opsiyonel değildir.
Gerekçe: Değerlendirici eksik kanıtı göremediği için yanlışlıkla `pass` dönmesi
yapısal olarak imkânsız. Elle kontrol, yeni bir assertion tipi eklendiğinde
unutulacak tek satırdı.
Geri dönüş maliyeti: düşük

## 2026-08-31 — no_swallowed_errors üç kademeli deterministik bildirim tespiti
Bağlam: "Ajan hatayı bildirdi mi?" sorusu LLM judge olmadan cevaplanmalı
(değişmez #6).
Seçenekler: yalnızca host sinyaline güvenmek (pratikte hep unknown) · anahtar
sözcük sezgiseli · üç kademe
Karar: (1) adaptörün `acknowledgesError` alanı, (2) hata metnindeki ayırt edici
belirteçlerin veya araç adının mesajda geçmesi, (3) genel başarısızlık
sözcükleri. Üçü de tutmuyorsa `fail`. Oturum başarıyla bitmediyse `pass`;
`session_end` yoksa veya sonucu yoksa `unknown`.
Gerekçe: Yalnızca host sinyali beklemek ölçümü pratikte hep `unknown` yapardı ve
ürünün ayırt edici özelliği ölürdü. Üç kademe yanlış `fail` riskini düşürüyor:
`fail` demek için ajanın hatadan sonra ürettiği metnin ne aracı, ne hata
belirtecini, ne de herhangi bir başarısızlık sözcüğünü içermemesi gerekiyor.
Tavan: yalnızca imalı kabul yakalanamaz; yükseltme yolu adaptörün
`acknowledgesError` doldurması, ki o sezgiselin önüne geçiyor.
Geri dönüş maliyeti: düşük (tek modül)

## 2026-08-31 — JSON Schema doğrulaması için ajv
Bağlam: `json_schema` ve `tool_args_valid` assertion'ları JSON Schema
doğrulaması istiyor.
Seçenekler: elle yazılmış alt küme · ajv · @cfworker/json-schema
Karar: ajv 8, `strict: false`, `allErrors: true`. Derlenen şemalar
önbelleklenir.
Gerekçe: Elle yazılmış bir alt küme, tam da sessizce yanlış veri geçiren yerdir —
bir doğrulayıcı aracında kabul edilemez. ajv sıkıcı ve standart seçim. `strict`
kapalı, çünkü kullanıcının şemasındaki tanımadığımız anahtar kelimeler koşumu
düşürmemeli.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Oran tipi N ve güven aralığını yapısal olarak taşır
Bağlam: Değişmez #4 "hiçbir oran N ve güven aralığı olmadan gösterilmez" diyor.
Bir kod incelemesi kuralı olarak bu er geç aşınır.
Seçenekler: `number` döndürüp gösterim katmanında kural · `Proportion` tipi
Karar: `Proportion { successes, n, rate: number | null, ci: {...} | null }`.
Wilson skor aralığı. Gözlem yoksa `rate` de `ci` de `null`.
Gerekçe: Çıplak bir `number` üretilmediği için oranı N'siz göstermek için
kasıtlı çaba gerekiyor. Wilson, Wald yerine seçildi: 10/10 başarıda Wald
[%100, %100] der ve belirsizliği tamamen gizler, Wilson [%72, %100] der.
`null` seçeneği "N=0 iken oran yoktur"u tüketiciye zorla hatırlatıyor.
Geri dönüş maliyeti: orta

## 2026-08-31 — TriggerObservation'a `complete` alanı
Bağlam: `expect.not_triggered` ile "pdf tetiklenmemeli" denebiliyor. Ama bir host
yalnızca hedef skill'i raporluyorsa, gözlenen `skills` listesi eksiktir ve
"pdf listede yok" ifadesi "pdf tetiklenmedi" anlamına gelmez.
Seçenekler: eksik listeyi tam varsaymak · coexistence'ı v0'dan çıkarmak ·
gözleme `complete` bayrağı eklemek
Karar: `complete: boolean`. `false` iken coexistence iddiası `unknown` üretir.
Gerekçe: Eksik listeyi tam varsaymak, tam da değişmez #1'in yasakladığı sessiz
`pass` olurdu — üstelik en sinsi biçimde, çünkü her coexistence vakası geçerdi.
Bayrak adaptöre "bunu biliyor musun" diye soruyor ve bilmiyorsa ölçüm
yapılmıyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Tetiklenmede kesin fail, ölçülemeyen parçadan önce gelir
Bağlam: Bir vaka hem `triggered: true` hem `not_triggered: [pdf]` diyorsa ve host
tam liste vermiyorsa: hedef skill tetiklenmemişken sonuç ne olmalı?
Seçenekler: ölçülemeyen parça varsa hep `unknown` · kesin başarısızlık önce gelir
Karar: `fail` > `unknown` > `pass`. Hedef skill iddiası kesin biçimde
başarısızsa vaka `fail`; yalnızca ölçülemeyen parça kaldıysa `unknown`.
Gerekçe: `combineVerdicts` ile aynı öncelik. Gerçek bir başarısızlığı `unknown`
arkasına saklamak, ölçmediğini `pass` demek kadar zararlı — kullanıcı kırık bir
skill'i "ölçülemedi" diye geçiştirir.
Geri dönüş maliyeti: düşük

## 2026-08-31 — MockAdapter `@ktlsr/assay-runner/testing` alt yolunda
Bağlam: Veri gerçekliği sözleşmesi MockAdapter'ın arayüze veya seed'e veri
beslemesini yasaklıyor. Bu bir niyet beyanı olarak kalırsa aşınır.
Seçenekler: ana giriş noktasından dışa verip yorumla uyarmak · ayrı alt yol ·
ayrı paket
Karar: `packages/runner/src/testing/mock-adapter.ts`, package.json'da `./testing`
alt yolu. `tools/dependency-boundaries.test.ts` iki şeyi denetliyor: ana giriş
noktası bu yolu dışa vermiyor ve test olmayan hiçbir kaynak onu içe aktarmıyor.
Testin gerçekten yakaladığı, index'e kasıtlı bir export eklenerek doğrulandı.
Gerekçe: Ayrı paket fazla; yorumla uyarmak az. Alt yol, kazayla kullanmayı
imkânsız kılıyor: ayrı bir import yazmak gerekiyor ve o import testte kırmızıya
dönüyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Adaptör metotları async, senkron fırlatma yok
Bağlam: MockAdapter senkron fırlattığında `rejects.toThrow` çalışmıyordu.
Seçenekler: çağıranın hem try/catch hem .catch yazması · metotları async yapmak
Karar: Tüm adaptör metotları `async`. Senkron fırlatmalar da reddedilen promise'e
dönüşür.
Gerekçe: Runner'ın hata yakalamayı tek yerde yapabilmesi için sözleşmenin "her
çağrı promise döner" garantisi vermesi gerekiyor. Aksi hâlde her adaptör
çağrısında iki farklı hata yolu olurdu ve biri er geç unutulurdu.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Faz 1 adaptörü Claude Code
Bağlam: 0.6 fizibilite spike'ı üç hostu karşılaştırdı.
Seçenekler: Claude Code · Codex · Copilot
Karar: Faz 1 adaptörü Claude Code.
Gerekçe: Dört sinyalin dördü de gözlenebiliyor, üçü yüksek güvenilirlikte ve
metin parse etmeye gerek yok. `system/init` aktif skill setini veriyor,
`Skill` tool_use tetiklenmeyi açıkça bildiriyor, `tool_result.is_error` iz
sinyalini taşıyor, `result` mesajı maliyet ve gecikmeyi bedavaya getiriyor.
Codex'in tetiklenme sinyali belgelenmemiş, Copilot'unki log parse gerektiriyor.
Motoru gerçek veriyle doğrulamanın tek temiz yolu bu.
Geri dönüş maliyeti: düşük (adaptör arayüzü host-bağımsız)

## 2026-08-31 — Koşum izolasyonu CLAUDE_CONFIG_DIR ile
Bağlam: İzole edilmemiş bir probe koşumunda 119 skill aktifti; hedef skill
doğal dille tetiklenmedi ve model komşu bir skill'in aracına uzandı.
Seçenekler: kullanıcının kurulumunu olduğu gibi kullanmak · `--bare` ·
temiz `CLAUDE_CONFIG_DIR` + `--plugin-dir`
Karar: Her koşum kendi geçici `CLAUDE_CONFIG_DIR`'ında, skill `--plugin-dir`
ile yalnızca o oturuma yüklenir. Deneyle doğrulandı: skill sayısı 119 → 19.
Gerekçe: İzolasyonsuz ölçülen şey skill değil, kullanıcının kurulumudur.
`--bare` daha temiz olurdu ama OAuth okumuyor, yalnızca ANTHROPIC_API_KEY
kabul ediyor; `CLAUDE_CONFIG_DIR` aynı izolasyonu verip kaldıraç bırakıyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — `subtype: success` tek başına tamamlama kanıtı sayılmaz
Bağlam: İzole config deneyinde koşum "Not logged in" ile bitti ama akış
`subtype: "success"` raporladı.
DÜZELTME (aynı gün, fixture incelenince): Bu kaydın ilk hâli `is_error: false`
diyordu, yanlıştı. Ham veri `is_error: true`, `terminal_reason: "api_error"`,
`total_cost_usd: 0`, `output_tokens: 0`. Yani host yalnızca `subtype` alanında
yanıltıcı; diğer alanlar doğruyu söylüyor. Karar değişmiyor, gerekçesi
daralıyor: tek alana güvenilmez.
Seçenekler: host'un başarı bildirimine güvenmek · çapraz kontrol
Karar: Adaptör `finalize` içinde çapraz kontrol yapar. `total_cost_usd === 0`
ve `usage.output_tokens === 0`, ya da `num_turns === 0`, ya da
`terminal_reason !== 'completed'` ise oturum `unknown` işaretlenir.
Gerekçe: Değişmez #1'in canlı kanıtı. Host'un iyimser başarı bildirimine
güvenmek, tam da sessiz `pass` üretme yolu.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Pin 3 sistem promptu hash'i değil, ortam hash'i olarak adlandırılacak
Bağlam: Claude Code sistem promptunu veya hash'ini vermiyor. `system/init`
model, sürüm, araç listesi, skill listesi, agent listesi, plugin listesi ve
output_style veriyor.
Seçenekler: alanı boş bırakıp pin eksik demek · init alanlarından türetilmiş
hash'i sistem promptu hash'i diye yazmak · türetilmiş hash'i kendi adıyla yazmak
Karar: `init` alanlarından deterministik bir *ortam hash'i* hesaplanır ve
raporda o adla gösterilir; sistem promptu hash'i alanı host vermediği sürece
boş kalır.
Gerekçe: Türetilmiş bir hash'i sistem promptu hash'i diye etiketlemek,
kullanıcıya sahip olmadığı bir garantiyi satmaktır. İki farklı sistem promptu
aynı init alanlarını üretebilir. Ortam hash'i yine de gerçek bir kayma
detektörü — sadece daha az şey iddia ediyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Çapraz-host matrisi Faz 1'e çekilmiyor, roadmap'te kalıyor
Bağlam: 0.6'nın ilk hâli, `claude plugin eval` bulgusu yüzünden çapraz-host
uyumluluk matrisinin "sonraki dalga"dan Faz 1'e çekilmesini önermişti. O öneri
Codex'in ölçülebilir olduğu varsayımına dayanıyordu.
Seçenekler: Codex adaptörünü Faz 1'e almak · metinden çıkarımla ölçmek ·
çapraz-host'u ertelemek
Karar: Ertelemek. Faz 1 yalnızca Claude Code adaptörüyle devam eder.
Gerekçe: Codex deneyle sınandı ve varsayım çürüdü. (1) Tetiklenme yapısal bir
olay olarak yayınlanmıyor; tek kanıt asistan mesajının serbest metni
("I'm using the assay-probe skill because..."). (2) Skill seti izole
edilemiyor: `CODEX_HOME` yalnızca config'i kapsıyor, `USERPROFILE`/`HOME`
override'ı işe yaramadı, 1235 kullanıcı skill'i yüklendi ve bağlam bütçesi
aşıldığı için tüm skill açıklamaları düştü. Metinden çıkarımla ölçmek
teknik olarak mümkün ama değişmez #1'e aykırı: modelin "bu skill'i
kullanıyorum" demesi bir gözlem değil, bir iddiadır. Ölçülemeyen bir şeye
adaptör yazmak, yığında bilinçli olarak olmayanlar listesindeki hatanın
aynısı olurdu.
Geri dönüş maliyeti: düşük — `codex exec --json` akışı araç izi ve tamamlama
için zaten yeterli; yapısal bir skill olayı çıktığı gün adaptör bir günlük iş.

## 2026-08-31 — Farklılaşma çapraz-host değil, ölçüm dürüstlüğü
Bağlam: `claude plugin eval` Faz 1 kapsamıyla örtüşüyor ve çapraz-host kaçış
yolu kapandı. Assay'in var oluş gerekçesi yeniden tanımlanmalı.
Seçenekler: projeyi durdurmak · çapraz-host'u zorlamak · deterministik ölçüm
dürüstlüğüne yaslanmak
Karar: Üçüncüsü. Üç savunma hattı: deterministik skorlama (judge yok), üç
durumlu verdict, regresyon hafızası.
Gerekçe: Bu spike'ta host iki kez, iki farklı sebeple "başarılı" dedi ve koşum
hiç gerçekleşmemişti — önce "not logged in", sonra "401 revoked", ikisinde de
`subtype: success`. Bir eşikten geçen skor bunu göremez. `claude plugin eval`
skorlamayı LLM'e yaptırıyor; kararsızlık ölçen aracın kendisinin kararsız
olması ölçümü açıklanamaz kılıyor. Bu iki fark teknik, bugün inşa edilebilir
ve rakip tarafından kopyalanması ürün kararı gerektirir.
Geri dönüş maliyeti: düşük (konumlandırma, kod değil)

## 2026-08-31 — Adaptör sözleşmesi `core`'a taşındı
Bağlam: `HostAdapter` ve yardımcı tipleri `packages/runner`'daydı ama
`packages/adapters` yalnızca `core`'a bağlanabiliyor (docs/stack.md). Adaptör
sözleşmesini uygulamak için runner'a bağlanması gerekirdi.
Seçenekler: bağımlılık kuralını gevşetmek · sözleşmeyi core'a taşımak ·
adapters'ı runner'a bağımlı yapmak
Karar: `packages/core/src/adapter.ts` — yalnızca tipler, çalışma zamanı kodu
yok. `runner` aynı adla yeniden dışa veriyor, çağrı yerleri değişmedi.
Gerekçe: Tipler saf; core'un "I/O yok" kuralını ihlal etmiyorlar. Bağımlılık
kuralını gevşetmek `web → runner` yasağını da tartışmaya açardı; kural
gevşetilmedi, tip doğru yere kondu.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Claude Code süreci doğrudan `.exe` olarak spawn ediliyor
Bağlam: İlk canlı koşumda üç vakadan ikisi `unknown` döndü; akış hiç gelmedi.
Sebep: Windows'ta Node 22 `.cmd` dosyalarını kabuk olmadan spawn etmiyor
(CVE-2024-27980) ve kabuğa düşünce çok satırlı istem argümanı bozuluyor.
Seçenekler: istemi tek satıra sıkıştırmak · geçici dosyaya yazıp yolunu
geçmek · PATH üzerinde `.exe` arayıp doğrudan spawn + istemi stdin'den vermek
Karar: Üçüncüsü. `resolveBinary` PATH'te `claude.exe` arar; bulunca kabuk
kullanılmaz. İstem her durumda stdin'den gider.
Gerekçe: İstemi sıkıştırmak vaka setini bozar — çok satırlı istem gerçek bir
kullanım. Geçici dosya, sandbox yüzeyine gereksiz bir dosya ekler. `.exe`
doğrudan spawn hem kabuk ayrıştırmasını hem ARG_MAX sınırını ortadan
kaldırıyor. Kabuk yolu yedek olarak duruyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — `complete: true`, Claude Code için
Bağlam: `TriggerObservation.complete`, gözlenen skill listesinin tam olup
olmadığını söylüyor. Claude Code adaptörü ne bildirmeli?
Seçenekler: temkinli davranıp `false` · `true`
Karar: `true`, ama yalnızca çapraz kontrolden geçmiş oturumlarda.
Gerekçe: `system/init` aktif skill setinin tamamını veriyor ve model tarafından
seçilen her skill çağrısı `Skill` aracından geçiyor (12 gerçek transkriptte
doğrulandı, canlı koşumda da öyle davrandı). `false` demek her coexistence
vakasını kalıcı olarak `unknown` yapardı — ölçülebilir bir şeyi ölçmemek olurdu.
Kalan risk: `Skill` aracı olmadan içerik enjekte eden üçüncü bir yol varsa
gözden kaçar; yokluğu kanıtlanamadı (docs/host-feasibility.md).
Geri dönüş maliyeti: düşük (tek alan)

## 2026-08-31 — Sandbox gözlemler, zorlamaz (Faz 1)
Bağlam: 1.2 izolasyon teknolojisini seçmemi istiyordu; kriter kurulum kolaylığı
değil izolasyon güvenilirliği.
Seçenekler: Docker konteyner · işletim sistemi seviyesi jail · geçici çalışma
dizini + host'un araç izni katmanı
Karar: Üçüncüsü, ve **hiçbir yerde "engelleniyor" denmiyor, "gözleniyor"
deniyor.** Her attempt kendi geçici dizininde; dosya sistemi öncesi/sonrası
hash'lenip farkı alınıyor; çalışma dizini dışına yazma girişimleri izdeki araç
çağrılarından okunuyor; ağ araçları host'un `--disallowed-tools` mekanizmasıyla
reddediliyor.
Gerekçe: Docker'ı bugün eklemek, ölçemediğimiz bir şeye altyapı yazmak olurdu
(yığında bilinçli olarak olmayanlar listesi). Asıl risk teknoloji seçimi değil,
**kapasiteyi olduğundan fazla göstermek**. Tavan kodda ve dokümanda açıkça
yazılı: süreç kendi başına soket açarsa görülmez, dosya sistemi yazımı OS
seviyesinde engellenmez. 1.3 güvenlik incelemesi bu yüzeyi ölçecek ve gerekirse
Docker o zaman gelecek.
Geri dönüş maliyeti: orta (sandbox arayüzü değişmeden altına konteyner konabilir)

## 2026-08-31 — Adaptör varsayılan izin modu `acceptEdits`, ağ reddedilir
Bağlam: İlk uçtan uca koşumda tamamlama vakası 0/3 geçti. İz gösterdi ki
`--permission-mode dontAsk` `Write` ve `Bash`'i reddediyor; ajan dosyayı hiç
yazamıyordu.
Seçenekler: `dontAsk` (hiçbir tamamlama vakası ölçülemez) · `bypassPermissions`
(sandbox dışına da yazar) · `acceptEdits` + ağ araçlarının reddi
Karar: `acceptEdits`, artı `--disallowed-tools WebFetch WebSearch`.
Gerekçe: Ajan sandbox çalışma dizinine yazabilmeli, yoksa görev tamamlama
katmanı ölçülemez. `bypassPermissions` sandbox iddiasını tamamen boşaltırdı.
Ağın kapalı olması `side_effect: { network: deny }` iddiasının dayandığı tek
gerçek; açık bırakmak o assertion'ı süs hâline getirirdi.
Geri dönüş maliyeti: düşük (adaptör seçeneği)

## 2026-08-31 — Reddedilen araç çağrısı yan etki sayılmaz
Bağlam: Canlı koşumda ajan sandbox dışına yazmayı denedi, host reddetti; ama
`EnvDiff.writes` o yolu yazılmış gibi gösteriyordu.
Seçenekler: denenen her yolu yazım saymak · yalnızca başarılı çağrıları saymak
Karar: `TraceEvent`'e `id` (çağrı) ve `callId` (sonuç) alanları eklendi; sonucu
hata olan çağrı yan etki üretmiyor, ağ çağrısı ise `blocked: true` işaretleniyor.
Sonucu hiç gelmemiş çağrı gerçekleşmiş sayılıyor — sessizce yok sayılmıyor.
Gerekçe: Gerçekleşmemiş bir yazımı kaydetmek, ölçüm aracında kabul edilemez bir
yalan. Ters yön de tehlikeli: sonucu bilinmeyen çağrıyı yok saymak gerçek bir
yan etkiyi gizleyebilirdi, o yüzden şüphe hâlinde "oldu" kabul ediliyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Pin 1'e içerik hash'i eklendi (`skillHash`)
Bağlam: CLI'ın `compare` komutu ilk gerçek denemede iki koşumu karşılaştırdı ve
"regresyon yok" dedi — oysa aralarında skill dosyasını değiştirmiştim. Sebep:
pin 1 (`target.source`) beyan edilen bir string ve içerik değişince kımıldamıyor.
Seçenekler: kullanıcının beyanına güvenmek · skill dizininin içerik hash'ini
runner'ın hesaplaması
Karar: `Pins.skillHash` — runner skill dizininin içerik hash'ini hesaplar ve
kayda yazar; `comparePins` bunu da denetler. `suiteVersion`/`suiteHash` çiftinin
aynısı. Store sürümü 2'ye çıkarıldı.
Gerekçe: Beyan edilen sürüm unutulur. Unutulduğunda iki farklı skill'in koşumları
karşılaştırılabilir görünüyordu ve bu, ürünün tek iddiasını — regresyon sinyali —
sessizce yanlış yapıyordu. Gerçek koşumla doğrulandı: skill'e tek satır eklendi,
beyan değişmedi, `compare` "skillHash changed" diyerek reddetti ve exit 3 döndü.
Geri dönüş maliyeti: düşük

## 2026-08-31 — CLI çıkış kodu 3: ölçülemedi
Bağlam: CI'da "başarısız" ile "ölçülemedi" aynı kodla dönerse değişmez #1
komut satırında kaybolur.
Seçenekler: unknown'ı 1 saymak · 0 saymak · ayrı kod
Karar: `0` geçti, `1` bir vaka düştü, `2` kullanım hatası, `3` hiçbir şey
ölçülemedi. `--allow-unknown` ile 3 → 0.
Gerekçe: Bir test aracının en tehlikeli hatası ölçemediğini "geçti" saymaktır;
`0` bunu yapardı. `1` de yanlış: kullanıcı kırık bir skill arar, oysa sorun
kimlik bilgisi veya host'tur. Ayrı kod, boru hattının bu iki durumu farklı ele
almasına izin veriyor. Bayrak, kararı kullanıcıya bırakıyor ama varsayılanı
dürüst tarafta tutuyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Regresyon iddiası güven aralıklarına dayanır
Bağlam: İki oran farklı diye regresyon demek, küçük N'de neredeyse her koşumda
alarm üretir.
Seçenekler: ham fark eşiği · güven aralığı kesişimi
Karar: Aralıklar kesişiyorsa `within_noise`; ayrıksa ve düşüş varsa `regressed`.
Gerekçe: N=3 ile %100'den %0'a düşüş bile istatistiksel olarak gürültüden ayırt
edilemiyor ve bunu söylemek dürüstlük. Ham eşik, kullanıcıyı sahte alarmlara
boğar ve alarmları görmezden gelmeyi öğretir — regresyon aracının ölümü budur.
Bedeli: gerçek ama küçük regresyonları yakalamak için N büyütmek gerekiyor,
ki zaten doğru cevap o.
Geri dönüş maliyeti: düşük

## 2026-08-31 — CI baseline'ı GitHub artefaktı
Bağlam: 1.5 regresyon karşılaştırması için önceki koşumun nereden geleceğini
sormuş ve kararı bana bırakmıştı.
Seçenekler: repoya commit'lenen baseline dosyası · GitHub Actions artefaktı ·
hosted baseline (Faz 2)
Karar: Aynı workflow'un base branch üzerindeki en son başarılı koşumundan
`assay-runs` artefaktı indirilir.
Gerekçe: Commit'lenen baseline, ölçüm sonucunu repo geçmişine karıştırır ve her
koşumda gürültülü bir diff üretir. Hosted baseline Faz 2'de gelecek ama SDK'nın
platformsuz tam çalışması şart. Artefakt, `GITHUB_TOKEN` dışında hiçbir şey
istemiyor.
Bilinen sınırlar açıkça yazıldı: artefaktlar süresi dolunca kaybolur (varsayılan
90 gün), bir branch'in ilk koşumunda baseline yoktur ve yorum bunu söyler,
yakın zamanlı iki PR aynı baseline'a bakar. Karşılaştırma mantığı `core`'da
olduğu için Faz 2'de yalnızca "önceki koşum nereden geliyor" değişecek.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Action yalnızca kendi ürettiği kaydı raporlar
Bağlam: `action/run.mjs` ilk hâlinde `.assay/runs` içindeki en yeni kaydı
okuyordu. CLI çöktüğünde bu, **önceki koşumun sonucunu** bu koşumunmuş gibi
raporluyordu — yerel denemede görüldü.
Seçenekler: her koşumdan önce store'u temizlemek · koşum kimliğini CLI'dan
almak · koşum öncesi/sonrası en yeni kaydı karşılaştırmak
Karar: Üçüncüsü. Koşumdan önceki en yeni kayıt kimliği tutuluyor; sonrasında
değişmemişse kayıt üretilmemiş sayılıyor ve `::error::` ile `unknown` çıkıyor.
Gerekçe: Store'u temizlemek yerel geçmişi siler. Bir aracın en tehlikeli hatası
ölçmediğini ölçülmüş göstermek; burada üstelik *başka bir koşumun* sonucunu
gösterecekti.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Ajan süreci ortamı devralmaz, allowlist geçer
Bağlam: 1.3 güvenlik incelemesi. Adaptör alt sürece `{ ...process.env }`
geçiriyordu.
Seçenekler: tüm ortamı geçirmek · bilinen sırları çıkarmak (denylist) ·
allowlist
Karar: Allowlist. `PATH`, `HOME`/`USERPROFILE`, `TEMP`, `SystemRoot`,
`PATHEXT`, dil/saat dilimi, proxy ve `ANTHROPIC_BASE_URL`. Kimlik bilgisi
ayrıca ekleniyor.
Gerekçe: Denylist her yeni sır adında güncellenmesi gereken bir liste demek ve
biri mutlaka unutulur. Allowlist'te unutulan şey en kötü ihtimalle host'un
çalışmamasına yol açar — sessiz sızıntıya değil. CI'da bu fark
`GITHUB_TOKEN`'ın ölçülen skill'e açık olup olmaması demek.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Kabuk komutu kullanan koşumda yan etki iddiası `unknown`
Bağlam: `EnvDiff.writes` anlık görüntü farkından ve `Write`/`Edit` araç
çağrılarından türetiliyor. Bir kabuk komutu ikisinde de görünmüyor;
`side_effect` assertion'ı bu durumda `pass` dönüyordu.
Seçenekler: kabuk argümanını ayrıştırıp ne yaptığını tahmin etmek · kabuk
araçlarını tamamen yasaklamak · gözlenemeyen çağrıyı kaydedip iddiayı
`unknown` yapmak
Karar: Üçüncüsü. `EnvDiff.unobserved` alanı; boş değilse `side_effect`
`unknown` üretiyor.
Gerekçe: Kabuk komutunun ne yaptığını argümanından okumak (`echo`, `>`, `curl`,
boru hatları, değişken genişletme) güvenilir değil ve tam da sessizce yanlış
geçiren yer olurdu. Kabuğu yasaklamak, kabuk kullanan skill'leri ölçülemez
yapardı. Bedeli açık: kabuk kullanan her skill'in yan etki katmanı `unknown`
olur — doğru bedel bu, alternatifi ölçmediğini ölçtüm demek (değişmez #1).
Geri dönüş maliyeti: düşük

## 2026-08-31 — Sandbox sınırları kapatılmadı, ölçüldü ve yazıldı
Bağlam: 1.3, dosya sistemi ve ağ sınırının gerçekten zorlanıp zorlanmadığını
soruyor.
Seçenekler: Docker/konteyner sandbox'ı şimdi eklemek · sınırı host'a bırakıp
belgelemek
Karar: İkincisi. `docs/sandbox-security.md` içinde A1 ve A2 kabul edilen risk
olarak yazıldı: dosya sistemi ve ağ sınırı Claude Code'un izin katmanına
dayanıyor, disk ve CPU kotası yok.
Gerekçe: Konteyner gerçek çözüm ama Faz 1'in sorusu "ölçebiliyor muyuz"
idi ve cevap evet çıktı. Şimdi eklemek, ürünün asıl riskini (ölçüm dürüstlüğü)
çözmeden altyapı yazmak olurdu. Asıl tehlike izolasyonun eksikliği değil,
**eksik izolasyonu tam sanmak** — o yüzden M1'de gözlenemeyen yüzey `unknown`
üretiyor ve hiçbir yerde "engelleniyor" denmiyor. Konteyner Faz 3'e bırakıldı;
bu rapor onu artık gerekçelendiriyor.
Geri dönüş maliyeti: orta (sandbox arayüzü değişmeden altına konteyner konur)

## 2026-08-31 — Dogfooding hedefi: birbirinin yakın komşusu üç skill
Bağlam: 1.6 üç-beş gerçek skill istiyor ve seçimin gerekçelendirilmesini
şart koşuyor.
Seçenekler: rastgele popüler skill'ler · tek bir skill'i derinlemesine ·
birbirinin yakın komşusu olan bir küme
Karar: `docx`, `pdf`, `xlsx` (anthropics/skills). Skill'ler repoda
vendor'lanmadı; proprietary lisanslılar, yerel kurulumdan kopyalanıyor.
Gerekçe: Üçü de "bunu bir belgeye çevir" istemiyle çağrılabilir, yani
birbirlerinin en zor negatifi. Yakın-komşu vakası yazmak için ideal küme ve
değişmez #5'in ölçtüğü şey tam burada sınanıyor. Rastgele skill'lerle
negatif vakalar kolay olurdu ve ayrım gücü ölçülmemiş olurdu.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Ölçülemeyecek katmanlar suite'e konmadı
Bağlam: Doküman skill'leri Python betikleri çalıştırıyor; izole çalışma
dizininde bağımlılıkları yok. Ayrıca `Bash` kullandıkları için 1.3'ten sonra
`side_effect` zaten `unknown` üretecekti.
Seçenekler: artefakt ve yan etki vakalarını ekleyip `fail`/`unknown` almak ·
eklememek ve raporda nedenini yazmak
Karar: Eklenmedi; docs/dogfooding.md "Ölçülemeyenler" başlığında neden
eklenmediği yazıldı. Tamamlama katmanı ayrıca `examples/widget-manifest`
suite'iyle doğrulandı.
Gerekçe: Python kurulumu eksik olduğu için düşen bir artefakt vakası skill'i
değil sandbox'ı ölçerdi ve raporu gürültüyle doldururdu. Sonucu baştan belli
olan bir ölçümü koşmak, ölçüm değil tören olur. Ama sessizce atlamak da
olmaz — raporda açıkça yazılı.
Geri dönüş maliyeti: düşük

## 2026-08-31 — `db` paketi `core`'a bağlanabilir
Bağlam: 2.1 "şemayı core'daki kanonik tiplerden türet" diyor ama bağımlılık
grafiği `db → (bağımsız)` idi.
Seçenekler: db'yi bağımsız tutup eşlemeyi web'e taşımak · db → core izni
Karar: `db → core`. Eşleme (`toRunRow`/`fromRunRow`) db paketinde.
Gerekçe: Eşlemeyi web'e taşımak, CLI'ın `push` komutunun aynı kodu tekrar
yazmasını gerektirirdi ve iki kopya er geç ayrışırdı — tam olarak 2.1'in
yasakladığı şey. Kuralın amacı core'u bağımsız tutmak ve web'i runner'dan
uzak tutmaktı; db'yi core'dan izole etmek o amaca hizmet etmiyor.
`packages/ui` bağımsız kalıyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Kısıt testleri PGlite ile, Docker'sız
Bağlam: CHECK kısıtlarının gerçekten tuttuğunu kanıtlamak için Postgres
gerekiyor.
Seçenekler: Docker'da postgres · testcontainers · PGlite (süreç içi WASM
Postgres) · kısıtları test etmemek
Karar: PGlite. `packages/db/src/constraints.test.ts` migration'ı uygulayıp
her kısıtı ihlal ediyor.
Gerekçe: Docker CI'da servis, yerelde kurulum demek; testler o an koşulmaz
hâle gelir ve kısıtlar denetimsiz kalır. PGlite gerçek Postgres semantiği
veriyor (CHECK, enum, jsonb, cascade) ve `pnpm test` içinde saniyeler sürüyor.
Kısıtın gerçekten tuttuğu ancak koşulan bir testle bilinir.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Tüm zaman damgaları `timestamptz`
Bağlam: Gidiş-dönüş testi 3 saatlik kayma gösterdi. Prisma'nın `DateTime`
varsayılanı `timestamp(3)` — saat dilimsiz.
Seçenekler: eşlemede UTC'ye zorlamak · şemada `@db.Timestamptz(3)`
Karar: Şemada. Tüm `DateTime` alanları `timestamptz`.
Gerekçe: Ölçüm kaydındaki zamanlar mutlak anlar. Saat dilimsiz saklamak,
başka bir bölgedeki sunucunun farklı zamanlar okuması demek; eşlemede
düzeltmek de her yeni alanda tekrarlanacak bir hatırlama işi olurdu.
Test bunu yakaladı, kod incelemesi yakalamazdı.
Geri dönüş maliyeti: düşük (migration henüz uygulanmadı)

## 2026-08-31 — `Case.expectTriggered` NOT NULL değil, "bir şey ölçer" CHECK'i
Bağlam: 2.1 `Case.expectTriggered NOT NULL` istiyor. Ama 0.3'te yayımlanan
vaka şeması, yalnızca artefakt ölçen vakalara izin veriyor.
Seçenekler: NOT NULL yapıp şemayı kırmak · nullable bırakıp kuralı gevşetmek ·
nullable + "vaka bir şey ölçmeli" CHECK'i
Karar: Üçüncüsü. `expectTriggered IS NOT NULL OR notTriggered dolu OR
assertions dolu`.
Gerekçe: Kuralın amacı "her vaka bir şey ölçsün" idi; `expectTriggered NOT
NULL` bunun bir vekiliydi ve tamamlama vakalarını yasaklardı. CHECK niyeti
doğrudan ifade ediyor.
Not: ilk yazımı `array_length('{}',1) > 0` içeriyordu; Postgres'te bu NULL
döner ve NULL sonuçlu CHECK ihlal sayılmaz — kısıt sessizce boşa çıkıyordu.
Test yakaladı, `coalesce` ile düzeltildi.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Faz 2'de doğrudan `main`, feature branch değil
Bağlam: Sözleşme 2 Faz 2'den itibaren her adım için feature branch ve PR
istiyordu; kullanıcı sonradan "commit et, main'e push et" talimatı verdi.
Seçenekler: PR akışını sürdürmek · doğrudan main
Karar: Doğrudan `main`. `faz2/veri-modeli` dalı açılmıştı, main'e birleştirildi.
Gerekçe: Kullanıcının açık talimatı sözleşmenin üzerinde. Tek geliştiricili
otonom bir akışta PR, incelemesi olmayan bir tören olurdu; koruma testlerde
ve pre-commit hook'ta duruyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Tipografi: Instrument Serif + IBM Plex, Fraunces + Inter değil
Bağlam: 2.2 Fraunces + Inter'i başlangıç noktası veriyor, daha iyisi bulunursa
değiştirilmesini ve gerekçelendirilmesini istiyor.
Karar: Instrument Serif (başlık) + IBM Plex Sans (gövde) + IBM Plex Mono (veri).
Gerekçe: Fraunces yumuşak ve hümanist — bir dergi kapağı, ölçüm aleti değil.
Inter'in tabular rakamları var ama karakteri yok ve her arayüzde duruyor.
IBM Plex, kimliği ölçüm ve makine olan bir şirket için tasarlandı; mono kardeşi
sans ile aynı iskeleti paylaşıyor, yani bir hash ile bir etiket aynı sesle
konuşuyor — sertifika dilinde bu önemli.
Geri dönüş maliyeti: düşük (token)

## 2026-08-31 — `unknown` rengi antimon (soğuk arduvaz mavisi)
Bağlam: Bağlayıcı kısıt: UNKNOWN yeşile ya da kırmızıya yakın hiçbir ton
almayacak, nötr ama görmezden gelinemeyecek.
Seçenekler: gri · sarı/amber · soğuk mavi-gri
Karar: `#5B6B8A`. Ayrıca şekil farkı: pass `●`, fail `✕`, unknown `◐`.
Gerekçe: Gri görmezden gelinir; amber uyarı rengi ve kırmızıya yakın okunur.
Soğuk mavi-gri ikisinden de eşit uzakta, iki temada da metinden ayrışıyor.
Antimon tahlilde gerçekten kullanılan bir metal — paletin geri kalanıyla aynı
dünyadan. Yarım dolu daire "kısmen bilinen" demek; renk kaldırılsa bile anlam
duruyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Tailwind kaynak yolları açıkça bildiriliyor
Bağlam: Tailwind v4 kaynakları otomatik bulmaya çalışıyor ama bu monorepo'da
bulamadı: üretilen stil sayfasında tek bir utility yoktu ve sayfa tamamen
stilsiz render edildi.
Seçenekler: otomatik tespite güvenmek · `@source` ile yolları yazmak
Karar: `@source "../app"` ve `@source "../lib"`.
Gerekçe: Sessizce stilsiz bir sayfa üretmek, iki satır yazmaktan çok daha
pahalı. Ekran görüntüsü almasaydım fark edilmezdi — "arayüzü etkileyen her
adımdan sonra ekran görüntüsü al" kuralının karşılığı bu.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Kanonik kayda `skill` alanı
Bağlam: Koşum listesi ekranında dört skill de "skills" görünüyordu. Kayıt
skill adını taşımıyor; `pins.skillSource` sürümü taşıyor
(`anthropics/skills@local-install`), adı değil.
Seçenekler: adı `skillSource`'tan ayrıştırmak · suite dosyasını okumak ·
kayda `skill` alanı eklemek
Karar: `Run.skill`. Prisma şemasına da eklendi.
Gerekçe: `skillSource`'tan ayrıştırmak `owner/repo@sha` biçimini varsayar ve
yerel bir skill'de anlamsız. Suite dosyasını okumak, kaydın kendi kendine
yetmesi ilkesini bozar — hosted taraf suite dosyasını görmüyor.
`expectedTrigger` ile aynı gerekçe.
Geri dönüş maliyeti: düşük

## 2026-08-31 — `@ktlsr/assay-ui` bağımsız kalıyor, `Measurement` yapısal olarak uyuyor
Bağlam: `MetricValue` bileşeni core'daki `Proportion` tipine ihtiyaç duyuyor
ama bağımlılık grafiği `ui → (bağımsız)` diyor.
Seçenekler: `ui → core` izni · ui'da yapısal olarak uyumlu kendi tipi
Karar: İkincisi. `Measurement { successes, n, rate, ci }` — core'un
`Proportion`'ı buna atanabiliyor. Uyum `tools/ui-contract.test.ts` ile hem
tip hem davranış seviyesinde denetleniyor (iki biçimlendiricinin aynı metni
ürettiği de sınanıyor).
Gerekçe: `db → core` iznini vermiştim çünkü orada alternatif eşlemeyi ikiye
bölmekti. Burada öyle değil: tasarım sistemi kendi başına kullanılabilir
kalıyor ve kural yalnızca "oran N ve aralık olmadan render edilemez" — bunu
yapısal bir tip de zorluyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Tema tokenları `:root`'a değil, herhangi bir kaba bağlanıyor
Bağlam: Bileşen kataloğu iki temayı aynı sayfada yan yana göstermeli.
Tokenlar `:root[data-theme='dark']` ile yazılmıştı; koyu panel sessizce açık
render ediliyordu.
Karar: `[data-theme='dark']` ve `[data-theme='light']` — kök şartı kalktı.
Sıra: temel açık → sistem tercihi → koyu öznitelik → açık öznitelik.
Gerekçe: Kök şartı, temayı iç içe kullanmayı imkânsız kılıyordu. Ekran
görüntüsü yakaladı; kod incelemesi yakalamazdı çünkü CSS geçerliydi.
Geri dönüş maliyeti: düşük

## 2026-08-31 — `apps/web` `@ktlsr/assay-ui`'yi kaynaktan derliyor
Bağlam: İz görüntüleyicinin ızgarası sessizce çöktü. Sebep: Tailwind `src`'yi
tarıyordu ama çalışma zamanı derlenmiş `dist`i kullanıyordu; sınıf adı ile
CSS kuralı ayrıştı.
Seçenekler: dev sırasında `tsc -b --watch` · Next `transpilePackages`
Karar: `transpilePackages: ['@ktlsr/assay-ui']`, ui'nın `exports` alanı `src`i
gösteriyor. İç importlardaki `.js` uzantıları kaldırıldı (ui zaten Bundler
çözümlemesi kullanıyor).
Gerekçe: İki yerden derlenen tek bir paket her zaman ayrışır. Watch süreci
eklemek sorunu ertelerdi. Tek kaynak = tek gerçek.
Geri dönüş maliyeti: düşük (ui yayımlanacaksa `dist` tekrar açılır)

## 2026-08-31 — Katman bileşenleri Radix üzerine
Bağlam: 2.3 modal, alert dialog, tooltip, popover, dropdown ve toast istiyor;
odak tuzağı ve erişilebilirlik şart.
Seçenekler: elle yazmak · shadcn/ui'yi olduğu gibi almak · Radix primitifleri
üzerine kendi görünümümüzü koymak
Karar: Üçüncüsü. Radix'in davranışı, Assay'in görünümü.
Gerekçe: Odak tuzağı, kaçış tuşu, dışarı tıklama ve `aria-*` ilişkilerini elle
doğru yazmak zor ve erişilebilirlik "sadeleştirilmeyecekler" listesinde
(ponytail). shadcn'in varsayılan görünümü ise tam da kaçınılan jenerik dil —
dolgulu rozet, yumuşak gölge, yuvarlak köşe. Davranışı alıp görünümü
tokenlarla yeniden çizmek ikisini birden veriyor.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Kimlik doğrulama Auth.js v5 (beta), oturum stratejisi JWT
Bağlam: 2.5'te giriş gerekiyor. Yığın "Auth.js" diyor; v5 Next 15 App Router
için uygun sürüm ama hâlâ beta (5.0.0-beta.32). Ayrıca Auth.js'te credentials
sağlayıcısı veritabanı oturumuyla çalışmıyor.
Seçenekler: next-auth v4 (kararlı ama App Router'da sürtünmeli) · v5 beta ·
kendi oturum katmanımız
Karar: `next-auth@beta` (v5), `session.strategy = 'jwt'`. Prisma adaptörü yine
kurulu: kullanıcı, hesap ve doğrulama kayıtları veritabanında.
Gerekçe: Kendi oturum yönetimimizi yazmama kararı zaten verilmişti. v4'ün App
Router yolu yamalı; iki kez yazmaktansa beta'yı sabitlemek daha ucuz. JWT
seçimi bir tercih değil, credentials sağlayıcısının şartı. Bedeli: oturum
sunucudan tek tıkla iptal edilemez — bu yüzden `jwt` geri çağrısı her istekte
kullanıcının rolünü ve askı durumunu veritabanından tazeliyor ve askıya alınan
kullanıcının token'ı bir sonraki istekte ölüyor.
Geri dönüş maliyeti: orta

## 2026-08-31 — RBAC middleware'de değil, layout/guard katmanında
Bağlam: Plan "RBAC middleware" diyor. Next middleware kenar (edge) çalışma
zamanında koşuyor; Prisma ve Argon2 orada çalışmıyor.
Seçenekler: Auth.js'in bölünmüş config'i ile kenar-güvenli middleware · korunan
her layout'ta sunucu tarafı guard
Karar: `apps/web/lib/guard.ts` — `requireUser` / `requireAdmin`, korunan
bölümün layout'unda çağrılır.
Gerekçe: Bölünmüş config, rolü token'dan okuyan ikinci bir doğruluk kaynağı
yaratırdı. Layout'ta denetim, o bölümün bütün alt yollarını kapsıyor;
middleware eşleştiricisine yeni bir yol eklemeyi unutma riski yok. Kaybedilen:
korumalı sayfa isteği sunucuya kadar geliyor — ölçülebilir bir maliyeti yok.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Geliştirme veritabanı: PGlite'ın soket sunucusu
Bağlam: Hosted katman Postgres istiyor; geliştirme makinesinde Postgres kurulu
değil ve `DATABASE_URL` bir sır. Sır beklemek 2.5'i durdururdu.
Seçenekler: Docker Postgres · kurulu Postgres şartı · PGlite'ı soket sunucusu
olarak açmak
Karar: `tools/dev-postgres.mjs` — PGlite'ı `@electric-sql/pglite-socket` ile
127.0.0.1:5433'te Postgres tel protokolüyle açar. `pnpm db:dev`.
Gerekçe: Kısıt testleri zaten PGlite üzerinde koşuyor; aynı motoru bir porta
açmak Prisma için gerçek bir Postgres demek ve sürücü farkı bırakmıyor.
Docker'a bağımlılık, aracın kendi kurulumunu kırılganlaştırırdı. Üretimde
`DATABASE_URL` gerçek bir Postgres'i gösterir; kod tarafında fark yok.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Kayıt ekranı yok; ilk yönetici komut satırından
Bağlam: İlk yöneticinin nasıl doğduğu belirsiz.
Seçenekler: açık kayıt + "ilk kayıt olan yönetici olur" · davet · kurulum
komutu
Karar: `pnpm db:user <email> <parola> ADMIN`. Web'de kayıt ekranı yok.
Gerekçe: "İlk kayıt olan yönetici olur" kestirmesi, kurulumla ilk ziyaret
arasındaki pencerede yarış açar. Hosted taraf zaten davetle açılacak; kurulum
komutu bunun en küçük hâli.
Geri dönüş maliyeti: düşük

## 2026-08-31 — Prisma 7 sürücü adaptörü `@prisma/adapter-pg`
Bağlam: Prisma 7 `datasourceUrl` ile doğrudan bağlanmayı kaldırdı; istemci bir
sürücü adaptörü istiyor.
Seçenekler: Accelerate · `@prisma/adapter-pg`
Karar: `@prisma/adapter-pg`, bağlantı adresi `DATABASE_URL`'den.
Gerekçe: Accelerate harici bir servis ve para harcar. `pg` adaptörü hem
geliştirmedeki PGlite soketine hem üretimdeki Postgres'e aynı şekilde bağlanıyor.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Koşum görünürlüğü varsayılan gizli, vaka seti seviyesinde
Bağlam: 3.1 güvenlik incelemesi, yüklenen her koşumun kimliği bilen herkese
açık olduğunu buldu. Kayıt istem metinlerini, araç argümanlarını ve dosya
yollarını taşıyor.
Seçenekler: her şeyi oturum arkasına almak · koşum başına görünürlük bayrağı ·
vaka seti başına görünürlük bayrağı
Karar: `Suite.public`, varsayılan `false`. Erişim `RunScope` ile sorgu
katmanında; `listRuns`/`loadRun` kapsam almadan çağrılamıyor.
Gerekçe: Her şeyi oturum arkasına almak, tanıtım sayfasının gerçek bir ölçüm
gösterme yolunu kapatırdı ve ürünün iddiası tam da bu. Koşum başına bayrak,
aynı vaka setinin bazı koşumları açık bazıları gizli olduğunda karşılaştırmayı
yarım gösterir. Vaka seti doğal birim: yayımlanan şey bir ölçüm serisi.
Kapsamı çağırana bırakmak, bir ekranda unutulduğunda sessiz sızıntı demekti;
bu yüzden parametre zorunlu.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Geliştirme veritabanı migration'ları dev-postgres.mjs uyguluyor
Bağlam: İkinci migration geldiğinde `prisma migrate` gölge veritabanı istedi;
PGlite onu vermiyor.
Seçenekler: her migration'ı elle uygulamak · geliştirmede gerçek Postgres şartı
· sunucunun kendi izleme tablosu
Karar: `tools/dev-postgres.mjs` bir `_assay_migrations` tablosu tutuyor ve
açılışta yalnızca eksik migration'ları uyguluyor. Testler de bütün
migration'ları sırayla uyguluyor.
Gerekçe: Elle uygulama, bir migration'ı atlamış bir geliştirme veritabanıyla
saatlerce koşmak demek. Üretimde `prisma migrate deploy` kullanılacak; bu
yalnızca geliştirme kolaylığı ve on beş satır.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Palet akromatik; kroma yalnızca ölçümde
Bağlam: İlk palet (sıcak krem zemin, koyu kahve, altın vurgu) gerçek ekranlarda
görülünce ölçüm aleti değil dergi kapağı gibi duruyordu ve o kombinasyon şu an
her yerde.
Seçenekler: sıcaklığı azaltmak · başka bir marka rengi seçmek · arayüzü
akromatik yapıp kromayı ölçüme ayırmak
Karar: Üçüncüsü. Zemin ve çizgiler soğuk nötr; renk yalnızca verdict işareti,
güven aralığı ve kayan koşulda. Marka vurgu rengi yok — vurgu mürekkebin
kendisi.
Gerekçe: Kural artık okunabilir: ekranda bir renk gördüysen o bir ölçüm
sonucudur. Marka rengi eklemek renge ikinci bir anlam yüklerdi ve birinciyi
zayıflatırdı. Ayrıca kroma nadir olduğu için verdict renkleri neon olmak
zorunda kalmıyor; iki temada da düşük doygunlukla ayrışıyorlar.
Geri dönüş maliyeti: düşük (yalnızca token)

## 2026-09-01 — İkonlar çizilmiş SVG, Unicode glifi değil
Bağlam: Verdict işaretleri, iz adımları ve tema düğmesi Unicode glifleriyle
yazılmıştı (`●`, `✕`, `◐`, `→`, `¶`).
Seçenekler: glifleri sürdürmek · bir ikon kütüphanesi eklemek · seti kendimiz
çizmek
Karar: `packages/ui/src/icons.tsx` — 16×16 ızgara, 1.5 birim tek kalem
kalınlığı, `currentColor`. Bağımlılık eklenmedi.
Gerekçe: Glifler her yazı tipinde farklı boyda ve farklı taban çizgisinde
oturuyor; hizalama tesadüfe kalıyordu. Kütüphane, on beş ikon için bir
bağımlılık ve yabancı bir çizim dili demekti. Verdict işaretlerinin tek aileden
olması (aynı çember, içi farklı) ancak kendi çizimimizle mümkündü.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Tema düğmesi tek ikon, tıkladıkça dönüyor
Bağlam: Üç düğmelik grup (LIGHT/DARK/SYSTEM) hem metin butonlarından oluşuyordu
hem dar ekranda başlığı sıkıştırıyordu.
Seçenekler: üç ikonlu grup · açılır menü · tek düğme, döngü
Karar: Tek düğme; o anki durumu gösteriyor, tıklamak sıradakine geçiriyor.
Sıra: sistem → açık → koyu.
Gerekçe: Üç düğme, üç durumun ikisini her zaman gereksiz gösteriyor. Açılır menü
tek tıklık bir iş için iki tık. Döngü tahmin edilebilir ve tek bir hedef; ekran
okuyucu etiketi hem şimdiki durumu hem sonraki adımı söylüyor.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Oran üç kayıtta gösteriliyor
Bağlam: Değişmez #4 oranın N ve güven aralığıyla gösterilmesini şart koşuyor
ama `%70 (N=20, %95 GA %48–%85)` biçimi istatistik bilmeyen kullanıcı için
okunmuyordu.
Seçenekler: biçimi sadeleştirip aralığı küçültmek · aralığı kaldırıp yalnızca N
bırakmak (değişmez ihlali) · aynı oranı üç kayıtta göstermek
Karar: Üçüncüsü. Sayım cümlesi ("20 denemenin 14'ünde tetiklendi") → büyük
yüzde → çizilmiş aralık ve genişliğinin ne dediği. Ayrıca koşum ekranının
tepesinde tek cümlelik hüküm.
Gerekçe: İstatistik bilmeyen okuyucu birinci satırda cevabı alıyor, bilen
üçüncüde belirsizliği görüyor. Aralığı küçültmek onu süse çevirirdi; kaldırmak
değişmezi ihlal ederdi. Payda görünür olduğu için "%100" ile "4/4" arasındaki
fark da kayboluyor değil.
Geri dönüş maliyeti: düşük

## 2026-09-01 — npm scope `@ktlsr`, CLI adı `@ktlsr/assay`
Bağlam: Paketler `@assay/*` adıyla duruyordu ama o scope npm'de bize ait
değil. Yayın için gerçek bir ad uzayı gerekiyordu.
Seçenekler: `@assay` scope'unu almaya çalışmak · scope'suz `assay` · `@ktlsr`
kullanıcı scope'u
Karar: `@ktlsr`. CLI `@ktlsr/assay` (bin: `assay`), kütüphaneler
`@ktlsr/assay-core`, `-runner`, `-adapters`.
Gerekçe: Kullanıcı scope'u zaten sahip olunan ad uzayı; ek bir org kurulumu
ve ad çekişmesi yok. Scope'suz `assay` npm'de alınmış (v1.0.0, ilgisiz bir
paket) ve alınmamış olsa bile kullanıcının kararı onu şimdi kapmamaktı:
scope'suz bir ad ileride devretmesi zor bir bakım yükü. `bin` adı `assay`
kaldığı için kullanıcı deneyimi değişmiyor — kurulum adı ile komut adı ayrı
şeyler.
Geri dönüş maliyeti: yüksek (yayımlandıktan sonra ad değişimi yeni paket demek)

## 2026-09-01 — `db` ve `ui` yayımlanmıyor
Bağlam: Altı paketin hangilerinin npm'e gideceği belirsizdi.
Seçenekler: hepsini yayımlamak · yalnızca SDK dörtlüsünü yayımlamak
Karar: `core`, `runner`, `adapters`, `cli` yayımlanır; `db` ve `ui`
`private: true`.
Gerekçe: Ürün tanımındaki ayrım bu: SDK ölçer ve dağıtılır, hosted katman
hatırlar ve dağıtılmaz. `db` bir Prisma şeması ve migration seti — dışarıdan
kurulabilir bir kütüphane değil. `ui` kaynaktan tüketiliyor (`main` →
`src/index.ts`, web tarafında `transpilePackages`) ve tek tüketicisi
`apps/web`. İkisini yayımlamak, bakmak zorunda kalacağımız bir genel API
yüzeyi yaratırdı — kimsenin istemediği bir yüzey.
Geri dönüş maliyeti: düşük (sonradan yayımlamak kolay, geri çekmek zor)

## 2026-09-01 — Dört paket `fixed` grubunda, tek sürüm numarası
Bağlam: Changesets paketleri bağımsız da sürümleyebilir.
Seçenekler: bağımsız sürümler · `linked` · `fixed`
Karar: `fixed` — dördü her yayında aynı sürümü alır.
Gerekçe: Dördü tek bir SDK'nın parçaları ve yalnızca birlikte test ediliyorlar.
Bağımsız sürümlerde kullanıcı `@ktlsr/assay@0.2.0` ile hangi
`@ktlsr/assay-core`'un uyumlu olduğunu çözmek zorunda kalırdı; `linked`
yalnızca değişenleri hizalayıp aradaki boşlukları açık bırakıyor. Bedeli:
değişmeyen paketler de sürüm atlıyor — npm'de ucuz bir bedel.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Yayın build'i ayrı tsconfig; map üretilmiyor, `src` gönderilmiyor
Bağlam: Geliştirme build'i `dist`e test dosyaları ve source map yazıyor;
`files: ["dist"]` bunların hepsini tarball'a alıyordu. Ayrıca map'ler `src`'yi
gösteriyor ama `src` tarball'da yok.
Seçenekler: `src`'yi de yayımlayıp map'leri çalışır kılmak · `.npmignore` ile
tek tek dışlamak · yayın için ayrı `tsconfig.build.json`
Karar: Üçüncüsü. `tsconfig.build.json` testleri hariç tutuyor,
`sourceMap`/`declarationMap` kapalı, `tsBuildInfoFile` dist dışında.
`build:publish` önce dist'i siliyor.
Gerekçe: `src`'yi yayımlamak tarball'ı iki katına çıkarır ve kullanıcıya işine
yaramayan bir kopya gönderir; asıl istenen şey `.d.ts` ve o zaten var.
`.npmignore` bir dışlama listesi — yeni bir dosya türü eklendiğinde
güncellenmesi unutulur, `files` beyaz listesi ise unutulduğunda eksik yayımlar
(güvenli taraf). Ölçüldü: geliştirme build'iyle `@ktlsr/assay-core` 84 dosya /
65.7 KB, yayın build'iyle 26 dosya / 32.2 KB.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Tarball içeriği testle kanıtlanıyor (`pnpm pack:check`)
Bağlam: "Testler dist'ten çıkarıldı" bir iddiaydı; `files` alanına bakarak
doğrulanamıyordu çünkü sorun `files`'ta değil `dist`in içeriğindeydi.
Seçenekler: kod incelemesine güvenmek · `npm pack --dry-run` çıktısını elle
okumak · paketleyip içeriği programatik denetlemek
Karar: `tools/pack-check.mjs` — dört paketi gerçekten paketler, tarball'ı
zlib ile açıp yolları listeler, yasaklı desen (test, map, `src/`, `.env`,
`.npmrc`, anahtar, `node_modules`) bulursa exit 1; LICENSE/NOTICE/README
yoksa yine exit 1.
Gerekçe: Bu projenin kendi iddiası "ölçmediğini geçti sayma". Yayın
hazırlığında aynı standart geçerli: denetimin gerçekten yakaladığı,
geliştirme build'i paketlenerek kanıtlandı (9 test dosyası + 40 map
yakalandı, exit 1). `tar` komutuna kabuk açmak yerine `node:zlib` ile
başlıkların yürünmesinin sebebi Windows: GNU tar `C:\...` yolunu uzak sunucu
adresi sanıyor ve denetim hiç koşamıyordu.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Yayın yolu `pnpm publish`, npm değil
Bağlam: Paketler birbirine `workspace:*` ile bağlı.
Seçenekler: `npm publish` · `pnpm publish`
Karar: `pnpm publish`. `pnpm release` script'inde sabit, docs/releasing.md'de
gerekçesiyle yazılı.
Gerekçe: `workspace:*` belirtecini gerçek sürüm numarasına çeviren pnpm.
`npm publish` onu olduğu gibi bırakır ve kurulamayan bir tarball yayımlar —
üstelik sessizce, çünkü paketleme başarılı görünür. Hata ancak bir kullanıcı
kurmaya çalıştığında ortaya çıkar ve sürüm geri alınamaz.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Sürüm yükseltme bir PR, doğrudan yayın değil
Bağlam: `release.yml` main'e her push'ta yayımlayabilirdi.
Seçenekler: main'e push = yayın · changesets'in sürüm PR'ı akışı
Karar: İkincisi. Changeset girince "Version Packages" PR'ı açılır; o PR
birleşince yayımlanır.
Gerekçe: npm yayını geri alınamaz. Yayımlanacak sürüm numarasının
birleştirilmeden önce görünür olması, bu geri alınamazlığın tek makul
karşılığı. Ayrıca CHANGELOG'un gözden geçirilecek bir yeri oluyor.
Geri dönüş maliyeti: düşük

## 2026-09-01 — `NPM_TOKEN` yoksa yayın işi koşmaz, sessizce atlanmaz
Bağlam: Secret henüz tanımlı değil ama workflow eklenecekti.
Seçenekler: workflow'u secret gelene kadar eklememek · secret yokken
başarısız olmak · guard işiyle atlamak ve uyarı yazmak
Karar: Üçüncüsü. `guard` işi token'ın varlığını çıktıya çevirir; `release`
işi ona bağlı. Token yoksa `::warning::` yazılır ve docs/blockers.md'ye
yönlendirilir.
Gerekçe: Secrets bağlamı iş seviyesindeki `if` içinde okunamıyor, o yüzden
guard bir iş olmak zorunda. Kırmızı bir CI, sebebi "henüz token yok" olan
bir durumda yanlış sinyal — ekip kırmızıyı görmezden gelmeyi öğrenir. Sessiz
atlama ise daha kötü: yayımlandı sanılır. Uyarı ikisinin arası ve doğru olanı.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Token geçerliliği yayından önce sınanıyor, `guard` yetmiyor
Bağlam: `guard` işi yalnızca `NPM_TOKEN` secret'ının var olup olmadığını
biliyor. npm granular access tokenları yazma izniyle en fazla 90 gün yaşıyor;
süresi dolmuş bir token da "dolu"dur ve guard'dan geçer.
Seçenekler: guard'ı yeterli saymak · publish hatasına bırakmak · pahalı
adımlardan önce `npm whoami` ile sınamak
Karar: Üçüncüsü. `setup-node`'dan hemen sonra `npm whoami`; başarısızsa
`::error::` ve docs/operations.md'ye yönlendirme.
Gerekçe: Kontrol olmasaydı hata `pnpm check` ve `pack:check` koştuktan sonra,
yayının tam ortasında çıkardı. Asıl risk kaybedilen dakikalar değil, **kısmi
yayın**: dört paket sırayla gönderiliyor ve kimlik hatası ortada patlarsa bir
kısmı npm'de kalır. Onarılabilir bir durum (pnpm var olan sürümü atlar) ama
hiç girmemek daha ucuz. Ayrıca hata mesajı sebebi söylüyor: `E401`
görüldüğünde kodda aranmıyor.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Yayın sonrası registry'den doğrulanıyor
Bağlam: changesets'in `published: true` çıktısı aracın kendi beyanı.
Seçenekler: beyana güvenmek · registry'den okumak
Karar: `tools/verify-published.mjs` — `publishedPackages` listesindeki her
sürümü `npm view` ile registry'den okuyor, eksik varsa exit 1.
Gerekçe: Bu projenin adaptörü host'un `subtype: "success"` bildirimine tam da
bu sebeple güvenmiyor ve çapraz kontrol yapıyor; kendi yayın hattımızda daha
gevşek bir standart tutmak tutarsız olurdu. Doğrulayıcının kendisi iki yönde
sınandı: yayımlanmamış bir sürüm için exit 1, gerçekten yayımlanmış iki paket
için exit 0. Windows'ta `npm` bir `.cmd` olduğu için kabuk gerekiyor
(CVE-2024-27980) — pozitif test bunu yakaladı, aksi hâlde araç yalnızca
CI'da çalışırdı ve yerelde hep "bulunamadı" derdi.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Trusted publishing ertelendi, kurulmadı
Bağlam: 90 günlük token yenileme döngüsünün kalıcı çözümü trusted publishing
(OIDC): saklanan secret yok, dolayısıyla yenilenecek bir şey de yok.
Seçenekler: şimdi kurmak · 0.1.0'dan sonra kurmak
Karar: Sonra. Prosedür docs/operations.md'de adım adım yazılı.
Gerekçe: Trusted publishing bir paketin npm ayarlarından yapılandırılıyor,
yani paketin önce var olması gerekiyor. Yayımlanmamış bir paket için
kurulamaz — teknik bir sıra zorunluluğu, tercih değil. Özel depoda çalıştığı
doğrulandı; yalnızca provenance üretilmiyor ve o zaten bu depo için mümkün
değil.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Token dört pakete kapsamlı, scope'un tamamına değil
Bağlam: Granular access token ya bütün bir scope'a ya seçilen paketlere yetki
veriyor.
Seçenekler: `@ktlsr` scope'unun tamamına yazma · dört paketi tek tek seçmek
Karar: Dört paket tek tek. docs/operations.md'de yenileme adımı olarak yazılı.
Gerekçe: Token sızarsa yazılabilecek yer bu dördüyle sınırlı kalır. Scope
yetkisi, `@ktlsr` altına ileride eklenecek ilgisiz her paketi de kapsardı —
üstelik sessizce, çünkü token'ı yeniden üretmek gerekmez. Bedeli: yeni bir
paket eklendiğinde tokenın güncellenmesi gerekiyor. Unutulursa `E403` veriyor
ve o hata operations.md'deki tabloda tanımlı.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Klasik npm tokenları artık yok; belgeler düzeltildi
Bağlam: Yayın hazırlığında `.env.example` ve docs "Classic Token >
Automation" diyordu.
Karar: Belgeler granular access token'a göre düzeltildi.
Gerekçe: npm Kasım 2025'te klasik token üretimini kapattı ve mevcut olanları
iptal etti; Şubat 2026'da hepsi öldü. Bugün tek seçenek granular access token
ve yazma izinlilerin ömrü 90 günle sınırlı. Yanlış menü adı tarif eden bir
prosedür, tam da acele edildiğinde okunacak yerde işe yaramaz.
Kaynak: github.blog changelog, 2025-11-05 ve 2025-12-09.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Kalibrasyon yayın öncesi zorunlu adım
Bağlam: Assay bugüne kadar yalnızca yeşil sonuç üretmişti. Yeşil sonuç iki
durumda aynı görünür: araç çalışıyordur, ya da araç hiçbir şey ölçmüyordur.
Seçenekler: birim testlerine güvenmek · yayından sonra bakmak · kasıtlı
başarısız vakalarla gerçek koşum yapmak
Karar: Üçüncüsü. `examples/calibration*.suite.yaml` ve
`examples/calibration/` altındaki iki fixture skill; sonuç
docs/calibration.md.
Gerekçe: Birim testleri motorun mantığını kanıtlıyor ama uçtan uca zinciri
(host → adaptör → kanıt → assertion → verdict → çıkış kodu) kanıtlamıyor.
Kalibrasyon 36 gerçek koşumla üç durumun üçünü de üretti ve dört çıkış kodunu
doğruladı. Ayrıca bir kusur buldu: ilk `unknown` vakası hedef skill'in
"do not run shell commands" talimatıyla çakışıyordu, yani skill'i değil benim
kurduğum vakayı ölçüyordu — ayrı bir fixture'la düzeltildi.
Geri dönüş maliyeti: düşük

## 2026-09-01 — `regressed` kalibrasyonda üretilemedi, kayıt altına alındı
Bağlam: `compare` üç sonuç üretebiliyor: `within_noise`, `regressed`,
`unknown`. Kalibrasyon ilk ve üçüncüyü gerçek koşumlarla üretti;
`regressed` üretilemedi.
Seçenekler: ~40 ek koşumla (≈$1) zorlamak · suite'i değiştirerek taklit
etmek · eksiği yazıp yayına devam etmek
Karar: Üçüncüsü. docs/calibration.md'de "üretilemeyen verdict" başlığı
altında gerekçesiyle yazıldı.
Gerekçe: `regressed` yalnızca güven aralıkları ayrık olduğunda üretiliyor ve
N=3'te aralıklar %0–56 kadar geniş; %100'den %0'a düşüş bile ayrık çıkmıyor.
Bu tasarımın istediği davranış. Taklit etmek mümkün değil: suite ve skill
pinli, değiştirilince karşılaştırma `unknown`'a düşüyor — sahte regresyon
üretme yolu bilerek kapatılmış. Eksiği gizlemek, tam da bu projenin
yasakladığı şey olurdu; yazmak ve maliyetini söylemek doğrusu.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Yayın `workflow_dispatch` ile, push ile değil
Bağlam: `release.yml` main'e her push'ta koşuyordu ve depoda changeset
kalmadığında `changesets/action` doğrudan publish moduna geçiyor. Yani belge
düzelten bir commit bile npm'e gitmeye çalışıyordu; yayın hazırlığı sırasında
bu iki kez tetiklendi.
Seçenekler: "changeset yoksa yayımla" davranışını sürdürmek · yayını ayrı bir
tetikleyiciye almak
Karar: `push` yalnızca sürüm hazırlığı yapar (`publish` girdisi boş geçilir);
yayın `workflow_dispatch` ve `confirm: yayimla` onay metniyle.
Gerekçe: npm yayını geri alınamaz. Geri alınamaz bir eylemin tetiği, sıradan
bir commit'in yan etkisi olamaz. Onay metni ikinci bir kilit: yanlışlıkla
açılan bir koşum yayımlamıyor. Bedeli bir ek komut; karşılığı, yayının ne
zaman olacağının kesin olması.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Provenance açıldı, elle yayının bedeli kabul edildi
Bağlam: Depo public yapıldı; npm provenance artık mümkün.
Seçenekler: kapalı bırakmak · açmak
Karar: Açık. `id-token: write` + `publishConfig.provenance: true`.
Gerekçe: Provenance, yayımlanan tarball'ın hangi commit'ten hangi iş akışıyla
derlendiğini imzalı olarak kanıtlıyor — ölçüm dürüstlüğü satan bir aracın
kendi dağıtım zincirinde bunu atlaması tutarsız olurdu. Bedeli: provenance
yalnızca CI'da üretilebiliyor, elle yayın `--no-provenance` istiyor ve o
sürüm kaynağını kanıtlamıyor. Bu yüzden elle yayın bir kaçış yolu olarak
belgelendi, tercih edilen yol olarak değil.
Geri dönüş maliyeti: düşük

## 2026-09-01 — Kimlik doğrulama trusted publishing, token hattan çıkarıldı
Bağlam: 0.1.0'ın ilk yayın denemesi `EOTP` ile düştü — npm'in varsayılan paket
ayarı publish için 2FA ya da bypass-2FA yetkili token istiyor ve CI interaktif
istemi cevaplayamıyor. Trusted publishing kurulunca ikinci deneme geçti ve log
"No NPM_TOKEN found, but OIDC is available" dedi.
Seçenekler: bypass-2FA yetkili tokenı hatta bırakmak · token'ı çıkarıp yalnızca
OIDC'ye dayanmak
Karar: `NPM_TOKEN` iş akışından tamamen çıkarıldı. `guard` işinin token
kontrolü ve `npm whoami` adımı kaldırıldı; `id-token: write` kaldı.
Gerekçe: changesets/action token bulduğunda OIDC'yi kullanmıyor, yani token'ı
bırakmak trusted publishing'i sessizce devre dışı bırakırdı — ve bypass-2FA
yetkisi npm tarafından kullanımdan kaldırılıyor (≈Ocak 2027'de yayın yetkisi
gidiyor). Token'sız hatta yenilenecek secret, sızacak sır ve 90 günlük döngü
yok. Bedeli: elle yayın artık mümkün değil, çünkü OIDC kimliği yalnızca
yapılandırılmış iş akışından geliyor. Bu bir kayıp değil — denetlenmemiş bir
kaçış yolunun kapanması.
Geri dönüş maliyeti: düşük (token geri eklenebilir, ama eklenmemeli)

## 2026-09-01 — Yayın doğrulaması changesets'in bayrağına değil, yayın moduna bağlı
Bağlam: 0.1.0 başarıyla yayımlandı ama "yayımlanan sürümler registry'de
görünüyor mu" adımı atlandı. Sebep: adım `steps.changesets.outputs.published`
koşuluna bağlıydı; kendi yayın komutumuzu (`pnpm -r publish`) kullandığımız
için action çıktıyı ayrıştıramıyor ve bayrağı `false` bırakıyor.
Seçenekler: changesets'in kendi publish komutunu kullanmak · bayrağı düzeltmeye
çalışmak · koşulu yayın moduna bağlayıp paket listesini manifestolardan okumak
Karar: Üçüncüsü. Koşul `needs.guard.outputs.publishing == 'true'`;
`verify-published.mjs` `PUBLISHED_PACKAGES` boşsa dört manifestodan okuyor.
Gerekçe: Doğrulamanın varlık sebebi "aracın beyanına güvenme" idi ve tam da
aracın bir beyanına bağlanmıştı. Paketler yayımlandı, doğrulama sessizce
atlandı ve bunu ancak elle bakınca fark ettim — ölçüm aracının kendi hattında
kabul edilemez. Manifestolar yayımlanan sürümün tek doğruluk kaynağı zaten.
Geri dönüş maliyeti: düşük

## 2026-09-02 — İlk yönetici aracı imaja kopyalanıyor, instrumentation'a taşınmadı
Bağlam: `docs/deploy.md` `docker compose exec web node tools/create-user.mjs`
diyordu ama `tools/` üretim imajında yoktu; komut çalışmayacaktı.
Seçenekler: bootstrap'ı `instrumentation.ts` üzerinden sunucu sürecinde
koşturmak · `tools/`u imaja kopyalamak · kayıt ekranı açmak
Karar: İkincisi. `Dockerfile` yalnızca `tools/create-user.mjs`yi kopyalıyor.
Gerekçe: Önce birincisi denendi ve **derlemeyi kırdı**. `middleware.ts` var
olduğu için Next `instrumentation.ts`yi edge çalışma zamanı için de derliyor;
oradan `packages/db` → `@prisma/adapter-pg` → `pg` zinciri `fs`, `path` ve
`stream` istiyor ve edge'de bunlar yok. Dosya içindeki `NEXT_RUNTIME`
kontrolü çalışma zamanında; webpack yine de bundle'a alıyor. Commit geri
alındı (9bd7e18 → revert).
Kopyalama yaklaşımının kendi riski var: araç workspace paketlerini import
ediyor ve bunlar standalone çıktısında yalnızca `apps/web` onları izlediği
için bulunuyor. Bu varsayım sessizce değişebilir — auth bir gün argon2'yi
bırakırsa araç çalışma zamanında kırılır. Bu yüzden Dockerfile derleme
sırasında ikisini de gerçekten import ediyor: çözülemezse derleme durur.
Bu turdaki üç dağıtım hatasının ortak dersi bu — hata çalışma zamanında
değil, derlemede görünmeli.
Geri dönüş maliyeti: düşük

## 2026-09-02 — İlk yönetici tek seferlik API ucundan
Bağlam: `tools/create-user.mjs` üretimde iki kez çalışmadı. Önce `tools/`
imajda yoktu; kopyalanınca da `@ktlsr/assay-db` `/app`ten çözülemedi —
Next'in standalone çıktısı workspace paketlerini üst düzeyde açmıyor. İkisi
de dağıtımda kanıtlandı. Arada `instrumentation.ts` üzerinden bootstrap
denendi ve derlemeyi kırdı: `middleware.ts` var olduğu için o dosya edge
için de derleniyor ve `pg` zinciri `fs`/`path`/`stream` istiyor.
Seçenekler: Postgres'i dışarı açıp yerelden koşmak · kayıt ekranı ·
tek seferlik API ucu
Karar: `POST /api/bootstrap`.
Gerekçe: Rota sunucu çalışma zamanı için derleniyor ve bağımlılıkları oraya
izleniyor — `/api/runs` aynı paketi aynı şekilde kullanıyor ve üretimde
çalıştığı ölçüldü (405 dönüyordu). Yani çözümün işe yarayacağı tahmin değil,
gözlem. Postgres'i dışarı açmak geçici de olsa veritabanını internete
verirdi.
Üç kilit: `ASSAY_BOOTSTRAP_TOKEN` yoksa uç 404 (varlığı sızmıyor), token
eşleşmezse 401, zaten bir ADMIN varsa 409. Değişken açık unutulsa bile
ikinci bir yönetici açılamıyor. Uç ayrıca yayın modunda middleware ile
kapatılıyor.
Geri dönüş maliyeti: düşük

## 2026-09-02 — Yayın modunda giriş kapatılmıyor, kimlik doğrulama arkasında kalıyor
Bağlam: İlk kurulumda `/signin`, `/admin` ve `/settings` yayın modunda 404
dönüyordu. Sonucu şu oldu: siteyi yönetmek için yayın modunu kapat, dağıt,
işini yap, aç, tekrar dağıt — her yönetim işi iki fazladan dağıtım.
Seçenekler: kapalı tutmak · kimlik doğrulama arkasında açık bırakmak ·
tahmin edilmesi zor gizli bir yol
Karar: İkincisi. Yayın modunda yalnızca `/dev`, `/compare` ve
`/api/bootstrap` kapalı.
Gerekçe: İlk talep zaten "kapat **veya** kimlik doğrulama arkasına al"
diyordu. `/admin` ve `/settings` `requireAdmin`/`requireUser` ile korunuyor
(apps/web/lib/guard.ts); yetkisiz ziyaretçi yalnızca giriş ekranını görür.
Kapalı olan üçü ise gerçekten ziyaretçiye yarım uygulama gösteriyor:
`/dev/components` bir bileşen kataloğu, `/compare` kimlik doğrulama bile
istemeyen ve koşum kimliği olmadan boş bir form, `/api/bootstrap` işini
bitirmiş bir kurulum ucu. Gizli yol seçeneği karanlıkta güvenlik olurdu.
Geri dönüş maliyeti: düşük

## 2026-09-02 — Ekran görüntüsü aracı (playwright) eklendi
Bağlam: docs/workflow.md arayüzü etkileyen her adımdan sonra iki temada
ekran görüntüsü istiyor. Depoda tarayıcı otomasyonu yoktu ve görsel
doğrulama bugüne kadar yapısal kontrole (CSS'te iki tema seçicisi var mı,
viewport meta yerinde mi) indirgeniyordu.
Seçenekler: yapısal kontrolle yetinmek · playwright eklemek
Karar: `playwright` devDependency + `tools/shoot.mjs`.
Gerekçe: Giriş ekranı tasarımı istendiğinde yapısal kontrol yetmez oldu —
"düğmeler birbirinin aynı görünüyor" gibi bir kusur ancak bakınca görülür.
Araç her yol için üç kare alıyor (açık, koyu, 375px mobil) ve yatay taşmayı
ölçüp raporluyor; taşma sessizce kaçan bir hata türü.
Tema `data-theme` ile zorlanıyor, sistem tercihine bırakılmıyor: aksi hâlde
sonuç koşumu çalıştıran makineye bağlı olurdu.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Kırılmayan vaka seti için ikinci, sınırda set koşuldu

Bağlam: Üç skill ölçüldü; `doc-coauthoring` ve `mcp-builder` setleri 90/90
geçti. Sözleşme "hiçbir negatif kırılmadıysa daha sınırda bir set öner"
diyor.
Seçenekler: yalnızca öneriyi yazmak · ikinci seti yazıp koşmak
Karar: İkincisi. `*-borderline.suite.yaml` setleri yazıldı ve koşuldu.
Gerekçe: Öneri bir iddiadır, koşum bir ölçümdür — ve bu projenin tamamı bu
ayrımın üstünde duruyor. Karşılığı da alındı: `doc-coauthoring` aynı skill,
aynı model ve aynı pinlerle %100 ve %51 precision verdi. Farkın tamamı vaka
setinden geliyordu. Bu, tek başına en değerli bulgu oldu ve yalnızca
"önerseydim" görünmezdi. `mcp-builder` ikinci sette de kırılmadı; bu da
ölçülmüş bir sonuç, tahmin değil.
Bedeli: iki ek koşum, ~$16 ve ~3 saat.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Yakın komşu tek eksende ayrılmalı

Bağlam: `doc-coauthoring`'in ilk seti kusursuz göründü. İzler sebebi
gösterdi: dört negatifin dördünde de ajanın önünde dönüştürülecek bir kaynak
(kod, düzyazı, commit listesi) vardı; üç pozitifte içerik yalnızca
kullanıcının kafasındaydı. Set, ölçmek istediğim özelliği değil bu ikinci
değişkeni ölçüyordu.
Seçenekler: sonucu olduğu gibi raporlamak · değişkeni sabitleyip yeniden
ölçmek ve yöntemi kayda geçirmek
Karar: İkincisi. Değişmez #5'e pratikte bir ek şart: negatif, pozitiften
**yalnızca ölçülmek istenen özellikte** ayrılmalı; başka hiçbir şeyde değil.
Gerekçe: Negatifin var olması yetmiyor. Yanlış eksende uzak duran bir negatif
suite'i geçirir ve skill'i ölçülmüş gösterir — değişmez #5'in tam olarak
engellemek istediği yanlış güvenlik hissi, bir adım ötede yeniden üretiliyor.
İkinci set bunu kanıtladı: eksen sabitlenince precision %100'den %51'e düştü.
Sonuç: 90/90 geçen bir tetiklenme suite'i bir başarı değil, bir uyarıdır.
Araç bugün bunu söylemiyor; docs/measurements.md'ye eksik olarak yazıldı.
Geri dönüş maliyeti: düşük

## 2026-09-03 — `examples.test.ts` alt dizinleri de kapsıyor

Bağlam: Test yalnızca `examples/*.suite.yaml` glob'unu kullanıyordu; alt
dizinlerdeki suite'ler (`examples/dogfood/`, yeni `examples/measurements/`)
şema değişikliğine karşı korumasızdı.
Seçenekler: olduğu gibi bırakmak · glob'u `examples/**/*.suite.yaml` yapmak
Karar: İkincisi. Kapsam 6 dosyadan 18'e çıktı.
Gerekçe: Testin varlık sebebi "şema değişip de örnekler güncellenmezse burası
kırmızıya döner". Örneklerin üçte ikisi kapsam dışıydı, yani test amacının
üçte birini yapıyordu. Tek karakterlik düzeltme.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Ölçüm fixture'ları lint kapsamı dışında

Bağlam: `examples/measurements/fixtures/` altındaki dosyalar kasten bozuk
(tanımsız `validator`, yanlış toplam hesabı) ve tarayıcıda koşuyor; ESLint
`no-undef` ile 9 hata verdi.
Seçenekler: fixture'lara `eslint-disable` serpiştirmek · tarayıcı globals'ı
tanımlamak · dizini ignore listesine almak
Karar: `examples/**/fixtures/**` ignore.
Gerekçe: `no-undef` hatası burada bir kusur değil, **ölçülen şeyin kendisi**:
`validator is not defined` tam da ajanın tarayıcıda bulması beklenen hata.
Onu susturmak fixture'ı bozar. Globals tanımlamak da yanlış olurdu —
bu dosyalar bizim kaynak kodumuz değil, ölçüm girdisi. `tools/fixtures/**`
zaten aynı gerekçeyle muaftı.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Ayrım gücü notu `core`'da, ve verdict'i etkilemiyor

Bağlam: Ölçüm raporu (docs/measurements.md) aracın 90/90 geçen bir suite ile
zayıf bir suite'i ayırt etmediğini buldu. Uyarının nereye konacağı ve ne kadar
sert olacağı belirsizdi.
Seçenekler: (a) uyarıyı yalnızca terminal renderer'ında hesaplamak ·
(b) `core`'da `RunSummary`'ye türetilmiş alan · (c) uyarıyı verdict'e veya
çıkış koduna bağlamak
Karar: (b) — `RunSummary.discrimination { cases, attempts, falsePositives,
untested }`. Not terminal ve HTML raporunda gösteriliyor; `verdict` ve çıkış
kodu değişmiyor.
Gerekçe: (a) iki tüketici (terminal, HTML) ve ileride hosted taraf için aynı
hesabı üç yere kopyalamak demekti; üçü er geç ayrışırdı. (c) daha cazipti ama
yanlış: "negatiflerin hepsi geçti" bir ölçüm başarısızlığı değil, ölçümün
kapsamı hakkında bir bilgi. CI'ı bu yüzden kırmak, kullanıcıyı negatifleri
zayıflatmaya değil suite'i susturmaya iter. Ayrıca `unknown` ile karışırdı:
`unknown` "ölçemedik" demek, bu ise "ölçtük ama neyi ölçtüğümüz sınırlı".
Kanıt: `webapp-testing` taban koşumu hâlâ `FAIL` (bir pozitif kaçtı) ve notu
da taşıyor — ikisi bağımsız.
Ölçülemeyen negatif attempt'ler paydaya girmiyor: okunamamış bir negatif
ayrım gücü hakkında da bir şey söylemez (değişmez #1 ile aynı mantık).
Kapsam: `apps/web` aynı alanı okuyabiliyor ama notu göstermiyor; yayımlanmayan
bir paket olduğu için 0.1.1'in dışında bırakıldı.
Geri dönüş maliyeti: düşük (türetilmiş alan, kayıt şeması değişmedi)

## 2026-09-03 — DÜZELTME: 0.1.0 OIDC ile değil, token ile yayımlanmıştı

Bağlam: 2026-09-01 tarihli "Kimlik doğrulama trusted publishing, token hattan
çıkarıldı" kaydı, 0.1.0'ın trusted publishing (OIDC) ile yayımlandığını
söylüyor ve dayanağı olarak koşum kütüğündeki şu satırı gösteriyordu:
`No NPM_TOKEN found, but OIDC is available - using npm trusted publishing`.
**Bu okuma yanlıştı.** O satır changesets/action'ın kendi `NPM_TOKEN`
değişkenini bulamadığını söylüyor; gerçek kimlik bilgisi `setup-node`'un
`.npmrc`'ye yazdığı `NODE_AUTH_TOKEN` ile geliyordu ve o sırada iş akışında
hâlâ tanımlıydı.

Kanıt (üçü birden):
1. `npm view @ktlsr/assay-core@0.1.0 _npmVersion` → **10.9.8**. npm'in OIDC
   token değişimi 11.5.1'de geldi; 10.9.8 trusted publishing yapamaz.
2. Başarılı koşumun commit'indeki (`efc4f16`) `release.yml` iki yerde
   `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` taşıyor.
3. `c1adebd` bu iki satırı ve `npm whoami` ön kontrolünü kaldırdı. Ondan
   sonraki **ilk** yayın denemesi olan 0.1.1, iki bağımsız koşumda da
   `E404 PUT .../@ktlsr%2fassay-core` verdi.

Yani hat, c1adebd'den beri hiçbir kimlik bilgisi taşımıyordu. Kimlik
bilgisiz bir PUT'a npm, paketin varlığını sızdırmamak için 401 değil **404**
döner; hata mesajı bu yüzden "paket yok" gibi okunuyor ve yanlış yere
baktırıyor. Provenance'ın imzalanmış olması da yanıltıcı: o Sigstore'a
GitHub OIDC'si ile yapılıyor ve npm kimlik doğrulamasından bağımsız.

Seçenekler: (a) `NODE_AUTH_TOKEN`'ı geri koymak · (b) iş akışında npm'i
>= 11.5.1'e yükseltip trusted publishing'i gerçekten çalıştırmak
Karar: (b). Yayın işine `npm install -g npm@latest` ve sürüm kapısı eklendi;
npm 11.5.1'den eskiyse yayın **publish'e hiç gitmeden** durur.
Gerekçe: (a) token'sız hat kararını geri alır ve 90 günlük yenileme
döngüsünü geri getirir — o karar hâlâ doğru, yalnızca ön koşulu eksikti.
Asıl ders ise ayrı: `npm whoami` ön kontrolü kaldırılırken yerine hiçbir şey
konmamıştı, bu yüzden kimlik bilgisi olmadan yayın denenip geri alınamaz bir
adımın ortasında patlayabiliyordu. Sürüm kapısı o boşluğu dolduruyor.
Şans eseri hasar yok: `core` bağımlılık sırasında ilk yayımlanan paket
olduğu için dördü de gitmedi; kısmi yayın olmadı.
Geri dönüş maliyeti: düşük

## 2026-09-03 — 0.1.1 trusted publishing ile yayımlandı, hat token'sız kaldı

Bağlam: Dört paket için npm'de trusted publisher kaydı yapıldıktan sonra
yayın tekrar tetiklendi (koşum `33711487808`).
Seçenekler: `NPM_TOKEN`'ı geri koymak · yalnızca OIDC ile devam etmek
Karar: OIDC. Hatta hiçbir npm kimlik bilgisi yok.
Gerekçe: Üç bağımsız kanıt OIDC'nin gerçekten kullanıldığını gösteriyor —
kütükte "No NPM_TOKEN found, but OIDC is available - using npm trusted
publishing", registry'de `_npmVersion: 12.0.2` (0.1.0'ın 10.9.8'i OIDC
yapamıyordu) ve dört pakette de provenance. Aracın kendi beyanına
güvenmiyoruz: `verify-published.mjs` dördünü registry'den okudu.
Yan doğrulamalar: `npx @ktlsr/assay@0.1.1 init <dizin>` tek satır mesajla
exit 2 veriyor; `report` çıktısı "no negative case broke" notunu gerçek bir
kayıtta gösteriyor.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Tamamlama setleri `suites/` altında, ayrı dosyalar

Bağlam: Tamamlama vakaları istendi; mevcut tetiklenme setlerine dokunulmaması
şart koşuldu. Depodaki konvansiyon `examples/measurements/`, istenen yol
`suites/<skill>-completion.suite.yaml`.
Seçenekler: konvansiyona uyup `examples/measurements/` altına koymak ·
istenen yolu kullanmak
Karar: İstenen yol. Ayrıca `tools/examples.test.ts` glob'u
`suites/**/*.suite.yaml` kapsayacak şekilde genişletildi (18 → 23 dosya).
Gerekçe: Yol açık bir talimattı. Ama testin glob'u genişletilmeseydi yeni
setler şema koruması dışında kalırdı — 2026-09-03'te alt dizinler için
düzeltilen kusurun aynısı, bir dizin ötede. Tek satırlık ek.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Tamamlama setine de negatif kondu

Bağlam: İstenen tasarım "her vakada `expect.triggered: true`" idi. Değişmez #5
negatifsiz her suite'i **reddediyor** (doğrulayıcı `error` üretiyor), yani
yalnızca pozitif tamamlama vakalarından oluşan bir set hiç koşamazdı.
Seçenekler: doğrulayıcıyı "tamamlama seti" için gevşetmek · her sete bir
yakın-komşu negatifi eklemek
Karar: İkincisi. Her sette bir `trigger.negative.near_neighbor.*` vakası var
ve dosyada tamamlama vakası olmadığı yorumla yazılı.
Gerekçe: Değişmez #5 "uygulamadan önce dur ve bildir" listesinde; ölçüm
aracının kendi kuralını kendi rahatlığı için gevşetmesi tam olarak bu
listenin engellediği şey. Negatifin bedeli set başına 10 attempt; karşılığı,
setin "her istekte tetiklenen skill" durumunu hâlâ görebilmesi.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Tamamlama isteminin açılışı tetiklenme setinden kopyalanır

Bağlam: İlk taslak tamamlama istemleri sıfırdan yazılmıştı ve
`doc-coauthoring` altı denemenin altısında da tetiklenmedi (0/6);
`webapp-testing` de 0/6. Ölçülen şey skill değil, istemin tonuydu.
Seçenekler: sonucu olduğu gibi raporlamak · istemleri tetiklenme setindeki
bilinen-tetikleyen cümlelerle açacak biçimde yeniden yazmak
Karar: İkincisi. Her tamamlama istemi, tetiklenme setinde 10/10 tetikleyen
açılışla başlıyor; üzerine YALNIZCA teslim edilecek dosya ekleniyor.
Ayrıca `webapp-testing` istemlerindeki "playwright kurulu değil,
çalıştırmaya kalkma" kısıtı kaldırıldı ve ölçüm makinesine python
playwright + chromium kuruldu.
Gerekçe: 2026-09-03'teki "yakın komşu tek eksende ayrılmalı" kuralının
pozitif taraftaki karşılığı. Bir tamamlama vakası, tetikleyen bir istemden
yalnızca artefakt talebiyle ayrılmalı; başka hiçbir şeyle değil. Aksi hâlde
"tetiklenmedi" sonucu skill hakkında değil, istem hakkında bir ifade olur.
"Çalıştırma" kısıtı da aynı hatanın bir başka biçimiydi: tarayıcı sürme
aracının varlık sebebini istemden siliyordu.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Kontrol vakası suite'in içinde, dışında değil

Bağlam: "Dosya istemek `doc-coauthoring`'in tetiklenmesini düşürüyor"
iddiasının kanıtı, ayrı bir geçici koşumdaydı (scratchpad).
Seçenekler: ayrı koşumu raporda anlatmak · kontrolü suite'e vaka olarak
koymak
Karar: `control.design_doc_no_artifact` — `complete.design_doc_with_outline`
ile kelimesi kelimesine aynı istem, yalnızca dosya isteyen son paragraf yok.
Gerekçe: Ayrı koşumdaki kontrol farklı pinler ve farklı bir kayıt demek;
"aynı koşulda" iddiasını okuyucunun bana güvenerek kabul etmesi gerekirdi.
Aynı suite'te yan yana duran iki vaka, aynı kayıtta, aynı dört pinle
karşılaştırılabilir. 2026-09-03'teki "öneri bir iddiadır, koşum bir
ölçümdür" kararının aynısı.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Sandbox izin reddi 0.2.0'da sınıflandırılacak, mod değişmeyecek

Bağlam: `--permission-mode acceptEdits` `Write`'a izin verip kabuk
çalıştırmayı onaya gönderiyor; etkileşimsiz koşumda onay yok. Tamamlama
ölçümünde bir vakanın 10 denemesinin 10'unda en az bir kabuk çağrısı
reddedildi ve 4'ü `no_swallowed_errors`'ı tetikledi. Assay reddi sıradan bir
araç hatasından ayırmıyor.
Seçenekler: (A) olduğu gibi bırakmak · (B) varsayılanı `bypassPermissions`
yapmak · (C) reddi birinci sınıf sinyal yapmak · (D) vaka seti başına komut
allowlist'i · (E) konteyner sandbox
Karar: C ve D, 0.2.0'da; E Faz 3'te kalıyor. İzin modu değişmiyor.
Gerekçe: (B) sandbox'ın gözlediği her sınırı kaldırırdı ve H4 zaten bunu
kasıtlı olarak kapatmıştı. (E) doğru uzun vadeli cevap ama bugünkü sorunu
çözmüyor: konteynerin içinde de bir izin modeli seçmek gerekiyor. (C)
değişmez #1'in doğrudan gereği — engellediğimiz bir şeyin olmamasını skill'in
kusuru diye raporlamak, ölçemediğini "geçti" saymanın aynası. (D) izin
genişlemesini vaka setine yazıyor, yani `suiteHash`'e giriyor ve pinlenmiş bir
karar oluyor; bugünkü sessiz genel reddin tersi.
Kapanmadan önceki durum raporda açıkça yazılı: bu bir sandbox sınırı, skill
kusuru değil.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Metodoloji sayfasının verisi derleme öncesi üretilip commit'leniyor

Bağlam: `/methodology` gerçek koşum kayıtlarından tablo göstermeli (sözleşme
3) ama `apps/web` runner'a bağlanamıyor (docs/stack.md) ve koşum store'ları
`.gitignore` kapsamında.
Seçenekler: koşumları veritabanına yükleyip `listRuns` ile okumak · sayfayı
elle yazılmış sayılarla doldurmak (sözleşme ihlali) · kayıtlardan JSON üretip
commit'lemek
Karar: `tools/methodology-data.mjs` → `apps/web/app/methodology/measurements.json`.
Gerekçe: Veritabanı yolu, sayfayı bir dağıtımın veri durumuna bağlardı —
yayın sunucusunda o koşumlar yüklü değilse sayfa boşalırdı, oysa yazının
kendisi o sayıların üstüne kurulu. Üretici betik commit'li ve komut sayfanın
sonunda yazılı, yani sayı elle yazılmış değil, türetilmiş: `docs/measurements.md`
tablolarıyla aynı disiplin. Kayıtların kimliği (run id, tarih, pinler) sayfada
gösteriliyor ki iddia denetlenebilsin.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Ev dizini yolları da maskeleniyor

Bağlam: /methodology sayfasındaki ham iz `C:\Users\KESER\...` basıyordu.
Aynı iz HTML raporunda ve yüklenen koşum kaydında da var; bir skill yazarı
kendi raporunu paylaştığında makine kullanıcı adını da paylaşıyor.
Seçenekler: yalnızca sayfada gizlemek · yolu tamamen silmek · kullanıcı adını
maskeleyip yolun biçimini korumak
Karar: Üçüncüsü, ve `packages/core`'daki mevcut sır maskelemesinin içinde.
`C:\Users\ada\...` → `C:\Users\<user>\...`; macOS ve Linux ev dizinleri de
kapsanıyor, `runner`/`root` gibi genel hesap adlarına dokunulmuyor.
Gerekçe: Sayfada gizlemek sızıntının bir yüzünü kapatıp diğer ikisini açık
bırakırdı; asıl yüzey kayıt. Yolu tamamen silmek iz sinyalini bozar — hangi
dosyanın açıldığı ölçümün bir parçası; silinen tek şey kimlik olmalı.
`redactDeep` zaten runner'da iz ve env üzerine uygulanıyordu, yani tek bir
desen listesi üç tüketiciyi birden kapsıyor.
Not: sayfanın verisi maskeleme eklenmeden ÖNCE yazılmış kayıtlardan
üretiliyor, bu yüzden `tools/methodology-data.mjs` de maskeleme uyguluyor ve
üretilen JSON'da maskelenmemiş bir yol kalırsa exit 1 veriyor.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Ölçülemeyen pin "tuttu" sayılmaz

Bağlam: `comparePins` saf eşitlik yapıyordu. Claude Code sistem promptu
hash'ini vermiyor ve alan iki koşumda da `not-provided-by-host` taşıyor —
yani ölçülmemiş bir koşul "tuttu" sayılıyor ve karşılaştırmaya sahip
olmadığı bir garanti veriliyordu. Değişmez #2 "pinlerden biri **eksik** veya
farklıysa karşılaştırma yapılmaz" diyor; kod yalnızca "farklı"yı uyguluyordu.
Seçenekler: olduğu gibi bırakmak · her eksik pini kesin engel yapmak
(Claude Code'da compare tamamen ölür) · üçüncü durum + denetçi
Karar: Üçüncüsü. `PinComparison` artık `unavailable` da döndürüyor; eksik
pin karşılaştırmayı durduruyor. İstisna: `Pins.environmentHash` iki koşumda
da dolu ve eşitse pin 3 kapsanmış sayılıyor ve karşılaştırma açılıyor.
Adaptör bu hash'i zaten hesaplıyordu (2026-08-31 kararı) ama kayda hiç
yazılmıyordu; runner artık yazıyor.
Gerekçe: İkinci seçenek doğru ama tek başına aracın çalışan bir özelliğini
öldürürdü; eksik olan ön koşuldu, kural değil. Ortam hash'i pin 3'ün
denetçisi olarak tam da `skillHash`/`suiteHash` çiftinin işini yapıyor:
beyan edilemeyen bir koşulu içerikten yakalıyor. Attempt'ler farklı hash
bildirirse ortam koşum ortasında kaymış demektir; o durumda hiçbir değer
yazılmıyor ve pin ölçülemedi kalıyor.
Bedeli: ortam hash'i taşımayan eski kayıtlar artık karşılaştırılamıyor ve
`unknown` üretiyor. Bu doğru cevap — o koşumlarda koşulların aynı olduğu
gerçekten bilinmiyor.
Geri dönüş maliyeti: orta (kayıt şemasına alan eklendi, opsiyonel)

## 2026-09-03 — Beyaz zemin, canlı ölçüm alanı ve iki sütunlu bölüm ızgarası

Bağlam: Üç sayfanın (tanıtım, giriş, metodoloji) "premium seviyede, animasyonlu
ve hareketli arka planlı, beyaz zeminli" yeniden tasarımı istendi. DESIGN.md
zemini soğuk gri (#f1f3f3) yapıyor, gradienti ve bölüm animasyonlarını
yasaklıyor. Ayrıca "bazı metinler sarılıyor ve yanlarında boşluk bırakıyor"
kusuru bildirildi.
Seçenekler: dünyayı değiştirmek (konsept turnuvası) · dünyayı devralıp
genişletmek
Karar: İkincisi. Sertifika konsepti duruyor; üç kural değişti.
1. Zemin saf beyaz, yükseltilmiş yüzey bir ton koyu — ilişki tersine döndü.
2. Hareketli zemin var ama ürünün kendi işaretlerinden: milimetrik kâğıt
   ızgarası ve yavaşça açılıp kapanan güven aralıkları. Gradient bulutu yok.
3. Bölümler geniş ekranda iki sütun: işaretçi solda (yapışkan), gövde sağda.
Gerekçe: Kullanıcı sertifika kimliğini reddetmedi, bitişini istedi; dünyayı
değiştirmek ürün gerçeğini atmak olurdu (impeccable/new-work: "Established
world: inherit it"). Hareketli zemin ölçümden yapılınca marka rengi eklemeden
"premium" oluyor ve renk hâlâ yalnızca verdict'te. İki sütun ızgarası
bildirilen kusurun kök sebebini kapatıyor: çift daralma (sütun 60rem,
paragraf 66ch) her paragrafın sağında ölü alan bırakıyordu; artık o alan
bölümün başlığı.
Sınır: ızgara yalnızca `:has(> .section-title)` olan düzyazı bölümlerine
uygulanıyor. Referans bölümlerinde gövde üç sütunlu bir bileşen ızgarası ve
onu dar sütuna sokmak öksüz bir üçüncü kart bırakıyordu — ekran görüntüsü
yakaladı.
Geri dönüş maliyeti: düşük (token ve CSS)

## 2026-09-03 — Tetiklenme kontrolü kayıtta kendi alanında

Bağlam: Gerçek bir koşum kaydında sayı ile liste uyuşmuyordu. Tetiklenme
vakalarında `assertions: []` boştu ama `reason` "all 1 assertion(s) passed"
diyordu; tamamlama vakasında dört assertion listeleniyor, `reason` "all 5"
diyordu. Sebep: `runAttempt` tetiklenme kontrolünü `combineVerdicts`'e
veriyor ama kayda yalnızca assertion'ları yazıyordu; `combineVerdicts` ise
başarı cümlesinde saydığı her şeye "assertion" diyordu.
Seçenekler: (a) tetiklenme kontrolünü `assertions` listesine sentetik bir üye
olarak eklemek · (b) sayımdan çıkarmak · (c) kayda kendi alanı olarak eklemek
ve sayılan şeyin adını düzeltmek
Karar: (c). `Attempt.triggerCheck?: VerdictDetail` eklendi; `combineVerdicts`
ikinci bir `noun` parametresi aldı ve runner ona `'check'` geçiyor. Kayıttaki
sayı artık `assertions.length + (triggerCheck ? 1 : 0)`'a eşit.
Gerekçe: (a) `assertions` listesini kirletirdi — o liste vaka setinde BEYAN
EDİLEN assertion'ların sonucu ve her üyesi `Assertion` birleşiminden bir tip
taşıyor. Sentetik bir üye, `assertion.type` üzerinden dallanan her tüketiciyi
kırar ve kayıt artık suite'i yansıtmazdı. (b) gerçekten koşan bir kontrolü
görünmez yapardı ve yalnızca tetiklenme ölçen bir vakada "all 0" ya da
"nothing was asserted" derdi — oysa bir şey ölçülmüştü.
Kayıt zaten `trigger` alanında ham gözlemi taşıyordu; eksik olan, o gözlemin
beklentiyle karşılaştırılmasıydı. İkisi ayrı: biri ne olduğunu, diğeri
beklenenin olup olmadığını söylüyor. Ekranda da ayrı gösteriliyor.
Testle sabitlendi: geçen her attempt'te `reason`'daki sayı listelenen kontrol
sayısına eşit. Kaydı ileride okuyup rapor üretecek biri buna güvenebilmeli.
Geri dönüş maliyeti: düşük (kayda opsiyonel alan; eski kayıtlar okunmaya
devam ediyor, `storeVersion` değişmedi)

## 2026-09-03 — Terminal her iki temada da kendi koyu zemininde

Bağlam: Hero'daki terminal bloğu terminale benzemiyordu: sayfanın zeminini
kullanıyordu, arkadaki milimetrik ızgara içinden geçiyordu ve blok boşta
duruyordu. Sebep bir detay değil, benim daha önce verdiğim yanlış bir karardı:
bitiş incelemesindeki "kart yok" kuralını (DESIGN.md) `.term`e de uygulayıp
dolgusunu kaldırmıştım.
Seçenekler: sayfa zemininin bir tonunu kullanmak · yalnızca koyu temada koyu
olmak · her iki temada da kendi koyu zeminine oturmak
Karar: Üçüncüsü. Terminal her iki temada da koyu; açık temada beyaz sayfanın
tek koyu nesnesi, koyu temada sayfadan bir tık daha derin.
Gerekçe: "Kart yok" kuralı VERİ blokları için — veri kutuda değil çizgide
durur. Terminal bir veri bloğu değil, farklı bir malzeme: sayfanın malzemesi
kâğıt, terminal bir ekran. Kâğıdın üstünde bir ekran göstermek sertifika
konseptiyle çelişmiyor, onu tamamlıyor (bir rapora yapıştırılmış konsol
çıktısı). Terminal her yerde koyudur; bu bir tema tutarsızlığı değil.
Palet BÜYÜMEDİ: `--term-*` tokenlarının değerleri koyu temanın kendi
paletinden birebir alındı, ölçüm renkleri dahil. Yeni renk üretilmedi, yazı
tipi mono kaldı, pencere süsü (mac noktaları, başlık çubuğu) eklenmedi.
Ayrım komut bandıyla yapılıyor: yazılan satır bir tık açık zemin ve tam
kontrast mürekkep, çıktı daha sessiz — gerçek bir terminalde girdi ile
program çıktısı aynı şey değil.
Geri dönüş maliyeti: düşük (token + CSS)

## 2026-09-03 — Yapışkan başlık ve buzlu cam; camın altında mürekkep güçlenir

Bağlam: Başlık yapışkan olsun ve "buzlu/premium" bir zemin taşısın istendi.
Craft floor "dekor olarak cam" yasaklıyor.
Karar: Cam uygulandı ama dekor olarak değil: yapışkan bir başlığın altından
içerik akıyor ve başlık hem okunabilir kalmalı hem altındakini gizlememeli.
`backdrop-filter` bu belirli soruna verilen belirli cevap. Gradient ve gölge
yok; derinlik yine hairline ile.
Ölçüm, karardan daha önemli çıktı: ilk deneme `surface %72` idi ve koyu
terminal başlığın altından geçtiğinde cam #b8b8b8'e düşüyordu. `--text-faint`
orada 2.4:1 veriyor — 4.5 eşiğinin çok altında. Üstelik o token düz beyazda
bile 4.86:1 ile sınırda; değişken zeminde sınırda bir değer, sınırın altına
düşen bir değerdir.
İki değişiklik birlikte: opaklık %86'ya (koyu temada %88) çıkarıldı ve
başlıktaki bağlantıların mürekkebi `--text-faint`ten `--text-muted`e alındı.
Sabit zeminli bir başlıkta faint yeterliydi; camın zemini içerikle değişiyor.
`saturate(0.8)`: kaydırırken bir verdict rengi camın altından geçtiğinde
başlığı boyamıyor — kroma ölçüme ait, başlığa değil.
Yedekler: `backdrop-filter` desteklenmiyorsa ve
`prefers-reduced-transparency: reduce` iken zemin opak. Okunabilirlik efektin
önünde.
Geri dönüş maliyeti: düşük

## 2026-09-03 — Kanıtın yokluğu kanıt sayılamaz (0.1.3'e alındı)

Bağlam: Token iptalinden sonra aynı koşum üç farklı verdict üretti:
tetiklenme `unknown`, artefakt assertion'ları `fail`, `side_effect` `pass`.
Ölçüm hiç yapılmamıştı.
Sebep: tetiklenme katmanı `sessionProblem()` ile oturumun durumuna bakıyor,
assertion katmanı bakmıyor. Oturum koşmadığında çalışma dizini boş kalıyor,
`capture()` boş bir dizi dönüyor ve `evidence.files` "var ama boş" oluyor.
Sevk katmanının koruması yalnızca `undefined` denetliyor; `[]` ondan geçiyor.
Seçenekler: (A) her değerlendiriciye oturum kontrolü · (B) `Evidence`'a
`sessionFailed` bayrağı · (C) oturum çapraz kontrolden geçmediyse kanıt
alanlarını hiç doldurmamak
Karar: (C), 0.1.3'te.
Gerekçe: (A) yeni bir assertion tipi eklendiğinde unutulacak tek satır — sevk
katmanı tam da bunu önlemek için var (2026-08-31 kararı: "veri yokken pass
yok" sevk katmanında zorlanıyor). (B) aynı hatanın kılık değiştirmiş hâli:
kontrolü yine değerlendiricilere dağıtıyor. (C) hiç yeni mekanizma
gerektirmiyor; `REQUIRES` koruması zaten doğru soruyu soruyor, yalnızca
gerçeği görmüyordu.
İki yönlü ihlal olduğu not edildi: `fail` kullanıcıyı kırık skill aramaya
gönderiyor, `side_effect`in `pass`ı ise doğrudan değişmez #1'in yasakladığı
sessiz geçiş — ve ikincisi daha tehlikeli.
Ayrım korunacak: gerçekten koşup hiçbir şey yazmayan bir ajan (`completed` +
boş workspace) `fail` vermeye devam etmeli; orada ölçüm var.
Ayrı bir yama olmasının sebebi: davranış değişikliği. Bugün `fail` alan
koşumlar `unknown` alacak, CI çıkış kodu 1'den 3'e kayacak.
Geri dönüş maliyeti: düşük

## 2026-09-04 — Zeminin hareketi sürüklenen ızgaradan ölçüm halkalarına geçti

Bağlam: Kullanıcı arka planı beğenmediğini bildirdi; özellikle "aşağı doğru
olan belirip kaybolan grid parçaları". Kusur iki animasyonun birleşimiydi:
`field-drift` ızgarayı sonsuz sürüklüyor, üstündeki radyal maske de kenarları
eritiyordu — yani her çizgi ekranın bir yerinde beliriyor, başka bir yerinde
kayboluyordu. `field-interval` yatay çizgileri de açılıp kapanıyordu;
"belirip kaybolan"ın ikinci kaynağı oydu. Örnek olarak etkileşimli bir ripple
(halka) arka plan bileşeni verildi.
Seçenekler: (a) verilen bileşeni olduğu gibi almak · (b) hareketi tamamen
kaldırmak · (c) ripple fikrini alıp ürünün diline çevirmek
Karar: (c). Izgara **sabitlendi** (sürüklenme ve aralık çizgileri kaldırıldı);
yerine ölçülen bir noktadan dışa açılan üç eşmerkezli hairline halka geldi.
Halkalar kendiliğinden ~4.3 sn'de bir doğuyor, `pointerdown` olduğunda o
noktada bir tane daha doğuyor.
Gerekçe: (a) üç bağlayıcı yasağı birden çiğnerdi — verilen bileşen
`from-indigo-50 via-purple-50 to-pink-50` gradienti ve mor/mavi/pembe halkalar
kullanıyor; docs/design.md'de gradient yasak, marka vurgu rengi yok ve **kroma
yalnızca ölçüme ayrılmış**. Renkli bir zemin, "ekranda gördüğün renk bir ölçüm
sonucudur" kuralını sessizce bozardı. (b) istenen şey değildi; istenen daha
iyi bir hareketti, hareketsizlik değil. (c) halkayı ürünün kendi işaretine
bağlıyor: eşmerkezli üç halka güven aralığının radyal hâli — içteki değer,
dıştakiler belirsizlik. Kâğıt durur, üstünde olan biter hareket eder.
Uygulama farkları: halka `transform: scale` ile büyüyor (`width`/`height`
animasyonu her karede layout tetiklerdi); `styled-jsx` yerine `globals.css`
(depo konvansiyonu — bu depoda `components/ui` dizini ve `cn()` yardımcısı
yok, web bileşenleri `apps/web/app/components/` altında ve stil tek bir
global sayfada); dinleyici `window` üzerinde, alanın kendisinde değil — alan
içeriğin ARKASINDA ve `pointer-events: none`, kendi üstünde dinleseydi ya hiç
tetiklenmez ya da sayfanın tıklamalarını yutardı; aynı anda en fazla 6 halka
kümesi yaşıyor; `prefers-reduced-motion` açıkken hiç halka doğmuyor.
Bedeli: alan artık bir istemci bileşeni. Önceki hâli sıfır JS'ti ve bu bir
kayıp; karşılığında sayfanın dokunulduğunu bilen tek katmanı oldu.
Doğrulandı: `pnpm check` yeşil; dört sayfa (`/`, `/methodology`, `/signin`,
`/compare`) iki temada ve 375px'te çekildi — hepsi 200, yatay taşma yok,
konsolda hata yok. Tıklamadan 650 ms sonra üç halka canlı; 6 sn'de
kendiliğinden doğan küme de sayıldı. Next geliştirme katmanındaki "1 issue"
rozeti değişiklikten önce de vardı (stash'lenmiş taban koşumuyla karşılaştırıldı).
Geri dönüş maliyeti: düşük (tek bileşen + tek CSS bloğu)

## 2026-09-05 — Tetiklenme, çağrının varlığı değil aktivasyonun doğrulanması

Bağlam: Ayrıştırıcı bir `Skill` `tool_use` bloğu gördüğü anda "tetiklendi"
yazıyordu; eşleşen `tool_result`a hiç bakmıyordu. Impeccable pilotunda 4
kayıtlı tetiklenmenin 4'ü de reddedilmiş aktivasyondu — hiçbiri koşmamıştı —
ve rapor precision %100 dedi.
Seçenekler: (a) olduğu gibi bırakıp raporda uyarı yazmak · (b) reddi
`triggered: false` saymak · (c) reddi üçüncü bir durum yapmak
Karar: (c). `TriggerObservation` artık `refused` ve `refusals` taşıyor; hedef
skill seçilip aktive olmadıysa tetiklenme iddiası `unknown` üretiyor ve
gözlem doğruluk matrisine hiç girmiyor.
Gerekçe: (b) iki yönde de yanlış olurdu. Pozitif vaka `fail` alır ve kullanıcı
kırık olmayan bir skill'i tamir etmeye gider; negatif vaka `pass` alır ve
modelin skill'e uzandığı gizlenir — değişmez #1'in doğrudan yasakladığı sessiz
geçiş, üstelik en sinsi biçimde çünkü her negatif vaka geçer. (a) ise ölçüm
aracının kendi sayısına uyarı iliştirip yine o sayıyı basması olurdu.
Aktivasyonun doğrulanması dört yapısal engelle yapılıyor (metin eşleştirmesi
yok): host çağrıyı `permission_denials`'ta reddetti mi, `tool_result` hata
döndü mü, sonuç gövdesiz mi, sonuç hiç geldi mi.
Tavan: üçüncü engel, host'un başarılı bir `Skill` sonucunu her zaman gövdeyle
döndürdüğü varsayımına dayanıyor. Varsayım bozulursa her aktivasyon reddedilmiş
görünür ve her vaka `unknown` olur — gürültülü ama sessiz geçiş değil.
Aynı skill bir çağrıda reddedilip başka bir çağrıda aktive olduysa ölçüm
vardır ve `refused` false kalır.
Geri dönüş maliyeti: düşük (tek modül + tek alan), ama davranış değişikliği:
bugün `fail`/`pass` alan koşumlar `unknown` alacak.

## 2026-09-05 — İzin modu dışarı açıldı, varsayılan değişmedi

Bağlam: `--permission-mode` adaptörde `acceptEdits` olarak sabitti.
`allowed-tools` beyan eden bir skill bu modda hiç aktive olamıyor, yani o
skill Assay ile ölçülemiyordu.
Seçenekler: varsayılanı gevşetmek · modu dışarı açmak · vaka setine taşımak
Karar: CLI'da `--permission-mode`, adaptörde aynı adlı seçenek. **Varsayılan
`acceptEdits` kaldı.** `bypassPermissions` ayrıca `--allow-bypass-permissions`
istiyor. Bilinmeyen bir mod sessizce varsayılana düşmüyor, kullanım hatası
veriyor.
Gerekçe: Varsayılanı gevşetmek bugünkü koşumların anlamını sessizce
değiştirirdi; istenen şey seçim hakkıydı, farklı bir varsayılan değil. Vaka
setine taşımak 0.2.0-c'nin (`sandbox.allow_commands`) konusu ve ayrı bir şema
değişikliği; mod önce çalışır olmalı. Yanlış yazılmış bir modun sessizce
varsayılana düşmesi, kullanıcının ölçtüğünü sandığı şeyi ölçmemesi demekti.
Geri dönüş maliyeti: düşük

## 2026-09-05 — İzin modu ortam hash'inin içine girdi

Bağlam: Mod dışarı açılınca ölçümün bir koşulu oldu: araçları kısıtlanmış bir
skill ile kısıtlanmamış olan iki farklı ölçümdür. Kayıt bunu taşımazsa iki
farklı koşum karşılaştırılabilir görünür.
Seçenekler: yalnızca kayda yazmak · beşinci bir pin açmak · pin 3'ün
denetçisi olan `environmentHash`'e katmak
Karar: Üçüncüsü, artı `Run.permissionMode` alanı raporda okunsun diye.
Gerekçe: `init.permissionMode` zaten ayrıştırılıyordu ve hash'in dışında
bırakılmıştı; hash'in işi tam olarak "host'un bildirdiği ortam kaydı mı"
sorusunu cevaplamak. Beşinci bir pin açmak `comparePins`'in anahtar listesini
büyütür ve eski kayıtları "pin eksik" diye tamamen karşılaştırılamaz yapardı.
Hash'e katmak aynı işi yapıyor ve eski kayıtlar yalnızca "ortam kaydı" diyor.
Alan ayrıca kayıtta duruyor çünkü bir hash raporda okunmaz, mod okunur.
Bedeli: 0.2.0 öncesi kayıtlar yeni kayıtlarla karşılaştırıldığında `unknown`
üretiyor. Bu yanlış bir alarm değil — o koşumların modu gerçekten kayıtlı
değildi.
Geri dönüş maliyeti: orta (hash tanımı değişti, eski karşılaştırmalar durdu)

## 2026-09-05 — Hook olayları kanonik ize giriyor

Bağlam: Ayrıştırıcı `system` olaylarından yalnızca `init`i okuyordu.
`hook_started` ve `hook_response` akışta zaten var ve `stdout`, `stderr`,
`exit_code`, `outcome` taşıyorlar.
Seçenekler: yalnızca `ParsedStream`'e almak · ize `hook` türü eklemek ·
hook'ları görmezden gelmeye devam etmek
Karar: Yeni bir `TraceEventKind` değeri (`hook`) ve `TraceEvent.hook` alanı.
Prisma tarafında `HOOK` enum değeri, `hook` jsonb sütunu ve "HOOK olayı
hook'suz olamaz" kısıtı.
Gerekçe: Yalnızca `ParsedStream`'de tutmak onları kayda hiç sokmazdı, yani
görünmez kalırlardı. Hook'lar ölçümün görünmez değişkeni: bir `SessionStart`
hook'u sistem promptuna metin enjekte edebiliyor, bir `PreToolUse` hook'u araç
çağrısını reddedebiliyor. İkisi de skill'in davranışını değiştiriyor ve hiçbiri
skill'in kendisi değil. Kayıtta durmazlarsa iki koşum arasındaki fark
açıklanamaz kalır.
`hook_progress` bilerek dışarıda: 0.2.0'ın kapsamı started ve response.
Çıktı 2000 karakterde kesiliyor ve kesildiği metnin sonunda yazıyor — kayıt bir
CI artefaktı ve hook stdout'u gerçek koşumlarda on binlerce karakter.
Geri dönüş maliyeti: düşük (ek alan; eski kayıtlar okunmaya devam ediyor)

## 2026-09-05 — `permission_denials` okunuyor, red izde kendi alanında

Bağlam: `result.permission_denials` her koşumda geliyordu ve ayrıştırıcı yok
sayıyordu. Reddedilen bir çağrı izde sıradan bir araç hatası gibi duruyordu.
Seçenekler: yalnızca `Skill` reddi için okumak · her reddedilen çağrıyı
işaretlemek
Karar: İkincisi. `TraceEvent.refusal` reddin sebebini taşıyor ve red, çağrının
sonucuna işleniyor; sonuç hiç gelmediyse çağrının kendisine.
Gerekçe: "Skill bunu yapamadı" ile "Assay buna izin vermedi" iki farklı ölçüm
ve ikisi de araç çağrısının düşmesiyle sonuçlanıyor. İzde ayırt edilemezlerse
rapor okuyucusu yanlış yere bakar. Roadmap'teki 0.2.0-a maddesi bu; artefakt
assertion'larının reddi ayrı ele alması (0.2.0-a'nın ikinci yarısı) ve
`no_swallowed_errors`'ın redde ayrı cümle kurması (0.2.0-b) bu alanın üstüne
gelecek — bu yamada yalnızca sinyal okunuyor ve saklanıyor.
Geri dönüş maliyeti: düşük

## 2026-09-05 — `pinEnvironmentHash` hosted şemaya eklendi

Bağlam: `Pins.environmentHash` yerel kayıtta vardı ama `RunRow`'da yoktu;
yüklenen her koşumda pin 3 "ölçülemedi" kalıyor ve hosted karşılaştırma hep
`unknown` üretiyordu. İzin modu bu hash'in içine girdiği için sessiz kayıp
büyüyecekti.
Seçenekler: ayrı bir yamaya bırakmak · aynı migration'a katmak
Karar: Aynı migration.
Gerekçe: Eksik olan alan tam da bu yamanın dayandığı alan; ayrı bırakmak, izin
modunu hash'e koyup hash'i saklamamak olurdu. Zaten açılmış bir migration'a bir
sütun eklemenin maliyeti yok.
Geri dönüş maliyeti: düşük

## 2026-09-05 — Action pini depo sürümünden geride olamaz, ileride olabilir

Bağlam: `action-metadata.test.ts` `action.yml`'deki `assay-version` pinini
`packages/cli/package.json` sürümüne **tam eşitlikle** bağlıyordu. 0.2.0'ın
sürüm PR'ında test düştü: manifest 0.2.0'a çıktı, pin 0.1.3'te kaldı.
Kusur pinde değil, testin varsaydığı sırada: manifest önce hareket ediyor
(sürüm PR'ı), npm sonra (elle tetiklenen yayın koşumu). Tam eşitlik, aradaki
pencerede depoyu kırmızıya çeviriyor.
Seçenekler: (a) pini yayın sonrası ayrı bir commit'le güncellemek ·
(b) testin npm'e bakması · (c) kuralı yönlü yapmak
Karar: (c). Test artık `pin >= manifest` istiyor; geride kalmak hata, ileride
olmak değil. Pin sürüm PR'ında manifest ile birlikte yükseliyor.
Gerekçe: (a) pini kalıcı olarak bir sürüm geride bırakırdı — eylem her zaman
bir önceki CLI'ı kurardı ve tam da testin engellemek istediği durum sürekli
hâle gelirdi. (b) bir birim testini ağa bağlar, kararsızlaştırır ve yayın
penceresi boyunca yine kırmızı verirdi. (c) korunmak istenen asıl kuralı
koruyor: pin geride kalırsa eylem deponun ürettiğinden ESKİ bir CLI kurar ve
sessizce yanlış ölçüm üretir — `assay scrub` olmayan bir sürüm maskelenmemiş
kayıt yükler, 0.2.0 öncesi bir sürüm reddedilen aktivasyonları tetiklenme
sayar.
Karşılaştırma sözlük sırasıyla değil sayısal yapılıyor: `'0.10.0' < '0.9.0'`
doğru çıkar ve kural sessizce tersine dönerdi. Kuralın yönü ayrı bir testle
sabitlendi; ters çevrildiğinde kırmızıya döndüğü görüldü.
Tavan: `9.9.9` gibi bir yazım hatası artık burada yakalanmıyor. Yakalandığı
yerler duruyor — yayın sonrası `verify-published.mjs` ve eylemin kendi
kurulum adımı.
Bedeli: birleştirme ile yayın arasında `action.yml` npm'de henüz olmayan bir
sürümü gösteriyor. Pencere kısa ve kasıtlı; sırayı tersine çevirmenin bedeli
kalıcıydı.
Geri dönüş maliyeti: düşük

## 2026-09-05 — Dışarıya bakan her şey İngilizce; commit mesajları da

Bağlam: 2026-08-31 tarihli "Kullanıcıya görünen metinler İngilizce, kod
yorumları ve docs Türkçe" kararı commit mesajlarını Türkçe tarafta bırakmıştı
ve kök `README.md` hiç ele alınmamıştı. Depo public, eylem GitHub
Marketplace'te listeleniyor ve liste kök README'yi gösteriyor: uluslararası
bir geliştirici kitlesine Türkçe bir sayfa çıkıyordu.
Seçenekler: her şeyi Türkçe tutmak · yalnızca README'yi çevirmek · sınırı
"dışarıya bakan / bakmayan" ekseninde yeniden çizmek
Karar: Üçüncüsü. **İngilizce:** kullanıcıya görünen stringler, kök README,
paket README'leri, action README, CONTRIBUTING **ve commit mesajları.**
**Türkçe:** kod yorumları ve `docs/` altındaki çalışma notları.
Gerekçe: Eski ayrım "kullanıcıya görünen string" ekseninde çizilmişti ve
README bir string değil — kural onu görmüyordu. Doğru eksen dosyanın türü
değil, kime baktığı. Commit mesajları da bu tarafa geçti: depo public, geçmiş
herkese açık ve `git log` bir katkıcının okuduğu ilk şeylerden biri. Bu,
2026-08-31 kararının commit kısmını **geçersiz kılıyor**.
`docs/` Türkçe kalıyor: orası ürün belgesi değil, bakımı yapanın defteri ve
çeviri maliyeti her karar kaydında tekrar tekrar ödenirdi. Bedeli, dışarıdan
gelen birinin oraya tıkladığında şaşırması — bu yüzden dışarıya bakan her
sayfada o bağlantıların yanına `(Turkish)` notu düşüldü.
Geri dönüş maliyeti: orta (çeviri işi geri alınmaz, ama kural değiştirilebilir)

## 2026-09-05 — README'de ölçüm iddiası yalnızca kayıtlı koşumdan

Bağlam: README'nin "Durum" bölümü 150 koşumluk `xlsx` hikâyesini güncel
sonuçmuş gibi anlatıyordu ve "hosted katman henüz yok" diyordu — ikisi de
artık yanlış. Yenisini yazarken elimde daha yeni ölçümlerin **kaydı yoktu.**
Seçenekler: yeni ölçümleri isimleriyle anmak · sayılarını tahmin etmek ·
yalnızca kaydı olan ölçümleri yazmak
Karar: Üçüncüsü. Yazılan her sayı depoda duran bir koşum kaydına dayanıyor
(`docs/measurements.md`, `docs/dogfooding.md`) ve README bunu açıkça söylüyor:
"Nothing on this page is estimated."
Gerekçe: Sözleşme 3 zaten uyduruk rakamı yasaklıyor, ama asıl mesele daha
dar: bu ürünün tek iddiası ölçmediğini ölçtüm dememek. Kendi tanıtım
sayfasında kaydı olmayan bir sonucu anmak, tam da 0.2.0'da düzeltilen hatanın
pazarlama hâli olurdu. Kaydı yayımlanmamış skill'ler README'ye girmedi;
girdikleri gün sayılarıyla girecekler.
Geri dönüş maliyeti: düşük
