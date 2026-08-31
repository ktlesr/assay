/**
 * Seed koşum kayıtları.
 *
 * Ekrandaki her sayı gerçek bir koşumdan gelir (veri gerçekliği sözleşmesi).
 * `apps/web/seed/runs/` altındaki dosyalar Faz 1'de üretilmiş gerçek
 * kayıtlardır; elle yazılmış tek bir ölçüm yok.
 *
 * Faz 2'nin ilerleyen adımlarında bu okuyucu veritabanıyla değişecek. Kanonik
 * tip aynı kaldığı için ekranlar değişmeyecek — hosted taraf SDK'nın kaydını
 * alır, kendi formatını dayatmaz.
 */

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { compareRuns, summarizeRun, type Run, type RunComparison, type RunSummary } from '@assay/core'

const SEED_DIR = join(process.cwd(), 'seed', 'runs')

interface StoredRun {
  storeVersion: number
  run: Run
}

export interface RunWithSummary {
  run: Run
  summary: RunSummary
  /** Dosya adı. Veritabanı gelince koşum kimliği olacak. */
  slug: string
}

/** Bir skill'in bütün koşumları — yeniden eskiye. */
export interface SuiteView {
  skill: string
  runs: RunWithSummary[]
  latest: RunWithSummary
}

let cache: RunWithSummary[] | null = null

async function loadAll(): Promise<RunWithSummary[]> {
  if (cache !== null) return cache
  const files = await readdir(SEED_DIR).catch(() => [] as string[])
  const loaded: RunWithSummary[] = []
  for (const file of files.filter((f) => f.endsWith('.json'))) {
    try {
      const parsed = JSON.parse(await readFile(join(SEED_DIR, file), 'utf8')) as StoredRun
      if (parsed.run === undefined) continue
      loaded.push({
        run: parsed.run,
        summary: summarizeRun(parsed.run),
        slug: file.slice(0, -5),
      })
    } catch {
      // Okunamayan kayıt sessizce atlanır ama sayılır: ekranda EmptyState
      // görünür, uydurma veri değil.
    }
  }
  loaded.sort((a, b) => (a.run.startedAt < b.run.startedAt ? 1 : -1))
  cache = loaded
  return loaded
}

export async function listRuns(): Promise<RunWithSummary[]> {
  return loadAll()
}

export async function getRun(slug: string): Promise<RunWithSummary | null> {
  return (await loadAll()).find((r) => r.slug === slug) ?? null
}

/** Skill'e göre gruplanmış görünüm — bir suite'in geçmişi. */
export async function listSuites(): Promise<SuiteView[]> {
  const runs = await loadAll()
  const grouped = new Map<string, RunWithSummary[]>()
  for (const item of runs) {
    const list = grouped.get(item.run.skill) ?? []
    list.push(item)
    grouped.set(item.run.skill, list)
  }
  return [...grouped.entries()]
    .map(([skill, list]) => ({ skill, runs: list, latest: list[0] as RunWithSummary }))
    .sort((a, b) => (a.latest.run.startedAt < b.latest.run.startedAt ? 1 : -1))
}

export async function getSuite(skill: string): Promise<SuiteView | null> {
  return (await listSuites()).find((s) => s.skill === decodeURIComponent(skill)) ?? null
}

/**
 * İki koşumun karşılaştırması.
 *
 * Karar `@assay/core`'da: dört pin sabit değilse karşılaştırma üretilmez.
 * Web bu kuralı yeniden yazmaz, çağırır.
 */
export async function compare(
  beforeSlug: string,
  afterSlug: string,
): Promise<{ before: RunWithSummary; after: RunWithSummary; comparison: RunComparison } | null> {
  const before = await getRun(beforeSlug)
  const after = await getRun(afterSlug)
  if (before === null || after === null) return null
  return { before, after, comparison: compareRuns(before.run, after.run) }
}
