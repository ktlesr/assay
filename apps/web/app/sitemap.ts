import type { MetadataRoute } from 'next'
import { listSuites } from '../lib/runs'

/**
 * Site haritası.
 *
 * Yalnızca **yayımlanmış** vaka setlerinin koşumları giriyor: gizli bir
 * koşumu haritaya koymak, `RunScope`'un koruduğu şeyi arama motoruna
 * söylemek olurdu.
 *
 * Çalışma zamanında üretiliyor — `AUTH_URL` ve yayımlanmış koşum listesi
 * derleme anında bilinmiyor. `robots.ts` ile aynı gerekçe.
 */
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env['AUTH_URL']?.replace(/\/$/, '')
  if (base === undefined || base === '') return []

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
  ]

  try {
    for (const suite of await listSuites({ kind: 'public' })) {
      entries.push({
        url: `${base}/suites/${encodeURIComponent(suite.skill)}`,
        lastModified: new Date(suite.latest.run.startedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
      for (const run of suite.runs) {
        entries.push({
          url: `${base}/runs/${run.slug}`,
          lastModified: new Date(run.run.startedAt),
          changeFrequency: 'never',
          priority: 0.5,
        })
      }
    }
  } catch {
    // Veritabanı okunamıyorsa ana sayfa yine listelensin.
  }

  return entries
}
