/**
 * Koşum okuma.
 *
 * Ekrandaki her sayı gerçek bir koşumdan gelir (veri gerçekliği sözleşmesi).
 * Kayıtlar buraya `assay push` ile giriyor; bu modül yalnızca okur ve hiçbir
 * ölçümü yeniden hesaplamaz — oranlar kaydın kendisinden geliyor.
 *
 * Veritabanı yapılandırılmamışsa liste boş döner ve ekranda EmptyState görünür.
 * "Veri yok" ile "veritabanı yok" ayrımı `configured` ile taşınıyor.
 */

import {
  compareRuns,
  summarizeRun,
  type Run,
  type RunComparison,
  type RunSummary,
} from '@assay/core'
import {
  isConfigured,
  listRuns as dbListRuns,
  loadRun,
  prisma,
  type RunScope,
} from '@assay/db'
import { auth } from './auth'

export interface RunWithSummary {
  run: Run
  summary: RunSummary
  /** Koşum kimliği — CLI'ın ürettiği kimlik, hosted taraf kendi kimliğini dayatmaz. */
  slug: string
}

/** Bir skill'in bütün koşumları — yeniden eskiye. */
export interface SuiteView {
  skill: string
  runs: RunWithSummary[]
  latest: RunWithSummary
}

export function configured(): boolean {
  return isConfigured()
}

const withSummary = (run: Run): RunWithSummary => ({
  run,
  summary: summarizeRun(run),
  slug: run.id,
})

/**
 * Görüntüleyenin kapsamı.
 *
 * Oturum yoksa yalnızca herkese açık vaka setleri; kullanıcı kendi
 * koşumlarını ve herkese açık olanları; yönetici hepsini görür. Kapsam her
 * okumada yeniden hesaplanıyor ki bir ekranda geçilmesi mümkün olmasın.
 */
export async function viewerScope(): Promise<RunScope> {
  const session = await auth()
  if (session === null) return { kind: 'public' }
  if (session.user.role === 'ADMIN') return { kind: 'all' }
  return { kind: 'viewer', userId: session.user.id }
}

export async function listRuns(scope?: RunScope): Promise<RunWithSummary[]> {
  if (!isConfigured()) return []
  return (await dbListRuns(prisma(), scope ?? (await viewerScope()))).map(withSummary)
}

export async function getRun(
  slug: string,
  scope?: RunScope,
): Promise<RunWithSummary | null> {
  if (!isConfigured()) return null
  const run = await loadRun(
    prisma(),
    decodeURIComponent(slug),
    scope ?? (await viewerScope()),
  )
  return run === null ? null : withSummary(run)
}

/** Skill'e göre gruplanmış görünüm — bir suite'in geçmişi. */
export async function listSuites(scope?: RunScope): Promise<SuiteView[]> {
  const runs = await listRuns(scope)
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

export async function getSuite(
  skill: string,
  scope?: RunScope,
): Promise<SuiteView | null> {
  return (
    (await listSuites(scope)).find((s) => s.skill === decodeURIComponent(skill)) ?? null
  )
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
): Promise<{
  before: RunWithSummary
  after: RunWithSummary
  comparison: RunComparison
} | null> {
  const before = await getRun(beforeSlug)
  const after = await getRun(afterSlug)
  if (before === null || after === null) return null
  return { before, after, comparison: compareRuns(before.run, after.run) }
}
