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

## 2026-08-31 — MockAdapter `@assay/runner/testing` alt yolunda
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
`subtype: "success"`, `is_error: false`, `cost: 0` raporladı. Hiç gerçekleşmemiş
bir koşum başarılı göründü.
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
