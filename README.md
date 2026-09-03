# Assay

AI ajan skill'lerinin gerçekten çalışıp çalışmadığını ölçen değerlendirme aracı.

Ad, metalürjideki *tahlil* işleminden geliyor: bir numunenin iddia edilen
değil, gerçek muhtevasını belirlemek. Bir skill'in README'si ne yaptığını
söyler; Assay ne yaptığını ölçer.

## Ne değil

Genel amaçlı LLM eval aracı değil. Prompt karşılaştırma platformu değil.
Model benchmark'ı değil.

## Ne

Agent Skills için CI test koşum aracı. Jest'in birim testlere,
Playwright'ın tarayıcı akışlarına yaptığını skill'lere yapar: bir vaka
seti yazarsın, `assay run` koşar, üç durumlu bir verdict alırsın.

## Ölçüm katmanları

| Katman | Soru |
|---|---|
| Tetiklenme doğruluğu | Skill doğru istekte devreye giriyor, yanlışta girmiyor mu? |
| Görev tamamlama | İş bittiğinde ortaya çıkan artefakt doğru mu? |
| Araç çağrısı izi | Beklenen araçlar, beklenen sırada mı çağrıldı? |
| Yan etkiler ve güvenlik | İzin verilmeyen bir şeye dokundu mu? |
| Kararsızlık | Aynı girdi N kez koşulduğunda sonuç ne kadar sapıyor? |
| Regresyon | Skill'in yeni sürümü eskisine göre nerede geriledi? |
| Maliyet ve gecikme | Token ve süre bütçesi içinde mi? |

## İki parça

- **SDK (Apache-2.0)** — ölçen taraf. Platform olmadan tam çalışır.
  Yerelde ve CI'da koşar.
- **Hosted platform** — hatırlayan taraf. Koşum geçmişi, regresyon
  karşılaştırması, ekip görünürlüğü.

SDK'yı platform olmadan kullanmak birinci sınıf bir senaryodur, düşürülmüş
bir sürüm değil.

## Değişmezler

Assay'in ölçüm iddiasını ayakta tutan altı kural
[docs/invariants.md](docs/invariants.md) içinde. Özet:

- Verdict üç durumlu: `pass` / `fail` / `unknown`. Sessiz `pass` yasak.
- Karşılaştırma dört pin ister: skill sürümü, model kimliği, sistem
  promptu hash'i, vaka seti sürümü.
- Tekrar sayısı varsayılanı asla 1 değil.
- Hiçbir oran, N ve güven aralığı olmadan gösterilmez.
- Tetiklenme suite'i negatif ve yakın-komşu vakası içermek zorunda.
- v0'da LLM judge yok.

## Kullanım

```
npm install -g @ktlsr/assay

assay init my-skill.suite.yaml
assay validate my-skill.suite.yaml
assay run my-skill.suite.yaml --skill ./my-skill
assay compare <run-a> <run-b>
```

Depodan çalıştırmak için:

```
pnpm install && pnpm typecheck
node packages/cli/dist/bin.js validate my-skill.suite.yaml
```

Claude Code adaptörü `CLAUDE_CODE_OAUTH_TOKEN` (`claude setup-token` ile
üretilir) veya `ANTHROPIC_API_KEY` ister: her koşum izole bir config dizininde
yürüdüğü için interaktif oturumu devralmaz.

CLI ayrıntıları: [packages/cli/README.md](packages/cli/README.md).
### GitHub Action

```yaml
- uses: actions/checkout@v5
- uses: ktlesr/assay@v1
  with:
    suite: ./my-skill.suite.yaml
    skill: ./my-skill
    claude-code-oauth-token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
```

Eylem CLI'ı ve host'u kendi kuruyor; `setup-node` ya da derleme adımı
gerekmiyor. Karneyi PR yorumuna yazıyor, regresyonda check'i düşürüyor ve
koşum kayıtlarını artefakt olarak yüklüyor (yüklemeden önce kullanıcı adı ve
sır maskelemesinden geçiriyor).

Ayrıntılar: [action/README.md](action/README.md) · hazır workflow
[examples/workflows/assay.yml](examples/workflows/assay.yml) · yayın adımları
[docs/marketplace.md](docs/marketplace.md).

### npm paketleri

| Paket | Rol |
|---|---|
| [`@ktlsr/assay`](packages/cli) | CLI. `bin: assay` |
| [`@ktlsr/assay-core`](packages/core) | Şema, assertion motoru, skorlama, karşılaştırma. Saf, I/O yok |
| [`@ktlsr/assay-runner`](packages/runner) | Sandbox koşumu, kanıt toplama, yerel store |
| [`@ktlsr/assay-adapters`](packages/adapters) | Host adaptörleri. Bugün Claude Code |

`packages/db`, `packages/ui` ve `apps/web` hosted katmana ait; yayımlanmaz.
Yayın süreci: [docs/releasing.md](docs/releasing.md).

## Durum

**Faz 1 tamamlandı.** Geçiş kriterlerinin onu da tutuyor
([dogfooding.md](docs/dogfooding.md)).

Assay üç gerçek skill üzerinde 150 koşum yaptı ve `xlsx` skill'inin kendi
açıklamasında tarif ettiği bir vakada **10'da 4** tetiklendiğini ölçtü.
Vaka fixture ile düzeltilince 10'da 8'e çıktı — ve Assay bu iyileşmeyi bile
"kanıtlanmadı" saydı, çünkü N=10'da güven aralıkları kesişiyor.

**Faz 1 detayı.** SDK Claude Code üzerinde uçtan uca çalışıyor: örnek suite
4 vaka × 3 tekrarla koşuyor, tetiklenme precision/recall ölçülüyor, artefakt
doğrulanıyor, koşumlar `.assay/runs/` altına yazılıyor ve `compare` dört pin
kaymışsa karşılaştırmayı reddediyor.

Faz 0 fizibilite sonucu: Claude Code'da dört sinyalin dördü de okunabiliyor;
tetiklenme, modelin seçtiği durumda açık bir `Skill` araç çağrısı olarak
görünüyor. Codex'te yapısal bir tetiklenme olayı yok — çapraz-host matrisi bu
yüzden ertelendi. Ayrıntılar:
[docs/host-feasibility.md](docs/host-feasibility.md) ve
[docs/adapter-validation.md](docs/adapter-validation.md).

Hosted katman (geçmiş, dashboard) henüz yok; Faz 2.

Yol haritası: [docs/roadmap.md](docs/roadmap.md).

## Dokümanlar

- [docs/product.md](docs/product.md) — ürün tanımı, konumlandırma, mimari
- [docs/invariants.md](docs/invariants.md) — değişmezler ve gerekçeleri
- [docs/stack.md](docs/stack.md) — teknoloji yığını
- [docs/roadmap.md](docs/roadmap.md) — fazlar ve geçiş kriterleri
- [docs/decisions.md](docs/decisions.md) — karar günlüğü
- [docs/suite-format.md](docs/suite-format.md) — vaka seti YAML biçimi ve doğrulama kuralları
- [docs/adapters.md](docs/adapters.md) — host adaptör sözleşmesi
- [docs/adapter-validation.md](docs/adapter-validation.md) — Claude Code adaptörünün canlı doğrulaması
- [docs/sandbox-security.md](docs/sandbox-security.md) — sandbox güvenlik incelemesi ve kabul edilen riskler
- [docs/releasing.md](docs/releasing.md) — npm yayın süreci ve denetimleri
- [docs/operations.md](docs/operations.md) — token yenileme, kısmi yayın, işletim
- [docs/calibration.md](docs/calibration.md) — aracın kırmızı gösterebildiğinin kanıtı
- [docs/blockers.md](docs/blockers.md) — izole edilen engeller ve açma koşulları
- [docs/dogfooding.md](docs/dogfooding.md) — üç gerçek skill üzerinde 150 koşumluk ölçüm raporu
- [docs/design.md](docs/design.md) — tasarım dili: tahlil sertifikası
- [docs/progress.md](docs/progress.md) — faz ilerlemesi
- [docs/host-feasibility.md](docs/host-feasibility.md) — üç host için sinyal okunabilirlik matrisi (Faz 0 çıktısı)
- [docs/workflow.md](docs/workflow.md) — çalışma sözleşmeleri

## Lisans

Apache-2.0. Bkz. [LICENSE](LICENSE).
