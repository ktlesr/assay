/**
 * Adaptör sözleşmesi `@ktlsr/assay-core`'da tanımlıdır; burada yeniden dışa verilir.
 *
 * Sebep: `adapters` paketi yalnızca `core`'a bağlanabilir (docs/stack.md), ama
 * sözleşmeyi uygulamak zorunda. Tipler saf olduğu için core doğru ev.
 */
export type { HostAdapter, AgentSession, RunConfig, SessionResult } from '@ktlsr/assay-core'
