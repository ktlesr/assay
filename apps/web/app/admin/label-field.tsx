'use client'

import { LABEL_MAX_LENGTH } from '@ktlsr/assay-core'
import { Button } from '@ktlsr/assay-ui'
import { useState, useTransition } from 'react'

/**
 * Koşumun adını düzenleyen alan (0.4.7-d).
 *
 * Yıkıcı değil, o yüzden onay penceresi yok: etiket bir not ve yanlış yazılan
 * bir ad tekrar yazılabiliyor. Ama sessiz de değil — kaydedilen her değişiklik
 * denetim günlüğüne giriyor ve düğme ancak değer değiştiğinde etkinleşiyor.
 *
 * Boş kutu "adı kaldır" demek; sunucu tarafı onu null'a çeviriyor.
 */
export function LabelField({
  runId,
  label,
  action,
}: {
  runId: string
  label: string | null
  action: (runId: string, label: string) => Promise<void>
}) {
  const [value, setValue] = useState(label ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const dirty = value.trim() !== (label ?? '')

  return (
    <form
      className="label-form"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        start(async () => {
          try {
            await action(runId, value)
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'the label was not saved')
          }
        })
      }}
    >
      <input
        className="field-input"
        value={value}
        maxLength={LABEL_MAX_LENGTH}
        placeholder="name this run — which arm, which experiment"
        aria-label={`Label for ${runId}`}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button type="submit" disabled={!dirty || pending}>
        {pending ? '…' : 'Save'}
      </Button>
      {error === null ? null : (
        <span className="text-xs text-fail" role="alert">
          {error}
        </span>
      )}
    </form>
  )
}
