/**
 * Yayımlanacak tarball'ın içine ne girdiğini kanıtlar.
 *
 * Yayın öncesi kod incelemesi yeterli değil: `files` alanı doğru görünürken
 * dist'te geliştirme build'inden kalmış bir test dosyası durabilir. Bu betik
 * paketleri gerçekten paketler, içeriği listeler ve yasaklı bir şey bulursa
 * sıfırdan farklı kodla çıkar.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { gunzipSync } from 'node:zlib'

const PACKAGES = ['core', 'runner', 'adapters', 'cli']

/** Tarball'da bulunması bir hata olan yollar. */
const FORBIDDEN = [
  { re: /\.test\.(js|ts|d\.ts)$/, why: 'test dosyası' },
  { re: /\.map$/, why: 'source/declaration map' },
  { re: /(^|\/)src\//, why: 'kaynak dizini' },
  { re: /(^|\/)\.env/, why: 'ortam dosyası' },
  { re: /\.tsbuildinfo$/, why: 'derleme önbelleği' },
  { re: /(^|\/)\.npmrc$/, why: 'npm kimlik bilgisi' },
  { re: /\.(pem|key)$/, why: 'anahtar dosyası' },
  { re: /(^|\/)node_modules\//, why: 'bağımlılık' },
]

/** Tarball'da olmaması bir hata olan yollar. */
const REQUIRED = [
  'package/LICENSE',
  'package/NOTICE',
  'package/README.md',
  'package/CHANGELOG.md',
]

/** NUL ile doldurulmuş sabit genişlikli tar başlık alanını okur. */
const field = (buf, from, to) => buf.toString('utf8', from, to).split('\0')[0].trim()

/**
 * Tarball içeriğini listeler. `tar` komutuna kabuk açmak yerine zlib ile
 * çözüp 512 baytlık başlıkları yürüyor: Windows'ta GNU tar `C:\...` yolunu
 * uzak sunucu adresi sanıyor ve denetim hiç koşamıyordu.
 */
function listTar(file) {
  const buf = gunzipSync(readFileSync(file))
  const names = []
  for (let off = 0; off + 512 <= buf.length; ) {
    const name = field(buf, off, off + 100)
    if (!name) break
    const size = parseInt(field(buf, off + 124, off + 136) || '0', 8)
    const type = field(buf, off + 156, off + 157)
    if (type === '0' || type === '') names.push(name)
    off += 512 + Math.ceil(size / 512) * 512
  }
  return names
}

const out = mkdtempSync(join(tmpdir(), 'assay-pack-'))
const run = (args, cwd) =>
  execFileSync('pnpm', args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })

let failed = false
const rows = []

for (const name of PACKAGES) {
  const dir = join(process.cwd(), 'packages', name)
  // ASSAY_PACK_NO_BUILD: dist'i olduğu gibi denetle. Denetimin gerçekten
  // yakaladığını kanıtlamak ve CI'da build'i iki kez koşmamak için.
  if (!process.env.ASSAY_PACK_NO_BUILD) run(['run', 'build:publish'], dir)

  // pnpm pack son satırda üretilen tarball'ın tam yolunu yazar.
  const path = run(['pack', '--pack-destination', out], dir).trim().split('\n').pop().trim()
  const entries = listTar(path).filter((l) => !l.endsWith('/'))

  const problems = []
  for (const entry of entries) {
    const hit = FORBIDDEN.find((f) => f.re.test(entry))
    if (hit) problems.push(`  x ${entry} — ${hit.why}`)
  }
  for (const req of REQUIRED) {
    if (!entries.includes(req)) problems.push(`  x eksik: ${req}`)
  }

  const kb = (statSync(path).size / 1024).toFixed(1)
  const file = basename(path)
  rows.push({ file, entries, problems, kb })

  console.log(`\n=== ${file} — ${kb} KB, ${entries.length} dosya ===`)
  for (const entry of entries) console.log(`  ${entry}`)
  console.log(problems.length ? problems.join('\n') : '  ok — yasaklı içerik yok, LICENSE/NOTICE/README var')
  if (problems.length) failed = true
}

console.log('\n--- ozet ---')
for (const r of rows) {
  console.log(`${r.kb.padStart(7)} KB  ${String(r.entries.length).padStart(3)} dosya  ${r.file}`)
}
console.log(`\ntarball dizini: ${out}`)

if (failed) {
  console.error('\nPAKETLEME DENETIMI BASARISIZ')
  process.exit(1)
}
if (!process.env.ASSAY_KEEP_TARBALLS) rmSync(out, { recursive: true, force: true })
