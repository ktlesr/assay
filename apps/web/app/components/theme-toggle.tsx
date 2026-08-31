'use client'

import { applyTheme, readTheme, type Theme } from '@assay/ui'
import { useEffect, useState } from 'react'

const OPTIONS: ReadonlyArray<[Theme, string]> = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'System'],
]

/**
 * Tema seçimi.
 *
 * Sunucuda hangi temanın seçili olduğu bilinemez; ilk render'da hiçbiri
 * işaretli görünmez ve hidrasyondan sonra doğru seçenek işaretlenir. Sunucuda
 * tahmin edip yanlış işaretlemektense bir an boş bırakmak dürüst.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => setTheme(readTheme()), [])

  return (
    <div
      className="flex items-center gap-px border border-rule"
      role="group"
      aria-label="Colour theme"
    >
      {OPTIONS.map(([value, label]) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              applyTheme(value)
              setTheme(value)
            }}
            className={`px-2 py-1 text-xs uppercase tracking-[0.09em] transition-colors ${
              active
                ? 'bg-surface-sunken text-text'
                : 'text-text-faint hover:text-text-muted'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
