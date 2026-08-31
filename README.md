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

## Durum

Faz 0 — fizibilite. Henüz koşulabilir bir CLI yok. Bu fazın çıktısı
Assay'in gerçekte hangi sinyalleri ölçebildiği ve projenin devam edip
etmeyeceğidir.

Yol haritası: [docs/roadmap.md](docs/roadmap.md).

## Dokümanlar

- [docs/product.md](docs/product.md) — ürün tanımı, konumlandırma, mimari
- [docs/invariants.md](docs/invariants.md) — değişmezler ve gerekçeleri
- [docs/stack.md](docs/stack.md) — teknoloji yığını
- [docs/roadmap.md](docs/roadmap.md) — fazlar ve geçiş kriterleri
- [docs/decisions.md](docs/decisions.md) — karar günlüğü
- [docs/suite-format.md](docs/suite-format.md) — vaka seti YAML biçimi ve doğrulama kuralları
- [docs/workflow.md](docs/workflow.md) — çalışma sözleşmeleri

## Lisans

Apache-2.0. Bkz. [LICENSE](LICENSE).
