import { prisma } from '@ktlsr/assay-db'
import { EmptyState } from '@ktlsr/assay-ui'
import { Shell } from '../../components/shell'
import { setSuitePublic } from '../actions'
import { AdminNav } from '../admin-nav'
import { DangerAction } from '../danger-action'

/**
 * Vaka seti görünürlüğü.
 *
 * Varsayılan gizli. Herkese açık yapmak bir yayın kararı: koşum kayıtları
 * istem metinlerini, araç argümanlarını ve dosya yollarını taşıyor.
 */
export default async function AdminSuitesPage() {
  const suites = await prisma().suite.findMany({
    orderBy: [{ skill: 'asc' }, { version: 'asc' }],
    include: {
      owner: { select: { email: true } },
      _count: { select: { runs: true } },
      // Aynı skill'in iki vaka seti aynı ada ve sürüme sahip olabilir; ayıran
      // şey içerik hash'i. Kullanıcıya hash yerine önce insanca bir işaret
      // vermek için son koşumun tarihi ve vaka sayısı okunuyor.
      runs: {
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: { startedAt: true, _count: { select: { cases: true } } },
      },
    },
  })

  return (
    <Shell breadcrumbs={[{ label: 'admin' }, { label: 'case sets' }]}>
      <AdminNav />
      <h1 className="page-title">Case sets</h1>
      <p className="page-lede">
        A case set is private until it is published here. Publishing exposes every run
        measured with it — prompts, tool arguments and file paths included — to anyone
        with the link, signed in or not.
      </p>

      {suites.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing uploaded yet"
            description="Case sets arrive with the runs measured against them."
          />
        </div>
      ) : (
        <ul className="ruled mt-10">
          {suites.map((suite) => (
            <li
              key={suite.id}
              className="flex flex-wrap items-baseline justify-between gap-4 py-4"
            >
              <span className="min-w-0">
                <span className="font-mono text-sm">{suite.skill}</span>
                {/*
                  Parmak izi: `sha256:` öneki her satırda aynı olduğu için
                  kısaltmanın başı hiçbir şey ayırt etmiyordu. Öneki atıp
                  yalnızca ayırt eden sekiz karakteri gösteriyoruz.
                */}
                <span className="ml-3 font-mono text-xs text-text-muted">
                  {fingerprint(suite.hash)}
                </span>
                <span className="ml-3 text-xs uppercase tracking-[0.09em] text-text">
                  {suite.public ? 'public' : 'private'}
                </span>
                <span className="mt-1 block text-xs text-text-faint">
                  version {suite.version} · {suite._count.runs} run
                  {suite._count.runs === 1 ? '' : 's'}
                  {suite.runs[0] === undefined
                    ? ''
                    : ` · ${suite.runs[0]._count.cases} cases · last measured ${suite.runs[0].startedAt.toISOString().slice(0, 10)}`}{' '}
                  · {suite.owner?.email ?? 'no owner'}
                </span>
              </span>
              <DangerAction
                tone={suite.public ? 'danger' : 'default'}
                label={suite.public ? 'Make private' : 'Publish'}
                title={
                  suite.public
                    ? `Make ${suite.skill} ${fingerprint(suite.hash)} private`
                    : `Publish ${suite.skill} ${fingerprint(suite.hash)}`
                }
                description={
                  suite.public
                    ? 'Its runs stop being readable without an account. Links already shared stop working for signed-out visitors.'
                    : 'Every run measured with this case set becomes readable by anyone with the link, including its prompts, tool arguments and file paths.'
                }
                confirmLabel={suite.public ? 'Make private' : 'Publish'}
                action={async () => {
                  'use server'
                  await setSuitePublic(suite.id, !suite.public)
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}

/**
 * Vaka setinin ayırt edici parmak izi.
 *
 * `sha256:` öneki her sette aynı; ilk sekiz onaltılık karakter ise iki seti
 * ayırmaya fazlasıyla yetiyor. Aynı skill'in iki farklı vaka seti listede
 * yan yana durduğunda kullanıcının hangisini yayımladığını bilmesi buna
 * bağlı — onay kutusunda da aynı işaret gösteriliyor.
 */
function fingerprint(hash: string): string {
  return hash.replace(/^sha256:/, '').slice(0, 8)
}
