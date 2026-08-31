import type { Run } from '@assay/core'

/**
 * Sertifikanın künyesi: dört pin ve iki denetçisi.
 *
 * Pinler gizlenmiyor. İki koşumun karşılaştırılabilir olması bunlara bağlı;
 * kullanıcı hangi koşulda ölçüldüğünü görmeden sonuca güvenemez.
 */
export function Pins({ run }: { run: Run }) {
  const rows: ReadonlyArray<[string, string]> = [
    ['Skill version', run.pins.skillSource],
    ['Skill hash', run.pins.skillHash === '' ? 'not computed' : run.pins.skillHash],
    ['Model', run.pins.model],
    ['System prompt hash', run.pins.systemPromptHash],
    ['Case set version', String(run.pins.suiteVersion)],
    ['Case set hash', run.pins.suiteHash],
  ]
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="col-label py-0.5">{label}</dt>
          <dd className="min-w-0 truncate py-0.5 font-mono text-xs text-text-muted" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
