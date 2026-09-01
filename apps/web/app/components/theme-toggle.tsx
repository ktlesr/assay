'use client'

import { IconMoon, IconSun, IconSystem, applyTheme, readTheme, type Theme } from '@assay/ui'
import { useEffect, useState } from 'react'

const CYCLE: ReadonlyArray<{ value: Theme; label: string; Glyph: typeof IconSun }> = [
  { value: 'system', label: 'Theme: matching your system', Glyph: IconSystem },
  { value: 'light', label: 'Theme: light', Glyph: IconSun },
  { value: 'dark', label: 'Theme: dark', Glyph: IconMoon },
]

/**
 * Tema seçimi — tek düğme, tıkladıkça dönüyor.
 *
 * Üç düğmelik bir grup, üç durumun ikisini her zaman gereksiz yere gösteriyor
 * ve dar ekranda başlığı sıkıştırıyordu. Tek düğme o anki durumu gösteriyor;
 * tıklamak sıradakine geçiriyor. Sıra tahmin edilebilir: sistem → açık → koyu.
 *
 * Sunucuda hangi temanın seçili olduğu bilinemez; ilk render'da sistem ikonu
 * görünür ve hidrasyondan sonra doğru olan gelir. Sunucuda tahmin edip yanlış
 * göstermektense bir an nötr durmak dürüst.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => setTheme(readTheme()), [])

  const index = CYCLE.findIndex((option) => option.value === theme)
  const current = CYCLE[index === -1 ? 0 : index] as (typeof CYCLE)[number]
  const next = CYCLE[(index === -1 ? 0 : index + 1) % CYCLE.length] as (typeof CYCLE)[number]

  return (
    <button
      type="button"
      className="theme-switch"
      title={`${current.label} — click for ${next.value}`}
      aria-label={`${current.label}. Switch to ${next.value}.`}
      onClick={() => {
        applyTheme(next.value)
        setTheme(next.value)
      }}
    >
      <span key={current.value} className="theme-switch-glyph">
        <current.Glyph size={16} />
      </span>
    </button>
  )
}
