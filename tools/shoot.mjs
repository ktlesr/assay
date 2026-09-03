/**
 * Ekran görüntüsü aracı.
 *
 * Sözleşme (docs/workflow.md) arayüzü etkileyen her adımdan sonra iki temada
 * ekran görüntüsü istiyor. Bu araç gelene kadar bu yapılamıyordu ve görsel
 * doğrulama yapısal kontrole indirgeniyordu.
 *
 *   node tools/shoot.mjs <taban-url> <cikti-dizini> [yol...]
 *
 * Her yol için üç kare: açık tema masaüstü, koyu tema masaüstü, açık tema
 * mobil (375px). Tema `data-theme` özniteliğiyle zorlanıyor — sistem
 * tercihine bırakmak, koşumu çalıştıran makineye bağlı bir sonuç verirdi.
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [base = 'http://127.0.0.1:3100', outDir = 'screenshots', ...paths] = process.argv.slice(2)
const targets = paths.length > 0 ? paths : ['/']

const SHOTS = [
  { name: 'light', width: 1280, height: 900, theme: 'light' },
  { name: 'dark', width: 1280, height: 900, theme: 'dark' },
  { name: 'mobile', width: 375, height: 780, theme: 'light' },
]

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
let failures = 0

for (const path of targets) {
  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()

    // Temayı boyamadan önce sabitle: sayfanın kendi script'i de aynı
    // özniteliği okuyor, yani bu gerçek kullanıcı yolundan geçiyor.
    await page.addInitScript((theme) => {
      try {
        localStorage.setItem('assay-theme', theme)
      } catch {
        /* özel pencere: öznitelik yine de yazılıyor */
      }
      document.documentElement.setAttribute('data-theme', theme)
    }, shot.theme)

    const url = base.replace(/\/$/, '') + path
    const response = await page.goto(url, { waitUntil: 'networkidle' })
    const status = response?.status() ?? 0

    // `networkidle` ağın durduğunu söylüyor, sayfanın durduğunu değil. Giriş
    // animasyonları bitmeden çekilen kare boş bir hero gösteriyordu — kusuru
    // sayfada sanıp aramaya başlamıştım. 1.4 sn en uzun açılışı da kapsıyor.
    await page.waitForTimeout(1400)

    // Yatay taşma sessizce kaçan bir hata: ölçüp raporluyoruz.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )

    const slug = (path === '/' ? 'home' : path.replace(/^\//, '').replace(/[/?=&]/g, '-'))
    const file = join(outDir, `${slug}.${shot.name}.png`)
    await page.screenshot({ path: file, fullPage: true })

    const flag = status >= 400 ? ` <-- HTTP ${status}` : overflow ? ' <-- YATAY TAŞMA' : ''
    if (flag !== '') failures += 1
    console.log(`${String(status).padEnd(4)} ${shot.name.padEnd(7)} ${path.padEnd(22)} ${file}${flag}`)

    await context.close()
  }
}

await browser.close()
if (failures > 0) {
  console.error(`\n${failures} kare sorunlu.`)
  process.exit(1)
}
