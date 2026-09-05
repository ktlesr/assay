import { describe, expect, it } from 'vitest'
import type { RefusedActivation, TriggerObservation } from './records.js'
import { evaluateTrigger } from './trigger.js'

const seen = (
  triggered: boolean,
  skills: string[] = triggered ? ['docx'] : [],
  complete = true,
): TriggerObservation => ({
  available: true,
  triggered,
  skills,
  refused: false,
  refusals: [],
  complete,
  via: 'transcript',
})

/**
 * Model skill'i seçti, host aktivasyonu vermedi.
 *
 * `triggered: false` ile birlikte geliyor çünkü aktivasyon olmadı — ama bu
 * "tetiklenmedi" DEĞİL. Ayrımı `refused` taşıyor.
 */
const refused = (
  refusals: RefusedActivation[] = [
    { skill: 'docx', reason: 'the host denied permission for the Skill call' },
  ],
  skills: string[] = [],
): TriggerObservation => ({
  available: true,
  triggered: false,
  skills,
  refused: refusals.some((r) => r.skill === 'docx'),
  refusals,
  complete: true,
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

/**
 * 0.2.0 — reddedilen aktivasyon üçüncü bir durumdur.
 *
 * Model skill'i seçti, host gövdesini enjekte etmedi. Bunu "tetiklenmedi"
 * saymak iki yönde de yanlış: pozitif vaka `fail` alır ve kullanıcı kırık
 * olmayan bir skill'i tamir etmeye gider; negatif vaka `pass` alır ve modelin
 * skill'e uzandığı gizlenir — değişmez #1'in yasakladığı sessiz geçiş.
 */
describe('evaluateTrigger — reddedilen aktivasyon', () => {
  it('pozitif vaka fail değil unknown alır', () => {
    const result = evaluateTrigger(refused(), { triggered: true })
    expect(result?.verdict).toBe('unknown')
    expect(result?.reason).toContain('selected but its activation was not confirmed')
    expect(result?.reason).toContain('denied permission')
  })

  it('negatif vaka pass değil unknown alır — sessiz geçiş yok', () => {
    const result = evaluateTrigger(refused(), { triggered: false })
    expect(result?.verdict).toBe('unknown')
  })

  it('gerekçe reddin sebebini adıyla söyler', () => {
    const result = evaluateTrigger(
      refused([{ skill: 'docx', reason: 'the Skill call succeeded but carried no skill body' }]),
      { triggered: true },
    )
    expect(result?.reason).toContain('no skill body')
  })

  it('aynı skill başka bir çağrıda aktive olduysa ölçüm vardır', () => {
    // `refused: false` — hedef aktive oldu, red bir şey değiştirmiyor.
    const observation = {
      available: true as const,
      triggered: true,
      skills: ['docx'],
      refused: false,
      refusals: [{ skill: 'docx', reason: 'the Skill call failed' }],
      complete: true,
      via: 'transcript',
    }
    expect(evaluateTrigger(observation, { triggered: true })?.verdict).toBe('pass')
  })

  it('reddedilen bir komşu skill coexistence iddiasını ölçülemez yapar', () => {
    const observation = {
      available: true as const,
      triggered: true,
      skills: ['docx'],
      refused: false,
      refusals: [{ skill: 'pdf', reason: 'the Skill call failed' }],
      complete: true,
      via: 'transcript',
    }
    const result = evaluateTrigger(observation, { triggered: true, notTriggered: ['pdf'] })
    expect(result?.verdict).toBe('unknown')
    expect(result?.reason).toContain('pdf was selected')
  })

  it('gerçekten aktive olmuş bir komşu hâlâ kesin fail', () => {
    // fail > unknown: gerçek bir ihlal, ölçülemeyenin arkasına saklanmaz.
    const observation = {
      available: true as const,
      triggered: true,
      skills: ['docx', 'pdf'],
      refused: false,
      refusals: [{ skill: 'xlsx', reason: 'the Skill call failed' }],
      complete: true,
      via: 'transcript',
    }
    const result = evaluateTrigger(observation, {
      triggered: true,
      notTriggered: ['pdf', 'xlsx'],
    })
    expect(result?.verdict).toBe('fail')
  })
})
