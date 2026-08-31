/**
 * Kimlik bilgisi denetimi — sırrın değerini asla yazdırmaz.
 *
 * .env dosyasını okur, hangi kimlik bilgilerinin dolu olduğunu söyler ve
 * Claude Code için izole bir koşumun gerçekten kimlik doğrulayıp
 * doğrulamadığını sınar.
 *
 * Kullanım: node tools/check-auth.mjs
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ENV_FILE = '.env'

function loadEnv(file) {
  if (!existsSync(file)) return {}
  const out = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (match === null) continue
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    if (value !== '') out[match[1]] = value
  }
  return out
}

const env = loadEnv(ENV_FILE)
const fingerprint = (value) =>
  value === undefined ? 'yok' : `var (${value.length} karakter, ...${value.slice(-4)})`

console.log(`${ENV_FILE}: ${existsSync(ENV_FILE) ? 'bulundu' : 'YOK'}`)
for (const key of ['CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_API_KEY', 'CODEX_API_KEY']) {
  console.log(`  ${key}: ${fingerprint(env[key])}`)
}

const claudeCred = env['CLAUDE_CODE_OAUTH_TOKEN'] ?? env['ANTHROPIC_API_KEY']
if (claudeCred === undefined) {
  console.log('\nClaude Code kimlik bilgisi yok; izole koşum sınanmadı.')
  process.exit(0)
}

// İzole config dizini: kullanıcının 119 skill'i devreye girmesin.
const configDir = mkdtempSync(join(tmpdir(), 'assay-auth-'))
console.log(`\nİzole koşum sınanıyor (CLAUDE_CONFIG_DIR=${configDir})...`)

// Windows'ta Node 22 .cmd/.bat dosyalarını shell olmadan spawn etmeyi reddediyor
// (CVE-2024-27980). Kabuk üzerinden geçmek gerekiyor; argümanlar bu yüzden
// tırnaklanıyor.
const isWindows = process.platform === 'win32'
const child = spawnSync(
  'claude',
  [
    '-p',
    isWindows ? '"Reply with exactly: AUTH_OK"' : 'Reply with exactly: AUTH_OK',
    '--output-format',
    'json',
    '--model',
    'claude-haiku-4-5-20251001',
    '--permission-mode',
    'dontAsk',
    '--disallowed-tools',
    isWindows ? '"Bash Write Edit Artifact"' : 'Bash Write Edit Artifact',
  ],
  {
    env: { ...process.env, ...env, CLAUDE_CONFIG_DIR: configDir },
    encoding: 'utf8',
    timeout: 300_000,
    shell: isWindows,
    windowsVerbatimArguments: false,
  },
)

rmSync(configDir, { recursive: true, force: true })

if (child.error) {
  console.log(`Koşum başlatılamadı: ${child.error.message}`)
  process.exit(1)
}

let result
try {
  result = JSON.parse(child.stdout)
} catch {
  console.log('Çıktı JSON değil:', String(child.stdout).slice(0, 300))
  process.exit(1)
}

const text = String(result.result ?? '')
// docs/host-feasibility.md: subtype "success" tek başına kanıt değil.
const reallyRan =
  result.subtype === 'success' &&
  result.is_error === false &&
  (result.usage?.output_tokens ?? 0) > 0 &&
  (result.num_turns ?? 0) > 0

console.log(`  subtype=${result.subtype} is_error=${result.is_error}`)
console.log(
  `  num_turns=${result.num_turns} output_tokens=${result.usage?.output_tokens ?? 0} cost=${result.total_cost_usd}`,
)
console.log(`  yanıt: ${text.slice(0, 80).replace(/\n/g, ' ')}`)
console.log(
  reallyRan
    ? '\n✅ İzole koşum kimlik doğruladı ve gerçekten çalıştı. 1.1 için hazır.'
    : '\n❌ Koşum gerçekleşmedi (çapraz kontrol düştü). Kimlik bilgisini gözden geçir.',
)
process.exit(reallyRan ? 0 : 1)
