import { proportion, type Run } from '@ktlsr/assay-core'
import { describe, expect, it } from 'vitest'
import { linesFor } from './run-terminal-lines'

/**
 * Hero terminalindeki her satırın koşum kaydından türediğini kanıtlar.
 *
 * Bu bir görsel test değil, bir veri gerçekliği testi (sözleşme 3): tanıtım
 * sayfasındaki hiçbir sayı elle yazılmaz. Biri terminale sabit bir satır
 * eklemeye kalkarsa burası kırmızıya döner.
 */

function attempts(pass: number, fail: number) {
  return [
    ...Array.from({ length: pass }, () => ({ verdict: 'pass' as const })),
    ...Array.from({ length: fail }, () => ({ verdict: 'fail' as const })),
  ] as unknown as Run['cases'][number]['attempts']
}

const run = {
  id: 'run-x',
  startedAt: '2026-09-01T15:43:42.398Z',
  finishedAt: '2026-09-01T17:11:00.000Z',
  host: 'claude-code',
  skill: 'frontend-design',
  pins: { model: 'claude-haiku-4-5-20251001' },
  runs: 10,
  verdict: 'fail',
  cases: [
    {
      caseId: 'trigger.positive.control_new_page',
      attempts: attempts(10, 0),
      passRate: proportion(10, 10),
      passed: 10,
      failed: 0,
    },
    {
      caseId: 'trigger.negative.reverse.logo',
      attempts: attempts(8, 2),
      passRate: proportion(8, 10),
      passed: 8,
      failed: 2,
    },
  ],
} as unknown as Run

describe('hero terminali', () => {
  const lines = linesFor(run)

  it('komut satırı skill adından türetiliyor', () => {
    expect(lines[0]).toEqual({
      kind: 'command',
      text: 'npx @ktlsr/assay run ./frontend-design.suite.yaml',
    })
  })

  it('geçen vaka tik, düşen vaka çarpı işaretini alıyor', () => {
    const pass = lines.find((l) => l.text === 'trigger.positive.control_new_page')
    const fail = lines.find((l) => l.text === 'trigger.negative.reverse.logo')
    expect(pass?.kind).toBe('pass')
    expect(fail?.kind).toBe('fail')
  })

  it('oran N ve güven aralığıyla yazılıyor — çıplak yüzde yok', () => {
    const fail = lines.find((l) => l.text === 'trigger.negative.reverse.logo')
    expect(fail?.rate).toBe('80% (N=10, 95% CI 49%–94%)')
    // Değişmez #4: her oranın yanında N var.
    for (const line of lines) {
      if (line.rate !== undefined) expect(line.rate).toContain('N=')
    }
  })

  it('karne satırı attempt sayımlarından toplanıyor', () => {
    const verdicts = lines.find((l) => l.text.startsWith('verdicts'))
    expect(verdicts?.text).toBe('verdicts  18 pass · 2 fail · 0 unknown')
  })

  it('alt satır toplam deneme, model ve tarihi taşıyor', () => {
    const meta = lines.at(-1)
    expect(meta?.text).toBe('20 attempts · claude-haiku-4-5-20251001 · 2026-09-01')
  })

  it('vakası olmayan koşumda uydurma satır üretilmiyor', () => {
    const empty = linesFor({ ...run, cases: [] } as unknown as Run)
    expect(empty.filter((l) => l.kind === 'pass' || l.kind === 'fail')).toEqual([])
    expect(empty.find((l) => l.text.startsWith('verdicts'))?.text).toBe(
      'verdicts  0 pass · 0 fail · 0 unknown',
    )
  })
})
