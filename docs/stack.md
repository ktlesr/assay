# Teknoloji Yığını

Her seçim bir gerekçeyle. Yığın kararlarının tam kaydı
[decisions.md](decisions.md) içinde.

## Ortak temel

| Alan | Seçim | Gerekçe |
|---|---|---|
| Dil | TypeScript, `strict` | Kanonik koşum kaydı ürünün çekirdek veri yapısı; tip sistemi olmadan şema kayması sessizce yayılır |
| Runtime | Node.js 22 LTS | `.nvmrc` ile pinli. Adaptörler alt süreç ve dosya sistemi işi yapıyor; LTS istikrarı gerekiyor |
| Paket yöneticisi | pnpm 10, workspace | Monorepo'da katı `node_modules` izolasyonu; `core`'un bir şeye bağımlı olmadığını disk seviyesinde de garanti eder |
| Lint | ESLint 9 flat config | Bağımlılık sınırlarını `no-restricted-imports` bölgeleriyle makine seviyesinde zorlar |
| Format | Prettier | Tartışmayı bitirir |
| Test | Vitest | TS/ESM ile sürtünmesiz; monorepo workspace desteği |
| Commit | Conventional Commits | Değişiklik günlüğü ve sürümleme otomatikleşebilir |

## Monorepo yapısı

```
packages/core       şema tipleri, kanonik kayıt, assertion motoru, skorlama
packages/runner     sandbox koşumu, adaptör arayüzü, kayıt katmanı, yerel store
packages/adapters   her host ortamı için bir adaptör
packages/cli        SDK'nın komut satırı yüzü
packages/db         Prisma şeması (Faz 2)
packages/ui         tema ve bileşenler (Faz 2)
apps/web            Next.js hosted platform (Faz 2)
```

### Bağımlılık kuralı

```
core     → hiçbir şey
runner   → core
adapters → core
cli      → core, runner, adapters
db       → (bağımsız)
ui       → (bağımsız)
web      → core, db, ui        ✗ runner'a ASLA
```

`core` saf TypeScript'tir: I/O yok, ağ yok, dosya sistemi yok. Assertion
motorunun tarayıcıda, Node'da ve testte aynı davranması buna bağlı. Zod ve yaml
gibi saf hesaplama kütüphaneleri serbesttir; Node yerleşikleri (`node:*`, `fs`,
`path`, `child_process`, `crypto`, ...) lint kuralıyla yasaklıdır.

Bu grafik `eslint.config.js` içinde paket başına bir `no-restricted-imports`
bölgesi olarak kodlanmıştır. `tools/dependency-boundaries.test.ts` kuralın
gerçekten ihlal yakaladığını kanıtlar: kural gevşetilirse test kırmızıya döner.

`web` runner'a bağlanmaz. Hosted platform ölçmez, hatırlar
([product.md](product.md)). Bu bağımlılığı eklemek mimariyi sessizce
çökertecek tek hamledir; bu yüzden lint kuralıyla engellenir ve kuralın
gerçekten ihlal yakaladığı bir testle kanıtlanır.

## Faz 1 — yerel

Faz 1'de hosted hiçbir şey yok. SDK tek başına tam çalışır.

| Alan | Seçim | Not |
|---|---|---|
| Kalıcılık | Dosya tabanlı store (`.assay/runs/`) | Koşum kayıtları JSON. Şema versiyonlu. `.gitignore`'da |
| Sandbox | Yerel süreç izolasyonu + dosya sistemi jail'i | Kapsamı 1.2'de netleşir, 1.3'te güvenlik incelemesinden geçer |
| Adaptör | Host başına bir modül | Sinyal yüzeyi 0.6'daki fizibilite spike'ında belirlenir |
| Çıktı | JSON + insan okunur özet | JSON birincil; CI ve platform aynı kaydı okur |
| CI | GitHub Action | SDK'yı PR'da koşar |

Faz 1'de veritabanı **yok**. Bir DB kurmak kolay, sonradan kaldırmak zor;
dosya store dört pini ve N tekrarı taşımak için yeterli.

## Faz 2 — hosted

| Alan | Seçim | Gerekçe |
|---|---|---|
| Uygulama | Next.js App Router | Server component'ler ile koşum geçmişini sunucuda okumak, istemciye ham kayıt taşımadan |
| Veritabanı | PostgreSQL | Koşum kayıtları JSONB; zaman serisi sorguları ve karşılaştırma için ilişkisel taban |
| ORM | Prisma | Şema tek kaynak; migration disiplini |
| UI | Tailwind + shadcn/ui | Sahiplenilen bileşenler, sürüm kilidi olmadan. 2.2'ye kadar `apps/web` düz CSS kullanır |
| Auth | Auth.js | Kendi kimlik doğrulamamızı yazmama kararı |
| Deploy | Dokploy, VPS | Kendi altyapımız; sandbox koşumu ileride sunucu tarafına taşınırsa serverless kısıtlarına takılmayız |

### Faz 1 → Faz 2 geçiş sınırı

Faz 2'de dosya store atılmaz. Kanonik koşum kaydı tipi `core`'da tanımlı
kalır; dosya store ve Postgres aynı tipin iki kalıcılık hedefi olur.
Platform, SDK'nın ürettiği kaydı **alır**; kendi formatını dayatmaz.

Bunun sonucu: SDK kullanıcısı platforma geçerken geçmişini kaybetmez,
platform kullanıcısı SDK'ya dönerken kilitlenmez.

## Bilinçli olarak yığında olmayanlar

- **LLM judge kütüphanesi** — v0'da judge yok (bkz. invariants #6).
- **Kuyruk / worker altyapısı** — Faz 1'de koşum senkron ve yerel. Ölçek
  sorunu henüz yok.
- **Docker sandbox** — 0.6 ve 1.3 sonuçlarına göre değerlendirilecek.
  Şimdi eklemek, ölçemediğimiz bir şeye altyapı yazmak olur.
- **Monorepo build orkestratörü (Turbo/Nx)** — paket sayısı bunu haklı
  çıkarana kadar pnpm script'leri yeter.
