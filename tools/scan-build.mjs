/**
 * Üretim derlemesinde sır taraması.
 *
 * `tools/scan-staged.mjs` commit'e gireni, `tools/scan-history.mjs` geçmişte
 * kalanı tarıyor. Bu üçüncüsü, dağıtılan şeyi tarıyor: `.next` çıktısı. Sebep
 * somut — Next `NEXT_PUBLIC_*` ile başlayan her değişkeni istemci paketine
 * gömer, ve bir sunucu bileşenine sızan bir sır statik HTML'e serileşebilir.
 *
 * Ayrıca özel olarak istemci paketlerine bakıyoruz: sunucu tarafındaki
 * `.next/server` altında bir bağlantı adresinin bulunması normal olabilir,
 * ama tarayıcıya giden `static/chunks` altında asla.
 *
 * Kullanım: node tools/scan-build.mjs [dizin]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { SECRET_PATTERNS } from './secret-patterns.mjs'

const root = process.argv[2] ?? 'apps/web/.next'

/** Tarayıcıya giden her şey. Buradaki bir sır doğrudan sızıntıdır. */
const CLIENT_DIRS = ['static']

/** Metin olarak taranacak uzantılar. */
const TEXT = /\.(js|mjs|cjs|json|html|css|txt|map)$/

/**
 * Derleme sırasında ortamda bulunan gerçek değerler.
 *
 * Şema eşleştirmek (`postgres://...` aramak) yanlış pozitif üretiyor: Prisma'nın
 * kendi paketinde `postgres://base` gibi yer tutucular var ve her koşumda
 * kırmızı veren bir tarayıcı görmezden gelinmeyi öğretir. Bunun yerine
 * ortamdaki DEĞERİN kendisini arıyoruz — eşleşirse sızıntı kesin, eşleşmezse
 * şüphe yok.
 */
const ENV_TO_CHECK = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'AUTH_GOOGLE_SECRET',
  'AUTH_GOOGLE_ID',
  'NPM_TOKEN',
  'CLAUDE_CODE_OAUTH_TOKEN',
  'ANTHROPIC_API_KEY',
  'POSTGRES_PASSWORD',
]

/** Kısa veya boş değerler aranmaz: rastgele eşleşir ve gürültü üretir. */
const liveSecrets = ENV_TO_CHECK.map((name) => [name, process.env[name]]).filter(
  ([, value]) => typeof value === 'string' && value.trim().length >= 12,
)

function walk(dir) {
  let out = []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) out = out.concat(walk(full))
    else if (TEXT.test(name)) out.push(full)
  }
  return out
}

const files = walk(root)
if (files.length === 0) {
  console.error(`::error::${root} altında taranacak dosya yok — derleme yapıldı mı?`)
  process.exit(1)
}

const findings = []
for (const file of files) {
  const rel = relative(root, file).split('\\').join('/')
  const isClient = CLIENT_DIRS.some((d) => rel.startsWith(d + '/'))
  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  for (const [label, pattern] of SECRET_PATTERNS) {
    if (pattern.test(content)) findings.push({ rel, label, isClient })
  }
  for (const [name, value] of liveSecrets) {
    if (content.includes(value)) {
      findings.push({ rel, label: `${name} değeri derlemeye gömülmüş`, isClient })
    }
  }
}

console.log(
  `${files.length} dosya tarandı (${root}); ` +
    `${liveSecrets.length} canlı ortam değeri karşılaştırıldı.`,
)
if (liveSecrets.length === 0) {
  console.log(
    'not: ortamda karşılaştırılacak sır yoktu — bu tarama yalnızca desen eşleşmesi yaptı.',
  )
}

if (findings.length === 0) {
  console.log('temiz: derlemede bilinen sır deseni veya bağlantı adresi yok.')
  process.exit(0)
}

// Değerler asla yazdırılmıyor; yalnızca dosya ve desen adı.
console.error('\nSIR BULUNDU — üretim derlemesinde:\n')
for (const f of findings) {
  console.error(`   ${f.isClient ? '[İSTEMCİ] ' : '[sunucu]  '}${f.rel}: ${f.label}`)
}
console.error('\nDeğerler yazdırılmadı. İstemci paketindeki bir bulgu doğrudan sızıntıdır.')
process.exit(1)
