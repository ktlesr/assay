/**
 * @assay/runner — sandbox koşumu, adaptör arayüzü, kayıt katmanı, yerel store.
 *
 * MockAdapter bilerek buradan dışa verilmez; `@assay/runner/testing` altındadır.
 * Veri gerçekliği sözleşmesi gereği sahte adaptör yalnızca test aracıdır.
 */

export type { HostAdapter, AgentSession, RunConfig, SessionResult } from './adapter.js'
