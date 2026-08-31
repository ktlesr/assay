/**
 * Seed koşum kayıtları.
 *
 * Ekrandaki her sayı gerçek bir koşumdan gelir (veri gerçekliği sözleşmesi).
 * `apps/web/seed/runs/` altındaki dosyalar Faz 1 dogfooding'inde üretilmiş
 * gerçek kayıtlardır; elle yazılmış tek bir değer yok.
 *
 * Faz 2'nin ilerleyen adımlarında bu okuyucu veritabanıyla değişecek; kanonik
 * tip aynı kaldığı için ekranlar değişmeyecek.
 */

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { summarizeRun, type Run, type RunSummary } from '@assay/core'

const SEED_DIR = join(process.cwd(), 'seed', 'runs')

export interface StoredRun {
  storeVersion: number
  run: Run
}

export interface RunWithSummary {
  run: Run
  summary: RunSummary
  /** Dosya adı — geçici kimlik; veritabanı gelince suite kimliği olacak. */
  slug: string
}

async function readRun(slug: string): Promise<RunWithSummary | null> {
  try {
    const raw = await readFile(join(SEED_DIR, `${slug}.json`), 'utf8')
    const parsed = JSON.parse(raw) as StoredRun
    if (parsed.run === undefined) return null
    return { run: parsed.run, summary: summarizeRun(parsed.run), slug }
  } catch {
    return null
  }
}

export async function listRuns(): Promise<RunWithSummary[]> {
  const files = await readdir(SEED_DIR).catch(() => [] as string[])
  const slugs = files.filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
  const runs = await Promise.all(slugs.map(readRun))
  return runs
    .filter((r): r is RunWithSummary => r !== null)
    .sort((a, b) => (a.run.startedAt < b.run.startedAt ? 1 : -1))
}

export async function getRun(slug: string): Promise<RunWithSummary | null> {
  return readRun(slug)
}
