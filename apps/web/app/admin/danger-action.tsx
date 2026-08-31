'use client'

import { Button, ConfirmDialog } from '@assay/ui'
import { useTransition } from 'react'

/**
 * Onay isteyen yıkıcı eylem.
 *
 * Onay metni eylemi adıyla söyler — "Are you sure?" değil, "Delete the run".
 * Eylem sunucuda koşuyor; buradaki tek iş onayı almak.
 */
export function DangerAction({
  label,
  title,
  description,
  confirmLabel,
  action,
  tone = 'danger',
}: {
  label: string
  title: string
  description: string
  confirmLabel: string
  action: () => Promise<void>
  tone?: 'danger' | 'default'
}) {
  const [pending, start] = useTransition()
  return (
    <ConfirmDialog
      trigger={
        <Button tone={tone === 'danger' ? 'danger' : 'default'}>
          {pending ? '…' : label}
        </Button>
      }
      tone={tone}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={() => {
        start(() => {
          void action()
        })
      }}
    />
  )
}
