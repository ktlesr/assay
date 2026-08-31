/**
 * @assay/runner — sandbox koşumu, adaptör arayüzü, kayıt katmanı, yerel store.
 *
 * Sahte adaptör bilerek buradan dışa verilmez; `@assay/runner/testing` altında.
 * Veri gerçekliği sözleşmesi gereği yalnızca test aracıdır.
 */

export type { HostAdapter, AgentSession, RunConfig, SessionResult } from './adapter.js'

export {
  runSuite,
  suiteHash,
  pinsOf,
  type RunOptions,
  type ProgressEvent,
} from './run.js'

export {
  createWorkspace,
  destroyWorkspace,
  snapshot,
  captureFiles,
  envDiff,
  type Workspace,
  type Snapshot,
} from './sandbox.js'

export {
  RunStore,
  parseStored,
  STORE_VERSION,
  type StoredRun,
  type StoreOptions,
} from './store.js'
