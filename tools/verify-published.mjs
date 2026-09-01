/**
 * Yayın sonrası doğrulama.
 *
 * changesets'in "yayımladım" demesi bir iddia; registry'den okumak kanıt.
 * Bu proje host'un başarı bildirimine de aynı sebeple güvenmiyor
 * (packages/adapters, `finalize` çapraz kontrolü).
 *
 * .github/workflows/release.yml tarafından, yalnızca gerçekten yayın
 * yapıldığında çağrılır. PUBLISHED_PACKAGES changesets'in çıktısıdır:
 * [{ name, version }, ...]
 */
import { execFileSync } from 'node:child_process'

const raw = process.env.PUBLISHED_PACKAGES
if (!raw) {
  console.error('::error::PUBLISHED_PACKAGES boş — doğrulanacak bir şey bildirilmedi')
  process.exit(1)
}

const packages = JSON.parse(raw)
if (!Array.isArray(packages) || packages.length === 0) {
  console.error('::error::PUBLISHED_PACKAGES boş liste — yayın bildirildi ama paket yok')
  process.exit(1)
}

let missing = 0

for (const { name, version } of packages) {
  const spec = `${name}@${version}`
  try {
    // `npm view` yayımlanmamış bir sürümde sıfırdan farklı kodla çıkar.
    // Windows'ta `npm` bir .cmd; Node 22 onu kabuk olmadan spawn etmiyor
    // (CVE-2024-27980). CI ubuntu'da kabuk kullanılmıyor.
    const found = execFileSync('npm', ['view', spec, 'version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    }).trim()

    if (found === version) {
      console.log(`ok ${spec}`)
    } else {
      console.error(`::error::${spec} bekleniyordu, registry ${found} diyor`)
      missing += 1
    }
  } catch {
    console.error(`::error::${spec} registry'de bulunamadı — yayın eksik kalmış olabilir`)
    missing += 1
  }
}

if (missing > 0) {
  console.error(
    `\n${missing} paket doğrulanamadı. Kısmi yayın olabilir: pnpm publish zaten ` +
      `registry'de olan sürümleri atlar, bu yüzden düzeltme yolu iş akışını ` +
      `yeniden koşmaktır. Ayrıntı: docs/operations.md`,
  )
  process.exit(1)
}

console.log(`\n${packages.length} paketin hepsi registry'de doğrulandı.`)
