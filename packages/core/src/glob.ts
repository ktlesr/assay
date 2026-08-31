/**
 * Glob → RegExp. `out/*.docx`, `**\/*.json`, `report-?.pdf`.
 *
 * ponytail: `*`, `**`, `?` ve karakter sınıfı yok — süslü parantez genişletmesi
 * (`{a,b}`) ve extglob desteklenmez. Bir suite bunlara ihtiyaç duyarsa
 * picomatch eklenir; o güne kadar 30 satır, sıfır bağımlılık.
 */

const SPECIAL = /[.+^$()|[\]\\{}]/g

/**
 * `**` bir veya daha fazla segmenti, `*` tek segmentin bir parçasını, `?` tek
 * karakteri karşılar. Ayırıcı her zaman `/`.
 */
export function globToRegExp(pattern: string): RegExp {
  let out = ''
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i]
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        // `a/**/b` → aradaki dizinler opsiyonel; `**` sondaysa her şeyi yutar.
        const followedBySlash = pattern[i + 2] === '/'
        out += followedBySlash ? '(?:.*/)?' : '.*'
        i += followedBySlash ? 2 : 1
      } else {
        out += '[^/]*'
      }
      continue
    }
    if (char === '?') {
      out += '[^/]'
      continue
    }
    out += (char ?? '').replace(SPECIAL, '\\$&')
  }
  return new RegExp(`^${out}$`)
}

/** Yolu normalize eder: `./a//b` → `a/b`. Ters bölü de ayırıcı sayılır. */
export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/$/, '')
}

export function matchGlob(pattern: string, path: string): boolean {
  return globToRegExp(normalizePath(pattern)).test(normalizePath(path))
}

/** Bir yolun verilen dizin öneklerinden birinin altında olup olmadığı. */
export function isWithin(prefixes: readonly string[], path: string): boolean {
  const target = normalizePath(path)
  return prefixes.some((raw) => {
    const prefix = normalizePath(raw)
    if (prefix === '' || prefix === '.') return true
    return target === prefix || target.startsWith(`${prefix}/`)
  })
}
