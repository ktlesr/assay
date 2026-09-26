import { describe, expect, it } from 'vitest'
import { assembleRun, hashContext } from './assemble.js'
import type { Environment, Pins } from '@ktlsr/assay-core'

/**
 * Bağlam pininin değeri, ölçülmüş talimat dosyalarından türüyor (0.4.8).
 *
 * Pin olabilmesinin sebebi denetçisinin olması: değer host'un bildirdiği her
 * dosyanın yolundan ve içerik hash'inden geliyor, insanın beyanından değil.
 * Ölçülmediğinde alan YAZILMIYOR — ve `comparePins` onu eksik pin sayıp
 * karşılaştırmayı durduruyor.
 */

const pins: Pins = {
  skillSource: 'o/r@1',
  skillHash: 'sha256:s',
  model: 'm',
  systemPromptHash: 'not-provided-by-host',
  suiteVersion: 1,
  suiteHash: 'sha256:c',
}

const environment = (memory?: readonly string[]): Environment => ({
  model: 'm',
  version: '2.1.271',
  outputStyle: 'default',
  permissionMode: 'acceptEdits',
  tools: ['Read'],
  skills: ['s'],
  agents: [],
  plugins: [],
  ...(memory === undefined ? {} : { memory }),
})

const build = (memory?: readonly string[], environmentHash = 'sha256:env') =>
  assembleRun({
    id: 'run-1',
    startedAt: '2026-09-26T10:00:00.000Z',
    finishedAt: '2026-09-26T10:01:00.000Z',
    host: 'claude-code',
    skill: 'widget',
    runs: 10,
    pins,
    attempts: [
      {
        kind: 'attempt' as const,
        caseId: 'trigger.positive.a',
        expectedTrigger: true,
        environmentHash,
        environment: environment(memory),
        attempt: {
          index: 0,
          caseId: 'trigger.positive.a',
          startedAt: '2026-09-26T10:00:01.000Z',
          finishedAt: '2026-09-26T10:00:02.000Z',
          trigger: { available: false as const, reason: 'mock' },
          assertions: [],
          verdict: 'pass' as const,
          reason: 'mock',
          latencyMs: 10,
        },
      },
    ],
  })

describe('contextHash — ölçülmüş bağlamdan türer', () => {
  it('bağlam ölçülmediyse pin YAZILMAZ: yokluk "temiz" değil "bilmiyorum"', () => {
    expect(build(undefined).pins.contextHash).toBeUndefined()
  })

  it('ölçülmüş ve boşsa pin yazılır: "ölçtüm, hiçbir şey yüklenmedi" bir sonuçtur', () => {
    const empty = build([]).pins.contextHash
    expect(empty).toMatch(/^sha256:/)
    // Ve ölçülmemişlikten ayrı: biri karşılaştırılabilir, diğeri değil.
    expect(empty).not.toBe(build(undefined).pins.contextHash)
  })

  it('dosyanın içerik hash i değişince pin kayar', () => {
    const a = build(['Project ./CLAUDE.md sha256:aaaa']).pins.contextHash
    const b = build(['Project ./CLAUDE.md sha256:bbbb']).pins.contextHash
    expect(a).not.toBe(b)
  })

  it('yükleme sırası pini kaydırmaz — koşul dosyaların kendisi', () => {
    const one = ['Project ./CLAUDE.md sha256:aaaa', 'Project ./sub/CLAUDE.md sha256:bbbb']
    expect(hashContext(one)).toBe(hashContext([...one].reverse()))
  })

  it('bağlam ortam hash inden BAĞIMSIZ: aynı ortam, farklı bağlam', () => {
    // Beş kolun durumu: host ortamı kımıldamadı, bağlam değişti. Ortam hash'i
    // eşit kalıyor ve ayrımı yalnızca bağlam pini taşıyor.
    const a = build(['Project ./CLAUDE.md sha256:aaaa'], 'sha256:same')
    const b = build(['Project ./CLAUDE.md sha256:bbbb'], 'sha256:same')
    expect(a.pins.environmentHash).toBe(b.pins.environmentHash)
    expect(a.pins.contextHash).not.toBe(b.pins.contextHash)
  })
})
