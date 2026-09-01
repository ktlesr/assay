# Vaka Seti Biçimi

Bir suite, tek bir skill'i tek bir ortamda ölçen YAML dosyasıdır. Şema ve
doğrulayıcı `packages/core/src/suite.ts` içinde; çalışan örnek
[examples/docx.suite.yaml](../examples/docx.suite.yaml).

Doğrulayıcı iki katmandır: **biçim** (Zod) ve **anlamsal geçiş**
(`docs/invariants.md`'nin dayattığı kurallar). İkinci katman ayrı durur çünkü
Zod'un ürettiği birleşim hataları eyleme dönük değil.

Girdi bir YAML *metnidir*, dosya yolu değil — `core` I/O yapmaz. Dosyayı okumak
runner'ın işi.

## Üst düzey alanlar

```yaml
version: 1                    # pin 4 — vaka seti sürümü
target:
  skill: docx                 # test edilen skill
  source: owner/repo@<sha>    # pin 1 — skill sürümü
environment:
  host: claude-code           # hangi host koşuyor
  model: <tam-model-kimliği>  # pin 2 — "latest" değil
  system_prompt_hash: sha256:…# pin 3
  active_skills: [docx, pdf]  # coexistence için, v0'da opsiyonel
runs: 10                      # asla 1 değil
cases: [...]
```

### Dört pin

`target.source`, `environment.model`, `environment.system_prompt_hash` ve
`version` — dördü de zorunludur. Biri eksikse suite doğrulanmaz.

`version` beyan edilen vaka seti sürümüdür ve vakalar değiştiğinde artırılır.
Runner ayrıca suite kaynağının içerik hash'ini koşum kaydına yazar: sürüm
artırmayı unutan bir düzenleme oradan görülür.

## Vakalar

```yaml
- id: trigger.negative.near_neighbor.pdf   # hiyerarşik, küçük harf, benzersiz
  prompt: 'Bu taslağı PDF olarak dışa aktar.'
  setup: { fixtures: ./fixtures/draft.md, cwd: ./work }   # opsiyonel
  expect:
    triggered: false
    not_triggered: [pdf]      # coexistence, opsiyonel
    assertions: [...]         # opsiyonel
```

`id` biçimi: `^[a-z0-9]+(\.[a-z0-9_]+)+$`. En az bir nokta zorunlu — düz bir
kimlik vakaların hangi katmanı ölçtüğünü gizler.

`near_neighbor` segmenti anlamlıdır: yakın-komşu negatifi bu segmentle
işaretlenir ve doğrulayıcı bunu arar.

## Assertion tipleri

| Tip | Alanlar | Ne ölçer |
|---|---|---|
| `file_exists` | `path` (glob) | Artefakt oluştu mu |
| `file_valid` | `format`, `path` (ops.) | Dosya gerçekten o biçimde mi |
| `json_schema` | `path`, `schema` | Çıktı şemaya uyuyor mu |
| `exit_code` | `equals` | Süreç beklenen kodla bitti mi |
| `file_content_matches` | `path`, `matches`, `flags` (ops.) | İçerik regex'e uyuyor mu |
| `trace` | `rule` + kurala özgü alanlar | Araç çağrısı izi |
| `side_effect` | `writes_within`, `network` | Sınır dışına çıktı mı |

`file_valid` yolsuz yazıldığında aynı vakadaki `file_exists` ile eşleşen tüm
dosyalara uygulanır; o vakada `file_exists` yoksa hata verir.

### Trace kuralları

| Kural | Zorunlu alan |
|---|---|
| `no_swallowed_errors` | — |
| `tool_called` | `tool` (`min_times` opsiyonel) |
| `tool_sequence` | `tools`, en az iki |
| `tool_args_valid` | `tool`, `schema` |

## Doğrulama kuralları

**Hatalar** — suite koşulmaz:

| Kural | Neden |
|---|---|
| `runs < 2` | Tek koşum bir gözlemdir, ölçüm değil (değişmez #3) |
| Hiç negatif vaka yok | Her istekte tetiklenen skill tüm pozitifleri geçer (değişmez #5) |
| Dört pinden biri eksik | Karşılaştırma anlamsız olur (değişmez #2) |
| Yinelenen veya hiyerarşik olmayan `id` | Kayıtlar eşleştirilemez |
| `not_triggered` var, `active_skills` boş | Kurulu olmayan bir skill'in tetiklenmediği iddia edilemez |
| `not_triggered` `active_skills` dışında bir ad sayıyor | Aynı sebep |
| Hiçbir şey ölçmeyen vaka | `expect` boşsa vaka sinyal üretmez |
| Trace kuralının zorunlu alanı eksik | Kural uygulanamaz |
| `side_effect` ne `writes_within` ne `network` içeriyor | Hiçbir şey iddia etmiyor |

**Uyarılar** — suite koşulur, rapor edilir:

| Kural | Neden |
|---|---|
| Negatif var ama yakın komşu yok | Alakasız bir negatifi geçmek kolay; ayırt edici sinyal benzeyen isteklerden gelir |

## Coexistence

`environment.active_skills` ve `expect.not_triggered` v0'da **zorunlu değil**,
ama şemada bugün var. Sonradan eklemek mevcut suite dosyalarını bozardı; bugün
eklemek bedava. Çarpışma motoru Faz 2 sonrasına planlı ([roadmap.md](roadmap.md)).

## API

```ts
import { parseSuite } from '@ktlsr/assay-core'

const result = parseSuite(yamlText)
if (result.ok) {
  result.suite      // doğrulanmış Suite
  result.issues     // yalnızca uyarılar
} else {
  result.issues     // en az bir 'error'
}
```

Her sorun `{ level, path, message }` taşır. `path`, YAML içindeki konumdur:
`cases[3].expect.assertions[0].tool`.

Kullanıcıya görünen tüm mesajlar İngilizcedir; SDK Apache-2.0 ve uluslararası
skill yazarlarına hitap eder.
