import { describe, expect, it } from 'vitest'
import type { TriggerObservation } from './records.js'
import { evaluateTrigger } from './trigger.js'

const seen = (
  triggered: boolean,
  skills: string[] = triggered ? ['docx'] : [],
  complete = true,
): TriggerObservation => ({
  available: true,
  triggered,
  skills,
  complete,
  via: 'transcript',
})

const blind = (reason = 'the host emits no skill markers'): TriggerObservation => ({
  available: false,
  reason,
})

describe('evaluateTrigger — iddia yoksa', () => {
  it('vaka tetiklenme hakkında bir şey söylemiyorsa null', () => {
    expect(evaluateTrigger(seen(true), {})).toBeNull()
    expect(evaluateTrigger(blind(), {})).toBeNull()
    expect(evaluateTrigger(seen(true), { notTriggered: [] })).toBeNull()
  })
})

describe('evaluateTrigger — pozitif ve negatif vakalar', () => {
  it.each([
    [true, true, 'pass'],
    [true, false, 'fail'],
    [false, false, 'pass'],
    [false, true, 'fail'],
  ] as const)('gözlem %s, beklenti %s → %s', (observed, expected, verdict) => {
    expect(evaluateTrigger(seen(observed), { triggered: expected })?.verdict).toBe(
      verdict,
    )
  })

  it('fail gerekçesi hangi yönde saptığını söyler', () => {
    expect(evaluateTrigger(seen(false), { triggered: true })?.reason).toContain(
      'did not trigger, but this case expects it to',
    )
    expect(evaluateTrigger(seen(true), { triggered: false })?.reason).toContain(
      'triggered, but this case expects it not to',
    )
  })
})

describe('evaluateTrigger — sinyal okunamıyorsa', () => {
  it('unknown döner, "tetiklenmedi" varsaymaz', () => {
    const result = evaluateTrigger(blind(), { triggered: false })
    expect(result?.verdict).toBe('unknown')
    expect(result?.reason).toContain('could not be read')
  })

  it('okunamayan sinyal hiçbir beklentiyle pass üretmez', () => {
    for (const expectation of [{ triggered: true }, { triggered: false }]) {
      expect(evaluateTrigger(blind(), expectation)?.verdict).not.toBe('pass')
    }
  })

  it("gerekçe host'un verdiği nedeni taşır", () => {
    expect(
      evaluateTrigger(blind('no structured trace'), { triggered: true })?.reason,
    ).toContain('no structured trace')
  })
})

describe('evaluateTrigger — coexistence', () => {
  it('yasaklı skill tetiklenmediyse pass', () => {
    const result = evaluateTrigger(seen(true, ['docx']), {
      triggered: true,
      notTriggered: ['pdf'],
    })
    expect(result?.verdict).toBe('pass')
  })

  it('yasaklı skill tetiklendiyse fail ve adını verir', () => {
    const result = evaluateTrigger(seen(true, ['docx', 'pdf']), {
      triggered: true,
      notTriggered: ['pdf'],
    })
    expect(result?.verdict).toBe('fail')
    expect(result?.reason).toContain('pdf triggered but should not have')
  })

  it('host tam liste vermiyorsa unknown — eksik listeyle "tetiklenmedi" denemez', () => {
    const result = evaluateTrigger(seen(true, ['docx'], false), {
      triggered: true,
      notTriggered: ['pdf'],
    })
    expect(result?.verdict).toBe('unknown')
    expect(result?.reason).toContain('not the full set')
  })

  it('kesin başarısızlık, ölçülemeyen coexistence parçasından önce gelir', () => {
    // Hedef skill tetiklenmemiş: bu kesin bir fail. Coexistence ölçülemiyor
    // olsa bile gerçek bir başarısızlığı unknown'ın arkasına saklamayız.
    const result = evaluateTrigger(seen(false, [], false), {
      triggered: true,
      notTriggered: ['pdf'],
    })
    expect(result?.verdict).toBe('fail')
  })

  it('hedef doğru ama coexistence ölçülemiyorsa unknown', () => {
    const result = evaluateTrigger(seen(true, ['docx'], false), {
      triggered: true,
      notTriggered: ['pdf'],
    })
    expect(result?.verdict).toBe('unknown')
  })
})
