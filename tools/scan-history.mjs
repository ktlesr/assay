/**
 * Geçmiş taraması — deponun tamamı, her commit'teki her blob.
 *
 * tools/secrets.test.ts yalnızca HEAD'de takip edilen dosyalara bakıyor.
 * Depo public olduğuna göre asıl soru şu: geçmişte bir an için commit'lenip
 * sonra silinmiş bir sır var mı? Silinmiş dosya HEAD'de görünmez ama
 * `git log -p` ile herkes tarafından okunabilir.
 *
 * Elle çalıştırılır: `node tools/scan-history.mjs`
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { SECRET_PATTERNS } from './secret-patterns.mjs'

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })

// Deponun tarihindeki tüm nesneler; `--objects` blob'ları yollarıyla verir.
const listing = git(['rev-list', '--objects', '--all'])
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const sp = line.indexOf(' ')
    return sp === -1 ? null : { sha: line.slice(0, sp), path: line.slice(sp + 1) }
  })
  .filter(Boolean)

console.log(`geçmişte ${listing.length} yollu nesne taranıyor...`)

// Aynı içerik birden çok commit'te aynı sha'ya sahip; bir kez taramak yeter.
const seen = new Set()
const findings = []
const envPaths = []
let scanned = 0

for (const { sha, path } of listing) {
  const base = path.split('/').pop()
  if (base === '.env' || (base.startsWith('.env.') && base !== '.env.example')) {
    envPaths.push(`${path} (${sha.slice(0, 8)})`)
  }
  if (base === '.npmrc') envPaths.push(`${path} (${sha.slice(0, 8)})`)

  if (seen.has(sha)) continue
  seen.add(sha)

  // Desen tanımlarının kendisi taramadan muaf; yoksa her koşumda kendini bulur.
  if (path.endsWith('secret-patterns.mjs') || path.endsWith('secrets.test.ts')) continue

  const res = spawnSync('git', ['cat-file', 'blob', sha], {
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (res.status !== 0 || !res.stdout) continue
  if (res.stdout.includes(0)) continue // ikili

  const content = res.stdout.toString('utf8')
  scanned += 1
  const lines = content.split(/\r?\n/)
  for (const [label, pattern] of SECRET_PATTERNS) {
    for (const [i, line] of lines.entries()) {
      if (pattern.test(line)) {
        findings.push(`${path}@${sha.slice(0, 8)}:${i + 1}: ${label}`)
        break
      }
    }
  }
}

console.log(`${scanned} benzersiz metin blob'u tarandı.\n`)

if (envPaths.length > 0) {
  console.log('geçmişte görülen env/npmrc yolları:')
  for (const p of new Set(envPaths)) console.log(`   ${p}`)
  console.log()
}

if (findings.length > 0) {
  console.error('SIR BULUNDU — geçmişte:\n')
  for (const f of findings) console.error(`   ${f}`)
  console.error('\nDeğerler yazdırılmadı. Bu blob\'lar public depoda okunabilir.')
  process.exit(1)
}

console.log('temiz: geçmişte bilinen sır deseni ve env/npmrc dosyası yok.')
