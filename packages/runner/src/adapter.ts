/**
 * Host adaptör sözleşmesi.
 *
 * Bir adaptör bir **host ortamını** temsil eder, bir skill'i değil. Claude Code,
 * Codex ve Copilot ayrı adaptörlerdir; `docx` skill'i adaptör değildir.
 *
 * Sözleşmenin tek sert kuralı: **sinyal okunamadığında hata fırlatma, okunamadığını
 * söyle.** `readTriggerSignal` bir `TriggerObservation` döner ve okunamadığında
 * `{ available: false, reason }` verir. Runner bunu gördüğünde attempt'i `unknown`
 * işaretler. Tahmin yürütmek ve varsayılan üretmek yasak (docs/invariants.md #1).
 */

import type {
  CapturedFile,
  Cost,
  EnvDiff,
  SessionOutcome,
  TraceEvent,
  TriggerObservation,
} from '@assay/core'

/** Tek bir attempt'in koşum yapılandırması. */
export interface RunConfig {
  /** Hangi vaka. Kayıtlarda attempt'i vakaya bağlar. */
  caseId: string
  /** Kaçıncı tekrar, 0'dan başlar. */
  attempt: number
  /** Ajana verilecek istem. */
  prompt: string
  /** Test edilen skill ve pinlenmiş sürümü. */
  skill: { name: string; source: string }
  /** Pin 2 — tam model kimliği. */
  model: string
  /** Bu koşumda kurulu olan skill'ler. Coexistence ölçümü buna dayanır. */
  activeSkills: readonly string[]
  /** Sandbox çalışma dizini. Adaptör buranın dışına çıkmamalı. */
  workdir: string
  /** Vakanın `setup.fixtures` yolu, varsa. */
  fixtures?: string
  timeoutMs?: number
}

/**
 * Açık bir ajan oturumu. Adaptöre özgü durum taşımak için genişletilebilir;
 * runner yalnızca buradaki alanları bilir.
 */
export interface AgentSession {
  id: string
  /** Oturumu açan adaptörün kimliği. */
  adapter: string
  startedAt: string
}

/** Oturum kapandığında toplanan kanıt. */
export interface SessionResult {
  outcome: SessionOutcome
  finishedAt: string
  latencyMs: number
  /**
   * Pin 3 — host'un verdiği sistem promptunun hash'i. Host vermiyorsa yok;
   * runner bunu görünce pin eksikliğini rapor eder, uydurmaz.
   */
  systemPromptHash?: string
  exitCode?: number
  files?: readonly CapturedFile[]
  env?: EnvDiff
  cost?: Cost
}

/**
 * Bir host ortamının dört yeteneği.
 *
 * `S` adaptörün kendi oturum tipidir; runner onu opak taşır.
 */
export interface HostAdapter<S extends AgentSession = AgentSession> {
  /** Kararlı kimlik. Kayıtlara yazılır, rapor bununla gruplanır. */
  readonly id: string

  /** Oturumu açar ve istemi gönderir. */
  start(config: RunConfig): Promise<S>

  /**
   * Tetiklenme sinyalini okur.
   *
   * Okunamıyorsa **hata fırlatmaz**; `{ available: false, reason }` döner.
   * `reason` insan tarafından okunacak: hangi mekanizmanın denendiğini ve neden
   * yetmediğini söylesin.
   */
  readTriggerSignal(session: S): Promise<TriggerObservation>

  /**
   * Araç çağrısı izini okur.
   *
   * İz alınamıyorsa `undefined` döner — boş dizi "hiçbir araç çağrılmadı"
   * demektir ve bambaşka bir iddiadır.
   */
  readTrace(session: S): Promise<readonly TraceEvent[] | undefined>

  /** Oturumu kapatır ve kalan kanıtı toplar. */
  finalize(session: S): Promise<SessionResult>
}
