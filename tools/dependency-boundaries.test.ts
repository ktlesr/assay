import { readFileSync } from 'node:fs'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

/**
 * docs/stack.md'deki bağımlılık grafiği yalnızca dokümanda kalmasın diye:
 * lint kuralının gerçekten ihlal yakaladığını kanıtlarız. Kural sessizce
 * gevşetilirse bu testler kırmızıya döner.
 */
const eslint = new ESLint()

async function violations(filePath: string, code: string) {
  const [result] = await eslint.lintText(code, { filePath })
  return (result?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports')
}

const forbidden: ReadonlyArray<[string, string]> = [
  ['packages/core/src/x.ts', '@assay/runner'],
  ['packages/core/src/x.ts', '@assay/ui'],
  ['packages/runner/src/x.ts', '@assay/cli'],
  ['packages/adapters/src/x.ts', '@assay/runner'],
  ['packages/db/src/x.ts', '@assay/core'],
  ['packages/ui/src/x.ts', '@assay/core'],
  ['apps/web/app/x.tsx', '@assay/runner'],
  ['apps/web/app/x.tsx', '@assay/adapters'],
  ['apps/web/app/x.tsx', '@assay/cli'],
]

const allowed: ReadonlyArray<[string, string]> = [
  ['packages/runner/src/x.ts', '@assay/core'],
  ['packages/adapters/src/x.ts', '@assay/core'],
  ['packages/cli/src/x.ts', '@assay/runner'],
  ['packages/cli/src/x.ts', '@assay/adapters'],
  ['apps/web/app/x.tsx', '@assay/core'],
  ['apps/web/app/x.tsx', '@assay/ui'],
  ['apps/web/app/x.tsx', '@assay/db'],
]

/** core saf hesaplamadır: I/O yasağı da lint seviyesinde. */
const coreIoBans = [
  'node:fs',
  'node:crypto',
  'node:child_process',
  'fs',
  'path',
  'child_process',
  'https',
]

/** Saf hesaplama kütüphaneleri core'da serbesttir. */
const corePureDeps = ['zod', 'yaml']

describe('paket bağımlılık sınırları', () => {
  it.each(forbidden)('%s -> %s yasak', async (filePath, specifier) => {
    const found = await violations(filePath, `import '${specifier}'\n`)
    expect(
      found.length,
      `${filePath} içinde ${specifier} importu yakalanmadı`,
    ).toBeGreaterThan(0)
  })

  it.each(allowed)('%s -> %s serbest', async (filePath, specifier) => {
    expect(await violations(filePath, `import '${specifier}'\n`)).toEqual([])
  })

  it.each(coreIoBans)('core içinde %s importu yasak', async (specifier) => {
    const found = await violations('packages/core/src/x.ts', `import '${specifier}'\n`)
    expect(found.length, `${specifier} importu yakalanmadı`).toBeGreaterThan(0)
  })

  it.each(corePureDeps)('core içinde %s importu serbest', async (specifier) => {
    expect(await violations('packages/core/src/x.ts', `import '${specifier}'\n`)).toEqual(
      [],
    )
  })

  it('runner Node yerleşiklerini kullanabilir', async () => {
    expect(await violations('packages/runner/src/x.ts', `import 'node:fs'\n`)).toEqual([])
  })

  it('core hiçbir Assay paketine bağımlı değil', () => {
    const pkg = JSON.parse(readFileSync('packages/core/package.json', 'utf8')) as {
      dependencies?: Record<string, string>
    }
    const assayDeps = Object.keys(pkg.dependencies ?? {}).filter((d) =>
      d.startsWith('@assay/'),
    )
    expect(assayDeps).toEqual([])
  })
})
