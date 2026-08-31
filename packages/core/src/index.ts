/**
 * @assay/core — şema tipleri, kanonik kayıt, assertion motoru, skorlama.
 *
 * Bu paket başka bir Assay paketine bağlanmaz ve I/O yapmaz: dosya sistemi,
 * ağ, süreç yok. Kural eslint.config.js içinde makine seviyesinde zorlanır.
 */

/** Değişmez #1: verdict üç durumludur. Sinyal alınamadıysa `unknown`. */
export type Verdict = 'pass' | 'fail' | 'unknown'

export {
  parseSuite,
  validateSuite,
  suiteSchema,
  FILE_FORMATS,
  TRACE_RULES,
  type Suite,
  type SuiteCase,
  type Assertion,
  type SuiteIssue,
  type SuiteParseResult,
  type TraceRule,
  type FileFormat,
} from './suite.js'
