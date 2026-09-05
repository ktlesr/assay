/**
 * Tetiklenme değerlendirmesi.
 *
 * Assay'in en ayırt edici katmanı ve aynı zamanda en kolay yanlış yapılanı:
 * sinyal okunamadığında "tetiklenmedi" varsaymak, her negatif vakayı bedavaya
 * geçirir. Bu yüzden okunamayan sinyal `unknown`'dır, `false` değil.
 */

import type { TriggerObservation, VerdictDetail } from './records.js'

export interface TriggerExpectation {
  /** Hedef skill tetiklenmeli mi. Belirtilmemişse iddia yok. */
  triggered?: boolean | undefined
  /** Tetiklenmemesi gereken diğer skill'ler (coexistence). */
  notTriggered?: readonly string[] | undefined
}

/**
 * Vakanın tetiklenme iddiasını gözleme karşı sınar.
 *
 * Vaka tetiklenme hakkında hiçbir iddiada bulunmuyorsa `null` döner — bu bir
 * sonuç değil, sonucun konu dışı olduğunun ifadesidir. Çağıran, `null` için
 * kayda tetiklenme satırı yazmaz.
 */
export function evaluateTrigger(
  observation: TriggerObservation,
  expectation: TriggerExpectation,
): VerdictDetail | null {
  const wantsTriggered = expectation.triggered !== undefined
  const notTriggered = expectation.notTriggered ?? []
  if (!wantsTriggered && notTriggered.length === 0) return null

  if (!observation.available) {
    return {
      verdict: 'unknown',
      reason: `the trigger signal could not be read: ${observation.reason}`,
    }
  }

  const problems: string[] = []
  const unmeasurable: string[] = []

  /*
   * Reddedilen aktivasyon "tetiklenmedi" DEĞİLDİR.
   *
   * Model skill'i seçti; host gövdesini enjekte etmedi. Bunu `triggered:
   * false` sayıp pozitif vakayı `fail` yapmak kullanıcıyı skill'i tamir
   * etmeye gönderir, oysa kırık olan izin modudur. Negatif vakayı `pass`
   * saymak ise doğrudan sessiz geçiştir: skill aslında seçilmişti.
   *
   * İki yön de yanlış olduğu için sonuç `unknown` — ölçüm yapılmadı.
   */
  const targetUnmeasurable = observation.refused && !observation.triggered
  if (targetUnmeasurable && wantsTriggered) {
    const why = observation.refusals.map((r) => r.reason)
    unmeasurable.push(
      `the skill was selected but its activation was not confirmed, so whether it triggers could not be measured${
        why.length === 0 ? '' : ` (${[...new Set(why)].join('; ')})`
      }`,
    )
  }

  if (wantsTriggered && !targetUnmeasurable && observation.triggered !== expectation.triggered) {
    problems.push(
      expectation.triggered === true
        ? `the skill did not trigger, but this case expects it to (observed via ${observation.via})`
        : `the skill triggered, but this case expects it not to (observed via ${observation.via})`,
    )
  }

  if (notTriggered.length > 0) {
    if (!observation.complete) {
      unmeasurable.push(
        `the host reports only the target skill, not the full set of triggered skills, so "${notTriggered.join(', ')} must not trigger" cannot be checked`,
      )
    } else {
      const offenders = notTriggered.filter((skill) => observation.skills.includes(skill))
      if (offenders.length > 0) {
        problems.push(`${offenders.join(', ')} triggered but should not have`)
      }
      // Seçilmiş ama aktive olmamış bir komşu skill de ölçülemez: "tetiklenmedi"
      // demek, modelin ona uzandığını gizlemek olurdu.
      const refusedNames = observation.refusals.map((r) => r.skill)
      const unresolved = notTriggered.filter(
        (skill) => !observation.skills.includes(skill) && refusedNames.includes(skill),
      )
      if (unresolved.length > 0) {
        unmeasurable.push(
          `${unresolved.join(', ')} was selected but its activation was not confirmed, so "must not trigger" cannot be checked`,
        )
      }
    }
  }

  // Kesin bir başarısızlık, ölçülemeyen bir parçadan önce gelir: fail > unknown.
  if (problems.length > 0) {
    return {
      verdict: 'fail',
      reason: problems.join('; '),
      detail: { observedSkills: observation.skills, via: observation.via },
    }
  }

  if (unmeasurable.length > 0) {
    return {
      verdict: 'unknown',
      reason: unmeasurable.join('; '),
      detail: {
        via: observation.via,
        observedSkills: observation.skills,
        ...(observation.refusals.length === 0 ? {} : { refusals: observation.refusals }),
      },
    }
  }

  return {
    verdict: 'pass',
    reason: wantsTriggered
      ? `the skill ${observation.triggered ? 'triggered' : 'did not trigger'}, as expected (via ${observation.via})`
      : `none of ${notTriggered.join(', ')} triggered, as expected (via ${observation.via})`,
    detail: { observedSkills: observation.skills, via: observation.via },
  }
}
