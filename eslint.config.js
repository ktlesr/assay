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

/**
 * Kısa ad -> yayımlanan paket adı. CLI paketi `@ktlsr/assay`, yani diğerlerinin
 * `@ktlsr/assay-*` kalıbına uymuyor; bu yüzden kalıp değil açık bir tablo.
 */
const PKG = {
  core: '@ktlsr/assay-core',
  runner: '@ktlsr/assay-runner',
  adapters: '@ktlsr/assay-adapters',
  cli: '@ktlsr/assay',
  db: '@ktlsr/assay-db',
  ui: '@ktlsr/assay-ui',
}

/** Paketin kendisi ve alt yolları (`@ktlsr/assay-runner/testing` gibi). */
const withSubpaths = (name) => [name, `${name}/*`]

const boundary = (dir, allowed, why, extraPatterns = []) => ({
  files: [`${dir}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: [
              ...Object.values(PKG).flatMap(withSubpaths),
              ...allowed.flatMap((p) => withSubpaths(PKG[p]).map((g) => `!${g}`)),
            ],
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
  boundary(
    'packages/db',
    ['core'],
    'db yalnızca core’a bağlanabilir: şema kanonik kayıt tiplerinden türer.',
  ),
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
      // Ölçüm fixture'ları: kasten bozuk, tarayıcıda koşuyor; bizim kurallarımıza tabi değil.
      'examples/**/fixtures/**',
      // Prisma'nın ürettiği istemci: bizim yazmadığımız kod, bizim kurallarımıza tabi değil.
      'packages/db/generated/**',
      '**/.assay/**',
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
    files: ['tools/**/*.{mjs,js}', 'action/**/*.{mjs,js}'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly' },
    },
  },
  {
    /*
     * Ekran görüntüsü aracının bir kısmı tarayıcıda koşuyor: `addInitScript`
     * ve `evaluate` gövdeleri sayfaya enjekte ediliyor, Node'da değil. Bu
     * yüzden `document` ve `localStorage` burada gerçekten tanımlı.
     */
    files: ['tools/shoot.mjs'],
    languageOptions: {
      globals: { document: 'readonly', localStorage: 'readonly' },
    },
  },
)
