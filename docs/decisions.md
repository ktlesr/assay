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
