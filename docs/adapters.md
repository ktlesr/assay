# Host Adaptör Sözleşmesi

Bir adaptör bir **host ortamını** temsil eder, bir skill'i değil. Claude Code,
Codex ve Copilot ayrı adaptörlerdir; `docx` skill'i adaptör değildir.

Arayüz: `packages/runner/src/adapter.ts`.

```ts
interface HostAdapter<S extends AgentSession = AgentSession> {
  readonly id: string
  start(config: RunConfig): Promise<S>
  readTriggerSignal(session: S): Promise<TriggerObservation>
  readTrace(session: S): Promise<readonly TraceEvent[] | undefined>
  finalize(session: S): Promise<SessionResult>
}
```

## Sözleşmenin sert kuralı

**Sinyal okunamadığında hata fırlatma, okunamadığını söyle.**

`readTriggerSignal` her zaman bir `TriggerObservation` döner:

```ts
type TriggerObservation =
  | { available: true; triggered: boolean; skills: string[]; complete: boolean; via: string }
  | { available: false; reason: string }
```

`triggered` alanına `available: true` olmadan erişilemez — tip, "bilinmiyor"u
görmezden gelinemez kılar. Runner `available: false` gördüğünde attempt'i
`unknown` işaretler. **Tahmin yürütmek ve varsayılan üretmek yasaktır**
(docs/invariants.md #1): sinyal okunamadığında "tetiklenmedi" varsaymak, her
negatif vakayı bedavaya geçirir.

`reason` insan tarafından okunacak: hangi mekanizmanın denendiğini ve neden
yetmediğini söylesin.

`via` sinyalin nereden okunduğunu söyler ve rapora düşer. İki host aynı verdict'i
farklı güvenilirlikte üretebilir; okuyucu bunu görebilmeli.

`complete`, `skills` listesinin tetiklenen skill'lerin *tamamı* olup olmadığını
söyler. `false` ise coexistence iddiaları (`expect.not_triggered`) doğrulanamaz
ve `unknown` üretilir.

## İz

`readTrace` iz alınamadığında `undefined` döner. **Boş dizi farklı bir iddiadır:**
"hiçbir araç çağrılmadı". Bu ayrım `no_swallowed_errors` için belirleyicidir —
alınamayan iz `unknown`, boş iz de `unknown` ama farklı gerekçeyle; ikisi de
`pass` değildir.

## Pin 3

`finalize` sistem promptu hash'ini verebiliyorsa `systemPromptHash` alanında
verir. Veremiyorsa alan yoktur; runner pin eksikliğini raporlar, **uydurmaz**.

## MockAdapter

`@assay/runner/testing` altında. **Yalnızca test aracıdır**; arayüze, seed'e veya
rapora veri besleyemez (docs/workflow.md, veri gerçekliği sözleşmesi). Ana giriş
noktasından bilerek dışa verilmez ve `tools/dependency-boundaries.test.ts` bunu
denetler.

Hazır kenar durumları: `BLIND_HOST` (sinyal hiç okunamıyor), `PARTIAL_TRACE`
(iz var, `session_end` yok), `CRASHED_SESSION`, `START_FAILS`.
