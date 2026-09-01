# İlerleme

Oturum sıfırlanırsa buradan devam edilir. Baştan başlanmaz.

Kararların tam listesi [decisions.md](decisions.md), engeller
[blockers.md](blockers.md).

## Durum

**Faz 0–3 tamam** · **kalibrasyon tamam** · **0.1.0 npm'de yayımlandı**

Dört paket 2026-09-01'de yayımlandı: `@ktlsr/assay`, `-core`, `-runner`,
`-adapters`. Trusted publishing (OIDC), provenance'lı, saklanan token yok.

## Tamamlananlar

| Adım | Çıktı | Commit |
|---|---|---|
| 0.1 Proje anayasası | docs/, CLAUDE.md, repo hijyeni | `eff9647` |
| 0.2 Monorepo iskeleti | pnpm workspace, zorlanan bağımlılık sınırları | `d731b9a` |
| 0.3 Vaka seti şeması | `parseSuite`, Zod + anlamsal doğrulama | `02818de` |
| 0.4 Assertion motoru | kanonik tipler, `no_swallowed_errors`, Wilson | `f873f2d` |
| 0.5 Adaptör arayüzü | `HostAdapter`, MockAdapter | `b1e6690` |
| 0.6 Host fizibilite | docs/host-feasibility.md, git kararı | `e787ee6` |
| 1.1 Gerçek adaptör | Claude Code, canlı doğrulama 3/3 | `4f5b950` |
| 1.2 Runner + store | uçtan uca 12/12, skorlama | `eae4316` |
| 1.4 CLI | run/validate/report/compare/ci, HTML rapor | `2ffe1c2` |
| 1.5 GitHub Action | PR karnesi, baseline artefaktı | `47f2b88` |
| 1.3 Sandbox güvenliği | 4 yüksek + 2 orta bulgu kapatıldı | `fce6643` |
| 1.6 Dogfooding | 3 skill, 150 koşum, gerçek kusur bulundu | `bf37645` |
| 2.1 Veri modeli | Prisma şeması, DB seviyesinde değişmezler, gidiş-dönüş | `d62b30a` |
| 2.2 Tema sistemi | tahlil sertifikası dili, iki tema, Tailwind v4 | `13b2352` |
| 2.3 Bileşen katmanı | packages/ui, Radix tabanlı, /dev/components | `c7d74ff` |
| 2.4 Dashboard | beş ekran, karşılaştırma reddi gerçek veriyle | `8e90b58` |
| 2.5 Kimlik doğrulama | Auth.js, rol, API token, assay push, DB'den okuma | `5332597` |
| 2.6 Admin panel | kullanıcılar, koşumlar, denetim kaydı | `b685d50` |
| 2.7 Tanıtım sayfası | yalnızca veritabanından okunan gerçek ölçüm | `f25fd36` |
| 3.1 Güvenlik incelemesi | 2 yüksek + 3 orta bulgu kapatıldı | `cb76d75` |
| 3.2 Test ve CI | kapsam eşiği, prisma generate, derleme adımı | `4bbc04d` |
| 3.3 Deploy | Dockerfile, compose, /api/health, docs/deploy.md | `a3c0858` |
| npm hazırlık | `@ktlsr` scope'u, 0.1.0, changesets, tarball denetimi | `afa1cb8` |
| Yayın hattı | token doğrulaması, yayın sonrası registry kanıtı | `5094571` |
| Public depo | provenance, geçmiş sır taraması (temiz) | `3016d53` |
| Yayın tetiği | push değil, `workflow_dispatch` + onay metni | `4dc5fc1` |
| Kalibrasyon | fail/unknown gerçek koşumlarla kanıtlandı | (bu commit) |

## Sırada

Faz 0–3 kapandı. Sıradaki dalga roadmap.md'de: skill çakışma testi, model
güncelleme sertifikasyonu, çapraz-host uyumluluk matrisi, skill kalite rozeti.
Bunlar bilerek yapılmadı.

## Yayın durumu

- Paketler: `@ktlsr/assay` (bin `assay`), `-core`, `-runner`, `-adapters`.
  `db`, `ui`, `web` yayımlanmaz.
- Sürüm 0.1.0 **yayımlandı**; dördü de registry'de ve provenance taşıyor.
- Yayın **push ile tetiklenmiyor**: `gh workflow run release.yml -f
  confirm=yayimla`. Sebep — main'e atılan her commit bir yayın denemesine
  dönüşüyordu.
- Kimlik doğrulama trusted publishing (OIDC). `NPM_TOKEN` hattan çıkarıldı;
  iş akışına geri eklenirse OIDC devre dışı kalır — eklemeyin.
- İlk yayın denemesi `EOTP` ile düşmüştü (token 2FA'yı atlayamıyor); trusted
  publishing bu sınıfı tamamen ortadan kaldırdı.
- Yayın sonrası doğrulama artık changesets'in `published` bayrağına değil
  yayın moduna bağlı: 0.1.0'da bayrak `false` kaldığı için doğrulama sessizce
  atlanmıştı, paketler gitmişti ama kimse kontrol etmemişti.
- Süreç [releasing.md](releasing.md), işletim [operations.md](operations.md),
  kalibrasyon [calibration.md](calibration.md).

## CI durumu

2026-09-01'de CI'ın **her push'ta kırmızı olduğu** fark edildi — yalnızca bu
oturumun commit'lerinde değil, 31 Ağustos'takilerde de. Koşumlar 10–20
saniyede düşüyordu: `pnpm/action-setup` hem action config'indeki `version: 10`
hem `package.json`'daki `packageManager` alanını görünce "Multiple versions of
pnpm specified" hatası veriyor ve kurulum hiç başlamıyordu. Yerelde `pnpm
check` geçtiği için fark edilmemişti.

`version:` üç workflow'dan da kaldırıldı (`cf28065`). CI o commit'te ilk kez
uçtan uca yeşile döndü: install, prisma generate, typecheck, lint, coverage,
build ve standalone denetimi.

Aynı düzeltme Release'i de kurtardı — yayın tetiklendiğinde tam olarak aynı
adımda düşecekti.

## Kalibrasyon özeti

Araç kırmızı gösterebiliyor; 2026-09-01'de 36 gerçek koşumla kanıtlandı.
`fail` üç katmanda (tetiklenme, tamamlama, yutulan hata), `unknown` iki
yoldan (okunamayan sinyal 6/6, gözlenemeyen yan etki 2/3), çıkış kodlarının
dördü de doğru. **Üretilemeyen tek verdict `regressed`** — sebebi
istatistiksel, [calibration.md](calibration.md)'de yazılı.

## Çalışma kuralları (oturum sıfırlanırsa)

- Her adım sonunda: typecheck + lint + test, arayüz varsa iki temada ekran
  görüntüsü, sır taraması, commit, `main`'e push.
- Üç denemede çözülmeyen sorun `blockers.md`'ye yazılır, parça izole edilir,
  kalanla devam edilir.
- Eksik sır (Google OAuth, SMTP, model anahtarı) durdurmaz: `.env.example`'a
  placeholder, özellik iskelet, ilgili test `skip`, `blockers.md`'ye kayıt.
- Yalnızca üç şeyde durulur: sır sızıntısı, geri alınamaz git işlemi,
  `invariants.md` ile çelişki.

## Ortam

- Kimlik: `.env` içinde `CLAUDE_CODE_OAUTH_TOKEN` (`claude setup-token`).
  Doğrulamak için `node tools/check-auth.mjs`.
- Gerçek host koşumu para harcar: attempt başına ~$0.03–0.06.
- `pnpm dev` → http://localhost:3000
- Hosted taraf veritabanı ister. Geliştirmede: `pnpm db:dev` (PGlite,
  127.0.0.1:5433). `apps/web/.env.local` içinde `DATABASE_URL`, `AUTH_SECRET`
  ve `DATABASE_POOL_MAX=1`.
- İlk yönetici: `DATABASE_URL=... pnpm db:user <email> <parola> ADMIN`.
- Veritabanını gerçek koşumlarla doldurmak: arayüzden token üret, sonra
  `ASSAY_URL=... ASSAY_TOKEN=... node tools/seed-hosted.mjs`.
- Testler: `pnpm check` (typecheck + lint + test). Gerçek host koşumları
  test suite'inde değil, `tools/` altında elle çalıştırılır.
