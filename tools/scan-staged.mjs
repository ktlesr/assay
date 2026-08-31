/**
 * Pre-commit sır taraması.
 *
 * Staged içeriği tarar; bilinen bir sır deseni bulursa commit'i reddeder.
 * Sırrın değerini asla yazdırmaz — yalnızca dosya, satır ve desen adı.
 *
 * .githooks/pre-commit tarafından çağrılır.
 */
import { execFileSync } from 'node:child_process'
import { SCAN_EXEMPT, SECRET_PATTERNS } from './secret-patterns.mjs'

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
  .split(/\r?\n/)
  .filter(Boolean)

if (staged.length === 0) process.exit(0)

const problems = []

// .env ve türevleri hiçbir koşulda commit'lenmez (.env.example hariç).
for (const file of staged) {
  const name = file.split('/').pop() ?? file
  if (name === '.env' || (name.startsWith('.env.') && name !== '.env.example')) {
    problems.push(`${file}: env dosyaları commit'lenemez`)
  }
}

for (const file of staged) {
  if (SCAN_EXEMPT.includes(file)) continue
  let content
  try {
    content = git(['show', `:${file}`])
  } catch {
    continue // ikili veya okunamayan
  }
  const lines = content.split(/\r?\n/)
  for (const [label, pattern] of SECRET_PATTERNS) {
    for (const [index, line] of lines.entries()) {
      if (pattern.test(line)) {
        problems.push(`${file}:${index + 1}: ${label}`)
        break
      }
    }
  }
}

if (problems.length > 0) {
  console.error('\n✖ Commit reddedildi — staged içerikte sır bulundu:\n')
  for (const problem of problems) console.error(`   ${problem}`)
  console.error(
    '\n  Gerçek değerler .env dosyasına gider (.gitignore kapsamında),',
    '\n  şablona değil. Düzelt ve tekrar dene.\n',
  )
  process.exit(1)
}
