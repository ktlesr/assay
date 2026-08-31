/**
 * PR yorumu — her koşumda yenilenir, yenisi eklenmez.
 *
 * Yorumu bulmanın yolu gövdedeki gizli işaretçi. Aynı PR'da her koşum aynı
 * yorumu günceller; yoksa PR'lar karne çöplüğüne döner.
 *
 * Baseline varsa regresyon karşılaştırması da eklenir. Dört pin kaymışsa
 * karşılaştırma yapılmaz ve bunun neden yapılmadığı yazılır.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { commentBody } from './format.mjs'

const event = readJson(process.env['GITHUB_EVENT_PATH'])
const pr = event?.pull_request?.number
if (pr === undefined) process.exit(0)

const record = readJson('.assay/current.json')
if (record === null) process.exit(0)

const baseline = newestRun('.assay/baseline/runs') ?? newestRun('.assay/baseline')
const comparison = baseline === null ? null : compare(baseline)

upsert(pr, commentBody(record, comparison, baseline?.id ?? ''))

// ---------------------------------------------------------------------------

/**
 * Karşılaştırmayı derlenmiş core'a yaptırır.
 *
 * Sonraki koşum `.assay/current.json` içinde; buraya yalnızca baseline
 * geçiliyor.
 */
function compare(before) {
  const core = join(process.cwd(), 'packages/core/dist/index.js')
  if (!existsSync(core)) return null
  const script = `
    import { compareRuns } from ${JSON.stringify(core)}
    import { readFileSync } from 'node:fs'
    const before = JSON.parse(readFileSync(process.argv[1], 'utf8'))
    const after = JSON.parse(readFileSync(process.argv[2], 'utf8'))
    process.stdout.write(JSON.stringify(compareRuns(before, after)))
  `
  const beforePath = '.assay/baseline-run.json'
  const afterPath = '.assay/current.json'
  writeFileSync(beforePath, JSON.stringify(before), 'utf8')
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', script, beforePath, afterPath],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) return null
  try {
    return JSON.parse(result.stdout)
  } catch {
    return null
  }
}

function upsert(number, body) {
  const list = gh([
    'api',
    `repos/${process.env['GITHUB_REPOSITORY']}/issues/${number}/comments`,
    '--paginate',
    '--jq',
    '.[] | select(.body | contains("assay-scorecard")) | .id',
  ])
  const existing = list.split(/\r?\n/).filter(Boolean)[0]

  if (existing === undefined) {
    gh(
      [
        'api',
        '--method',
        'POST',
        `repos/${process.env['GITHUB_REPOSITORY']}/issues/${number}/comments`,
        '-f',
        `body=${body}`,
      ],
      body,
    )
    return
  }
  gh([
    'api',
    '--method',
    'PATCH',
    `repos/${process.env['GITHUB_REPOSITORY']}/issues/comments/${existing}`,
    '-f',
    `body=${body}`,
  ])
}

function gh(args) {
  const result = spawnSync('gh', args, { encoding: 'utf8' })
  if (result.status !== 0) {
    process.stdout.write(
      `::warning::gh ${args[0]} failed: ${result.stderr?.slice(0, 300)}\n`,
    )
    return ''
  }
  return result.stdout ?? ''
}

function readJson(path) {
  if (path === undefined || !existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function newestRun(dir) {
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
  const newest = files.at(-1)
  if (newest === undefined) return null
  const parsed = readJson(join(dir, newest))
  return parsed?.run ?? parsed ?? null
}
