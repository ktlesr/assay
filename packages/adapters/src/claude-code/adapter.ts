/**
 * Claude Code adaptörü.
 *
 * 0.6 fizibilite raporunun bulgularını uygular:
 *  - Her koşum kendi geçici `CLAUDE_CONFIG_DIR`'ında yürür; kullanıcının global
 *    skill'leri devreye girmez (izole edilmemiş bir probe koşumunda 119 skill
 *    aktifti ve hedef skill hiç tetiklenmedi).
 *  - Test edilen skill `--plugin-dir` ile yalnızca o oturuma yüklenir.
 *  - Tetiklenme yalnızca `Skill` araç çağrısından okunur; metinden çıkarım yok.
 *  - `subtype: "success"` tek başına tamamlama kanıtı sayılmaz. Kimliği
 *    olmayan bir koşum `success` + `cost: 0` raporlamıştı; çapraz kontrol şart.
 *  - Sistem promptu hash'i host tarafından verilmiyor. Türetilen hash
 *    `environmentHash` adıyla döner, `systemPromptHash` boş kalır.
 */

import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { delimiter, isAbsolute, join } from 'node:path'
import { tmpdir } from 'node:os'
import type {
  AgentSession,
  HostAdapter,
  RunConfig,
  SessionResult,
  TraceEvent,
  TriggerObservation,
} from '@assay/core'
import { parseSession, parseStreamJson, type ParsedStream } from './stream.js'

export interface ClaudeCodeSession extends AgentSession {
  /** Suite'teki `target.skill` — tetiklenme bununla eşleştirilir. */
  readonly targetSkill: string
  readonly parsed: ParsedStream
  readonly exitCode: number | null
  readonly latencyMs: number
  readonly stderr: string
  /** Koşum hiç başlayamadıysa nedeni. */
  readonly spawnError?: string
  readonly configDir: string
}

export interface ClaudeCodeAdapterOptions {
  /** `claude` çalıştırılabiliri. Varsayılan: PATH'teki `claude`. */
  binary?: string
  /**
   * Kimlik bilgisi. Verilmezse `process.env`'deki
   * `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY` kullanılır.
   * İzole config dizini OAuth oturumunu devralmaz, bu yüzden biri şart.
   */
  credentials?: { oauthToken?: string; apiKey?: string }
  /** Varsayılan attempt zaman aşımı. */
  timeoutMs?: number
  /** Geçici config dizinleri koşumdan sonra silinsin mi. Hata ayıklarken false. */
  cleanup?: boolean
}

/**
 * `claude` çalıştırılabilirini PATH üzerinde çözer.
 *
 * Neden: Windows'ta Node 22 `.cmd` dosyalarını kabuk olmadan spawn etmiyor
 * (CVE-2024-27980), kabuk kullanınca da çok satırlı argümanlar bozuluyor.
 * Claude Code yerel bir `.exe` dağıttığı için tam yolu bulup doğrudan spawn
 * etmek her iki sorunu da ortadan kaldırıyor. `.exe` bulunamazsa kabuğa
 * düşülür ve bu durum `shell` bayrağıyla bildirilir.
 */
export function resolveBinary(binary: string): { command: string; shell: boolean } {
  if (process.platform !== 'win32') return { command: binary, shell: false }
  if (isAbsolute(binary) && existsSync(binary)) return { command: binary, shell: false }

  const dirs = (process.env['PATH'] ?? '').split(delimiter).filter(Boolean)
  for (const dir of dirs) {
    for (const extension of ['.exe', '.com']) {
      const candidate = join(dir, `${binary}${extension}`)
      if (existsSync(candidate)) return { command: candidate, shell: false }
    }
  }
  // Yalnızca .cmd/.bat varsa kabuk şart; çok satırlı istem stdin'den gider.
  return { command: binary, shell: true }
}

export class ClaudeCodeAdapter implements HostAdapter<ClaudeCodeSession> {
  readonly id = 'claude-code'

  readonly #binary: string
  readonly #credentials: { oauthToken?: string; apiKey?: string } | undefined
  readonly #timeoutMs: number
  readonly #cleanup: boolean

  constructor(options: ClaudeCodeAdapterOptions = {}) {
    this.#binary = options.binary ?? 'claude'
    this.#credentials = options.credentials
    this.#timeoutMs = options.timeoutMs ?? 600_000
    this.#cleanup = options.cleanup ?? true
  }

  async start(config: RunConfig): Promise<ClaudeCodeSession> {
    const configDir = await mkdtemp(join(tmpdir(), 'assay-cc-'))
    const startedAt = new Date().toISOString()
    const began = Date.now()

    // İstem argüman olarak değil stdin'den gider: uzun istemler ARG_MAX'e
    // takılmasın, çok satırlı istemler kabuk tarafından bozulmasın.
    const args = [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      '--model',
      config.model,
      '--permission-mode',
      'dontAsk',
      '--plugin-dir',
      config.skill.path,
    ]

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      // İzolasyon: kullanıcının skill'leri, plugin'leri ve CLAUDE.md'si devrede olmasın.
      CLAUDE_CONFIG_DIR: configDir,
    }
    const oauth = this.#credentials?.oauthToken ?? process.env['CLAUDE_CODE_OAUTH_TOKEN']
    const apiKey = this.#credentials?.apiKey ?? process.env['ANTHROPIC_API_KEY']
    if (oauth !== undefined && oauth !== '') env['CLAUDE_CODE_OAUTH_TOKEN'] = oauth
    if (apiKey !== undefined && apiKey !== '') env['ANTHROPIC_API_KEY'] = apiKey

    const spawned = await run(this.#binary, args, {
      cwd: config.workdir,
      env,
      timeoutMs: config.timeoutMs ?? this.#timeoutMs,
      stdin: config.prompt,
    })

    const parsed = parseSession(parseStreamJson(spawned.stdout))

    return {
      id: `${this.id}-${config.caseId}-${config.attempt}-${parsed.init?.sessionId ?? began}`,
      adapter: this.id,
      startedAt,
      targetSkill: config.skill.name,
      parsed,
      exitCode: spawned.exitCode,
      latencyMs: Date.now() - began,
      stderr: spawned.stderr,
      ...(spawned.error === undefined ? {} : { spawnError: spawned.error }),
      configDir,
    }
  }

  /**
   * Tetiklenme sinyali.
   *
   * Okunabilir olması için oturumun *gerçekten koştuğunu* bilmek gerekiyor:
   * kimliği olmayan bir koşum `Skill` çağrısı üretmez ve bu, "tetiklenmedi"
   * ile karıştırılamaz. Bu yüzden çapraz kontrol düşerse sinyal okunamamış
   * sayılır.
   */
  async readTriggerSignal(session: ClaudeCodeSession): Promise<TriggerObservation> {
    const problem = sessionProblem(session)
    if (problem !== null) return { available: false, reason: problem }

    const { init, triggeredSkills } = session.parsed
    if (init === undefined) {
      return {
        available: false,
        reason:
          'the stream carried no system/init event, so the active skill set is unknown',
      }
    }

    return {
      available: true,
      triggered: triggeredSkills.some((skill) =>
        skillMatches(skill, session.targetSkill),
      ),
      skills: [...new Set(triggeredSkills)],
      // Model tarafından seçilen her skill çağrısı Skill aracından geçer, ve
      // init aktif skill setinin tamamını verir; liste eksik değil.
      complete: true,
      via: 'Skill tool call in stream-json',
    }
  }

  async readTrace(
    session: ClaudeCodeSession,
  ): Promise<readonly TraceEvent[] | undefined> {
    if (session.spawnError !== undefined) return undefined
    if (session.parsed.trace.length === 0 && session.parsed.result === undefined) {
      return undefined // akış hiç gelmedi; boş iz "araç çağrılmadı" demek olurdu
    }
    return session.parsed.trace
  }

  async finalize(session: ClaudeCodeSession): Promise<SessionResult> {
    if (this.#cleanup) {
      await rm(session.configDir, { recursive: true, force: true }).catch(() => undefined)
    }

    const { result, init } = session.parsed
    const problem = sessionProblem(session)

    const base: SessionResult = {
      outcome: problem !== null ? 'error' : 'completed',
      finishedAt: new Date().toISOString(),
      latencyMs: session.latencyMs,
      ...(session.exitCode === null ? {} : { exitCode: session.exitCode }),
      ...(init === undefined ? {} : { activeSkills: init.skills }),
      ...(init === undefined ? {} : { environmentHash: environmentHash(init) }),
    }

    if (result === undefined) return base

    const cost =
      result.inputTokens > 0 || result.outputTokens > 0 || result.costUsd !== undefined
        ? {
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            ...(result.costUsd === undefined ? {} : { usd: result.costUsd }),
          }
        : undefined

    return {
      ...base,
      outcome:
        problem !== null
          ? 'error'
          : result.isError
            ? 'error'
            : result.terminalReason !== undefined && result.terminalReason !== 'completed'
              ? 'aborted'
              : 'completed',
      ...(result.durationMs === undefined ? {} : { latencyMs: result.durationMs }),
      ...(cost === undefined ? {} : { cost }),
    }
    // systemPromptHash bilerek yok: host vermiyor, uydurulmaz.
  }
}

// ---------------------------------------------------------------------------
// Çapraz kontrol
// ---------------------------------------------------------------------------

/**
 * Oturum gerçekten koştu mu?
 *
 * Host iyimser davranıyor: kimliği olmayan bir koşum `subtype: "success"`,
 * `is_error: false`, `cost: 0` raporladı ve hiç gerçekleşmemişti. Bu kontrol
 * o yalanı yakalar. `null` dönerse oturum sağlam.
 */
function sessionProblem(session: ClaudeCodeSession): string | null {
  if (session.spawnError !== undefined) {
    return `the host process could not be started: ${session.spawnError}`
  }
  const { result } = session.parsed
  if (result === undefined) {
    return 'the stream carried no result event, so it is unknown how the session ended'
  }
  if (result.isError) {
    return `the host reported an error: ${(result.text ?? '').slice(0, 200) || result.subtype}`
  }
  if (result.numTurns === 0) {
    return 'the session reported zero turns: nothing was actually run'
  }
  if (result.outputTokens === 0) {
    return `the session produced no output tokens, so it did not really run (${(result.text ?? '').slice(0, 200)})`
  }
  if (result.terminalReason !== undefined && result.terminalReason !== 'completed') {
    return `the session ended as "${result.terminalReason}"`
  }
  return null
}

/**
 * Gözlenen skill adı hedefle eşleşiyor mu?
 *
 * Claude Code plugin'den gelen skill'leri `plugin:skill` biçiminde de
 * raporlayabiliyor (gerçek transkriptlerde `impeccable:impeccable` görüldü).
 * Karşılaştırma bu ad alanını hesaba katar; başka hiçbir gevşetme yapılmaz.
 */
export function skillMatches(observed: string, target: string): boolean {
  if (observed === target) return true
  const colon = observed.lastIndexOf(':')
  return colon !== -1 && observed.slice(colon + 1) === target
}

/**
 * `init` alanlarından deterministik ortam hash'i.
 *
 * Bu **sistem promptu hash'i değildir** — iki farklı sistem promptu aynı init
 * alanlarını üretebilir. Yine de gerçek bir kayma detektörü: model, sürüm,
 * araç seti, skill seti veya output style değişirse hash değişir.
 */
export function environmentHash(init: NonNullable<ParsedStream['init']>): string {
  const canonical = JSON.stringify({
    model: init.model,
    version: init.version,
    outputStyle: init.outputStyle,
    tools: [...init.tools].sort(),
    skills: [...init.skills].sort(),
    agents: [...init.agents].sort(),
    plugins: init.plugins.map((p) => `${p.name}@${p.version ?? ''}`).sort(),
  })
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`
}

// ---------------------------------------------------------------------------
// Süreç
// ---------------------------------------------------------------------------

/** Kabuğa düşüldüğünde argümanları korur. İstem zaten stdin'den gidiyor. */
const shellQuote = (value: string) =>
  /[\s"]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value

interface SpawnResult {
  stdout: string
  stderr: string
  exitCode: number | null
  error?: string
}

function run(
  binary: string,
  args: readonly string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; timeoutMs: number; stdin: string },
): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const { command, shell } = resolveBinary(binary)
    const child = spawn(command, shell ? args.map(shellQuote) : [...args], {
      cwd: options.cwd,
      env: options.env,
      shell,
      windowsHide: true,
    })

    child.stdin?.on('error', () => undefined) // süreç erken ölürse EPIPE
    child.stdin?.end(options.stdin)

    let stdout = ''
    let stderr = ''
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill('SIGKILL')
      resolve({
        stdout,
        stderr,
        exitCode: null,
        error: `timed out after ${options.timeoutMs}ms`,
      })
    }, options.timeoutMs)

    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => (stdout += chunk))
    child.stderr?.on('data', (chunk: string) => (stderr += chunk))

    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ stdout, stderr, exitCode: null, error: error.message })
    })

    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ stdout, stderr, exitCode: code })
    })
  })
}
