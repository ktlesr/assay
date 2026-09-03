import { formatProportion } from '@ktlsr/assay-core'
import { ImageResponse } from 'next/og'
import { listSuites } from '../lib/runs'

/**
 * Sosyal paylaşım kartı.
 *
 * Kart bir logo değil, bir **numune**: yayımlanmış gerçek bir koşumdan
 * okunan bir vaka, oranı ve güven aralığıyla. Assay bağlantısı paylaşan
 * herkes, belirsizliği eklenmiş gerçek bir sayı paylaşmış oluyor.
 *
 * Rakip bir aracın OG kartı bunu yapamaz — gösterecek dürüst bir sayısı
 * yok. Kartın ayırt ediciliği tipografiden değil, içerdiği gerçeklikten
 * geliyor.
 *
 * KIRILGANLIK: bu rota veritabanına dokunuyor ve sosyal platformlar hatayı
 * önbelleğe alır. Bu yüzden hiçbir koşulda fırlatmıyor; ölçüm okunamazsa
 * sayısız kompozisyona düşüyor. Boş bir kart, kırık bir karttan iyidir.
 */

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Assay — a CI test runner for Agent Skills'

const INK = '#0b0d0e'
const PAPER = '#f1f3f3'
const MUTED = '#5d6564'
const FAINT = '#8b9391'
const RULE = '#d3d8d7'
const FAIL = '#8c2f2a'

/** Yayımlanmış bir koşumdan tek bir vaka. Okunamazsa `null`. */
async function specimen(): Promise<{
  caseId: string
  rate: string
  skill: string
  model: string
  failed: boolean
} | null> {
  try {
    const suites = await listSuites({ kind: 'public' })
    const suite = suites.find((s) => s.latest.run.verdict === 'fail') ?? suites[0]
    if (suite === undefined) return null

    const cases = suite.latest.run.cases
    const worst =
      cases
        .filter((c) => c.failed > 0)
        .sort((a, b) => (a.passRate.rate ?? 1) - (b.passRate.rate ?? 1))[0] ?? cases[0]
    if (worst === undefined) return null

    return {
      caseId: worst.caseId,
      rate: formatProportion(worst.passRate),
      skill: suite.skill,
      model: suite.latest.run.pins.model,
      failed: worst.failed > 0,
    }
  } catch {
    // Veritabanı ulaşılamıyorsa kart yine çizilsin.
    return null
  }
}

export default async function Image() {
  const found = await specimen()

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: PAPER,
        color: INK,
        padding: 72,
        fontFamily: 'serif',
      }}
    >
      {/* Antet: işaret + kelime markası, altında saç teli */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <svg width="34" height="34" viewBox="0 0 32 32" fill={INK}>
          <rect x="4" y="8" width="2.6" height="16" />
          <rect x="25.4" y="8" width="2.6" height="16" />
          <rect x="4" y="14.7" width="24" height="2.6" />
          <circle cx="18.6" cy="16" r="4.6" />
        </svg>
        <div style={{ display: 'flex', fontSize: 40, letterSpacing: '-0.01em' }}>
          Assay
        </div>
        <div
          style={{
            display: 'flex',
            marginLeft: 'auto',
            fontSize: 20,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: FAINT,
            fontFamily: 'monospace',
          }}
        >
          assayctl.dev
        </div>
      </div>
      <div style={{ display: 'flex', height: 1, background: RULE, marginTop: 28 }} />

      {/* İddia */}
      <div
        style={{
          display: 'flex',
          fontSize: 68,
          lineHeight: 1.05,
          marginTop: 48,
          maxWidth: 900,
        }}
      >
        Does your skill still fire?
      </div>

      {found === null ? (
        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 28,
            lineHeight: 1.4,
            color: MUTED,
            maxWidth: 880,
            fontFamily: 'sans-serif',
          }}
        >
          A CI test runner for Agent Skills. Every rate ships with its sample size and
          confidence interval.
        </div>
      ) : (
        <>
          {/* Numune: gerçek bir vaka, gerçek bir oran */}
          <div style={{ display: 'flex', marginTop: 'auto', flexDirection: 'column' }}>
            <div
              style={{ display: 'flex', height: 1, background: RULE, marginBottom: 26 }}
            />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: 30,
                  color: found.failed ? FAIL : INK,
                  fontFamily: 'monospace',
                }}
              >
                {found.failed ? '✕' : '●'}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 30,
                  fontFamily: 'monospace',
                  color: MUTED,
                }}
              >
                {found.caseId}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 18,
                fontSize: 44,
                fontFamily: 'monospace',
                color: INK,
              }}
            >
              {found.rate}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 18,
                gap: 28,
                fontSize: 22,
                fontFamily: 'monospace',
                color: FAINT,
              }}
            >
              <div style={{ display: 'flex' }}>{found.skill}</div>
              <div style={{ display: 'flex' }}>{found.model}</div>
              <div style={{ display: 'flex' }}>measured, not claimed</div>
            </div>
          </div>
        </>
      )}
    </div>,
    size,
  )
}
