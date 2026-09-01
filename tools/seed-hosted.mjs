/**
 * Hosted örneği gerçek koşumlarla doldurur.
 *
 * Uydurma veri yok (sözleşme 3): buradaki her kayıt Faz 1'de gerçek bir
 * `assay run` koşumunun çıktısıdır (`apps/web/seed/runs/`, docs/dogfooding.md).
 * Script hiçbir sayı üretmiyor — kayıtları ürünün kendi yükleme yolundan,
 * `assay push` ile geçiriyor. Yani seed, aynı zamanda push yolunun testidir.
 *
 * Koşum ile vaka seti eşleşmesi elle yazılmıyor: pin 4 (`suiteHash`) hangi
 * dosyanın kullanıldığını zaten söylüyor.
 *
 *   ASSAY_URL=http://localhost:3000 ASSAY_TOKEN=... node tools/seed-hosted.mjs
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { suiteHash } from '@ktlsr/assay-runner'

const RUN_STORE = 'apps/web/seed'
const SUITE_DIRS = ['examples', 'examples/dogfood']

if ((process.env['ASSAY_URL'] ?? '') === '' || (process.env['ASSAY_TOKEN'] ?? '') === '') {
  process.stderr.write('set ASSAY_URL and ASSAY_TOKEN first\n')
  process.exit(2)
}

const suiteByHash = new Map()
for (const dir of SUITE_DIRS) {
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.suite.yaml')) continue
    const path = join(dir, name)
    suiteByHash.set(suiteHash(readFileSync(path, 'utf8')), path)
  }
}

let uploaded = 0
let skipped = 0

for (const file of readdirSync(join(RUN_STORE, 'runs')).filter((f) => f.endsWith('.json'))) {
  const record = JSON.parse(readFileSync(join(RUN_STORE, 'runs', file), 'utf8'))
  const suite = suiteByHash.get(record.run.pins.suiteHash)
  if (suite === undefined) {
    // Vaka seti bulunamayan kayıt yüklenmez: eşleşmeyen bir suite ile saklanan
    // koşum, sonraki karşılaştırmaları sessizce yanlış yapar.
    process.stderr.write(`skip ${file}: no case set matches ${record.run.pins.suiteHash}\n`)
    skipped += 1
    continue
  }

  const result = spawnSync(
    process.execPath,
    [
      'packages/cli/dist/bin.js',
      'push',
      file.slice(0, -5),
      '--store',
      RUN_STORE,
      '--suite',
      suite,
      '--url',
      process.env['ASSAY_URL'],
    ],
    { encoding: 'utf8' },
  )
  process.stdout.write(result.stdout ?? '')
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? '')
    skipped += 1
  } else {
    uploaded += 1
  }
}

process.stdout.write(`\n${uploaded} uploaded, ${skipped} skipped\n`)
process.exit(skipped > 0 ? 1 : 0)
