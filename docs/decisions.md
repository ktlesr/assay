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
