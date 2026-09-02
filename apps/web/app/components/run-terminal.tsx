import type { Run } from '@ktlsr/assay-core'
import { linesFor, type Line } from '../../lib/run-terminal-lines'

/**
 * Hero terminali — gerçek bir koşumun çıktısı, satır satır beliriyor.
 *
 * İki karar bu bileşeni şekillendirdi.
 *
 * **Sunucu bileşeni, istemci değil.** İlk tasarım JS daktilosuydu; canlı
 * güncellenen bir bölge ekran okuyucuya tekrar tekrar okunuyor, hidrasyon
 * maliyeti getiriyor ve `prefers-reduced-motion` için ayrı kod istiyor.
 * Bunun yerine çıktının tamamı baştan DOM'da; görünürlük CSS
 * `animation-delay` ile açılıyor. Ekran okuyucu metni bir kerede alıyor,
 * hareket tercihi tek media query ile kapanıyor, istemci JS'i sıfır.
 *
 * **Her satır veritabanından.** Tek bir satır elle yazılmıyor: komut suite
 * adından, vaka satırları koşum kaydından, karne toplamlardan türetiliyor
 * (veri gerçekliği sözleşmesi). Yayımlanmış koşum yoksa bileşen hiç
 * çizilmiyor — çağıran taraf prose hero'ya düşüyor.
 */

const MARK: Record<Line['kind'], string> = {
  command: '$',
  blank: '',
  pass: '✓',
  fail: '✗',
  unknown: '?',
  plain: ' ',
  dim: ' ',
}

/**
 * Zamanlama.
 *
 * Komut harf harf yazılıyor — o bir insan eylemi. Sonuçlar satır satır
 * beliriyor, harf harf değil: makine çıktısı satırlar hâlinde gelir, harfler
 * hâlinde değil. Bu ayrım terminali gerçekçi yapan şey.
 */
const TYPE_MS_PER_CHAR = 26
const LINE_STEP_MS = 95

export function RunTerminal({ run }: { run: Run }) {
  const lines = linesFor(run)
  const command = lines[0]?.text ?? ''
  const typeMs = command.length * TYPE_MS_PER_CHAR

  return (
    <div className="term" role="img" aria-label={`Recorded run of ${run.skill}: ${lines.filter((l) => l.kind !== 'blank').length} lines of output`}>
      <div className="term-body">
        {lines.map((line, i) => {
          if (line.kind === 'blank') {
            return <div key={i} className="term-line term-blank" aria-hidden="true" />
          }

          if (line.kind === 'command') {
            return (
              <div key={i} className="term-line">
                <span className="term-mark term-prompt">{MARK.command}</span>
                <span
                  className="term-typed"
                  style={
                    {
                      '--chars': `${command.length}`,
                      '--type-ms': `${typeMs}ms`,
                    } as React.CSSProperties
                  }
                >
                  {command}
                </span>
              </div>
            )
          }

          // Sonuç satırları komut yazımı bittikten sonra sırayla açılıyor.
          const delay = typeMs + 240 + (i - 1) * LINE_STEP_MS
          return (
            <div
              key={i}
              className={`term-line term-reveal term-${line.kind}`}
              style={{ animationDelay: `${delay}ms` } as React.CSSProperties}
            >
              <span className="term-mark">{MARK[line.kind]}</span>
              <span className="term-text">{line.text}</span>
              {line.rate === undefined ? null : (
                <span className="term-rate">{line.rate}</span>
              )}
            </div>
          )
        })}

        {/* İmleç son satırda kalıyor: koşum bitti, istem geri döndü. */}
        <div
          className="term-line term-reveal"
          style={
            { animationDelay: `${typeMs + 240 + lines.length * LINE_STEP_MS}ms` } as React.CSSProperties
          }
        >
          <span className="term-mark term-prompt">$</span>
          <span className="term-cursor" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
