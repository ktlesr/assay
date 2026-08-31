import { afterEach, describe, expect, it, vi } from 'vitest'
import { rateLimit } from './rate-limit'

/**
 * Sayaç gerçekten sayıyor mu?
 *
 * Bir hız sınırlayıcının sessizce hep `true` dönmesi, olmamasından beterdir:
 * korunduğunu sanırsın.
 */
afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('limite kadar izin verir, sonrasında reddeder', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 3; i += 1) expect(rateLimit(key, 3, 60_000)).toBe(true)
    expect(rateLimit(key, 3, 60_000)).toBe(false)
  })

  it('anahtarlar birbirini etkilemez', () => {
    const a = `test-a-${Math.random()}`
    const b = `test-b-${Math.random()}`
    expect(rateLimit(a, 1, 60_000)).toBe(true)
    expect(rateLimit(a, 1, 60_000)).toBe(false)
    expect(rateLimit(b, 1, 60_000)).toBe(true)
  })

  it('pencere dolunca sayaç sıfırlanır', () => {
    // Saat sahte: gerçek beklemeye dayalı bir test yavaş bir makinede kararsız
    // olur ve kararsızlık ölçen bir üründe kararsız test kabul edilemez.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T00:00:00Z'))
    const key = `test-window-${Math.random()}`
    expect(rateLimit(key, 1, 60_000)).toBe(true)
    expect(rateLimit(key, 1, 60_000)).toBe(false)
    vi.setSystemTime(new Date('2026-08-31T00:01:01Z'))
    expect(rateLimit(key, 1, 60_000)).toBe(true)
  })
})
