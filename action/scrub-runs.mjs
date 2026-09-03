/**
 * Artefakt yüklenmeden önce diskteki kayıtları maskeler.
 *
 * Maskeleme üç yerde yapılıyor: kayıt yazılırken, kayıt okunurken ve raporda
 * basılırken. Üçü de *gösterim* yüzeyini kapatıyor — ama `.assay/runs` bir
 * gösterim yüzeyi değil, bir **dosya** ve CI onu artefakt olarak yüklüyor.
 * Artefaktı indiren herkes ham JSON'u okuyor, yani kaçırılan tek kanal buydu.
 *
 * Bu betik dosyaların kendisini yerinde temizliyor. Ölçüm verisi değişmiyor:
 * maskelenen tek şey ev dizini yollarındaki kullanıcı adı ve tanınan sır
 * biçimleri. Bir dosya değiştiyse adı kütüğe yazılıyor — sessizce dosya
 * değiştirmek, ölçüm aracında yapılabilecek en kötü şeylerden biri.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { redactDeep } from '@ktlsr/assay-core'

const dir = process.argv[2] ?? '.assay/runs'

let files
try {
  files = readdirSync(dir).filter((name) => name.endsWith('.json'))
} catch {
  process.stdout.write(`no run store at ${dir}, nothing to scrub\n`)
  process.exit(0)
}

let changed = 0
for (const name of files) {
  const path = join(dir, name)
  const raw = readFileSync(path, 'utf8')
  const clean = `${JSON.stringify(redactDeep(JSON.parse(raw)), null, 2)}\n`
  if (clean === raw) continue
  writeFileSync(path, clean, 'utf8')
  changed += 1
  process.stdout.write(`scrubbed ${name}\n`)
}

process.stdout.write(
  `${files.length} record(s) checked, ${changed} rewritten before upload\n`,
)
