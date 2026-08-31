/**
 * @assay/core — şema tipleri, kanonik kayıt, assertion motoru, skorlama.
 *
 * Bu paket hiçbir şeye bağımlı değildir: I/O yok, ağ yok, dosya sistemi yok.
 * Kural eslint.config.js içinde makine seviyesinde zorlanır.
 */

/** Değişmez #1: verdict üç durumludur. Sinyal alınamadıysa `unknown`. */
export type Verdict = 'pass' | 'fail' | 'unknown'
