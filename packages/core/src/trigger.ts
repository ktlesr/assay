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

  if (wantsTriggered && observation.triggered !== expectation.triggered) {
    problems.push(
      expectation.triggered === true
        ? `the skill did not trigger, but this case expects it to (observed via ${observation.via})`
        : `the skill triggered, but this case expects it not to (observed via ${observation.via})`,
    )
  }

  let unmeasurable: string | null = null

  if (notTriggered.length > 0) {
    if (!observation.complete) {
      unmeasurable = `the host reports only the target skill, not the full set of triggered skills, so "${notTriggered.join(', ')} must not trigger" cannot be checked`
    } else {
      const offenders = notTriggered.filter((skill) => observation.skills.includes(skill))
      if (offenders.length > 0) {
        problems.push(`${offenders.join(', ')} triggered but should not have`)
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

  if (unmeasurable !== null) {
    return { verdict: 'unknown', reason: unmeasurable, detail: { via: observation.via } }
  }

  return {
    verdict: 'pass',
    reason: wantsTriggered
      ? `the skill ${observation.triggered ? 'triggered' : 'did not trigger'}, as expected (via ${observation.via})`
      : `none of ${notTriggered.join(', ')} triggered, as expected (via ${observation.via})`,
    detail: { observedSkills: observation.skills, via: observation.via },
  }
}
