import type { Run } from '@assay/core'

/**
 * Sertifikanın künyesi: dört pin ve iki denetçisi.
 *
 * Pinler gizlenmiyor. İki koşumun karşılaştırılabilir olması bunlara bağlı;
 * kullanıcı hangi koşulda ölçüldüğünü görmeden sonuca güvenemez.
 *
 * `drifted` verildiğinde kayan satırlar işaretlenir — karşılaştırma ekranında
 * "hangisi değişti" sorusunun cevabı listede duruyor, ayrı bir yerde değil.
 */
export function Pins({ run, drifted = [] }: { run: Run; drifted?: readonly string[] }) {
  const rows: ReadonlyArray<[key: string, label: string, value: string]> = [
    ['skillSource', 'Skill version', run.pins.skillSource],
    [
      'skillHash',
      'Skill hash',
      run.pins.skillHash === '' ? 'not computed' : run.pins.skillHash,
    ],
    ['model', 'Model', run.pins.model],
    ['systemPromptHash', 'Environment hash', run.pins.systemPromptHash],
    ['suiteVersion', 'Case set version', String(run.pins.suiteVersion)],
    ['suiteHash', 'Case set hash', run.pins.suiteHash],
  ]
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
      {rows.map(([key, label, value]) => {
        const moved = drifted.includes(key)
        return (
          <div key={key} className={`contents${moved ? ' pin-row-drifted' : ''}`}>
            <dt className="col-label py-0.5">
              {label}
              {moved ? <span className="pin-drift-mark">changed</span> : null}
            </dt>
            <dd className="min-w-0 truncate py-0.5 font-mono text-xs text-text-muted" title={value}>
              {value}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
