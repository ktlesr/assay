# İlerleme

Oturum sıfırlanırsa buradan devam edilir. Baştan başlanmaz.

Kararların tam listesi [decisions.md](decisions.md), engeller
[blockers.md](blockers.md).

## Durum

**Faz 0 tamam** (`faz-0`) · **Faz 1 tamam** (`faz-1`) · **Faz 2 sürüyor**

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
| 2.3 Bileşen katmanı | packages/ui, Radix tabanlı, /dev/components | — |

## Sırada

| Adım | Durum |
|---|---|
| 2.4 Dashboard | sürüyor |
| 2.5 Kimlik doğrulama | bekliyor |
| 2.6 Admin panel | bekliyor |
| 2.7 Tanıtım sayfası | bekliyor |
| 3.1 Tam güvenlik incelemesi | bekliyor |
| 3.2 Test ve CI | bekliyor |
| 3.3 Deploy | bekliyor |

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
- Testler: `pnpm check` (typecheck + lint + test). Gerçek host koşumları
  test suite'inde değil, `tools/` altında elle çalıştırılır.
