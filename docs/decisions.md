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
