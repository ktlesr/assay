import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * Paketler arası bağımlılık sınırı — docs/stack.md'deki grafiğin makine
 * seviyesinde zorlanmış hâli. Bu kural iyi niyete bırakılmaz; tools/dependency-boundaries.test.ts
 * kuralın gerçekten ihlal yakaladığını kanıtlar.
 *
 *   core     -> hiçbir şey
 *   runner   -> core
 *   adapters -> core
 *   cli      -> core, runner, adapters
 *   db, ui   -> hiçbir şey
 *   web      -> core, db, ui        (runner/adapters/cli ASLA)
 */
const boundary = (dir, allowed, why, extraPatterns = []) => ({
  files: [`${dir}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@assay/*', ...allowed.map((p) => `!@assay/${p}`)],
            message: why,
          },
          ...extraPatterns,
        ],
      },
    ],
  },
})

/**
 * core saf hesaplamadır: dosya sistemi, ağ, süreç yok. Zod ve yaml gibi saf
 * kütüphaneler serbest; Node yerleşikleri değil. Bu, "core tarayıcıda da aynı
 * davranır" iddiasını iyi niyete bırakmamak için.
 */
const NO_IO = [
  {
    group: [
      'node:*',
      'fs',
      'fs/*',
      'path',
      'os',
      'net',
      'http',
      'https',
      'child_process',
      'worker_threads',
      'crypto',
      'dns',
      'tls',
      'stream',
      'zlib',
    ],
    message:
      'core I/O yapmaz: dosya sistemi, ağ, süreç ve Node yerleşikleri burada kullanılamaz (docs/stack.md).',
  },
]

export const boundaries = [
  boundary(
    'packages/core',
    [],
    'core hiçbir Assay paketine bağımlı olamaz: saf TypeScript.',
    NO_IO,
  ),
  boundary('packages/runner', ['core'], 'runner yalnızca core’a bağlanabilir.'),
  boundary('packages/adapters', ['core'], 'adapters yalnızca core’a bağlanabilir.'),
  boundary(
    'packages/cli',
    ['core', 'runner', 'adapters'],
    'cli yalnızca core, runner ve adapters’a bağlanabilir.',
  ),
  boundary('packages/db', [], 'db bağımsızdır: başka bir Assay paketine bağlanamaz.'),
  boundary('packages/ui', [], 'ui bağımsızdır: başka bir Assay paketine bağlanamaz.'),
  boundary(
    'apps/web',
    ['core', 'db', 'ui'],
    'web ölçmez, hatırlar: runner/adapters/cli’a bağlanamaz (docs/product.md).',
  ),
]

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      'tools/fixtures/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...boundaries,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { projectService: false } },
  },
  {
    // tools/ altındaki script'ler Node'da koşan araçlardır, kütüphane değil.
    files: ['tools/**/*.{mjs,js}'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly' },
    },
  },
)
