import { describe, expect, it } from 'vitest'
import { comparePins, formatProportion, proportion, type Pins } from './records.js'

describe('proportion — değişmez #4', () => {
  it('gözlem yoksa oran da aralık da null', () => {
    const p = proportion(0, 0)
    expect(p.rate).toBeNull()
    expect(p.ci).toBeNull()
    expect(formatProportion(p)).toBe('no observations (N=0)')
  })

  it('8/10 için Wilson aralığı yaklaşık %49–%94', () => {
    const p = proportion(8, 10)
    expect(p.rate).toBeCloseTo(0.8, 10)
    expect(p.ci?.low).toBeCloseTo(0.4902, 3)
    expect(p.ci?.high).toBeCloseTo(0.9433, 3)
    expect(formatProportion(p)).toBe('80% (N=10, 95% CI 49%–94%)')
  })

  it("10/10 mükemmel geçişte bile aralık 1'e sıkışmaz", () => {
    const p = proportion(10, 10)
    expect(p.rate).toBe(1)
    expect(p.ci?.low).toBeCloseTo(0.7225, 3)
    expect(p.ci?.high).toBe(1)
  })

  it('N büyüdükçe aralık daralır', () => {
    const width = (n: number) => {
      const p = proportion(Math.round(0.8 * n), n)
      return (p.ci?.high ?? 1) - (p.ci?.low ?? 0)
    }
    expect(width(100)).toBeLessThan(width(10))
    expect(width(1000)).toBeLessThan(width(100))
  })

  it("0/10 alt sınırı 0'ın altına inmez", () => {
    const p = proportion(0, 10)
    expect(p.rate).toBe(0)
    expect(p.ci?.low).toBe(0)
    expect(p.ci?.high).toBeLessThan(0.35)
  })

  it('imkânsız girdiler reddedilir', () => {
    expect(() => proportion(11, 10)).toThrow(RangeError)
    expect(() => proportion(-1, 10)).toThrow(RangeError)
    expect(() => proportion(1.5, 10)).toThrow(RangeError)
  })
})

describe('comparePins — değişmez #2', () => {
  const base: Pins = {
    skillSource: 'anthropics/skills@abc123',
    model: 'claude-opus-5-20260514',
    systemPromptHash: 'sha256:aaa',
    suiteVersion: 3,
    suiteHash: 'sha256:bbb',
  }

  it('dört pin aynıysa karşılaştırılabilir', () => {
    expect(comparePins(base, { ...base })).toEqual({ comparable: true, drifted: [] })
  })

  it.each([
    ['skillSource', 'anthropics/skills@def456'],
    ['model', 'claude-opus-5-20260601'],
    ['systemPromptHash', 'sha256:ccc'],
    ['suiteHash', 'sha256:ddd'],
  ] as const)('%s kayarsa karşılaştırılamaz', (key, value) => {
    const result = comparePins(base, { ...base, [key]: value })
    expect(result.comparable).toBe(false)
    expect(result.drifted).toEqual([key])
  })

  it('suite sürümü artınca da karşılaştırılamaz', () => {
    expect(comparePins(base, { ...base, suiteVersion: 4 }).drifted).toEqual([
      'suiteVersion',
    ])
  })

  it('birden çok kayma hepsini listeler', () => {
    const result = comparePins(base, { ...base, model: 'x', suiteHash: 'y' })
    expect(result.drifted).toEqual(['model', 'suiteHash'])
  })
})
