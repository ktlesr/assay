'use client'

import { Button, Callout } from '@ktlsr/assay-ui'
import { useActionState } from 'react'
import { createToken, type MintResult } from './actions'

/** Yeni token formu. Üretilen token yalnızca bu cevapta görünür. */
export function TokenForm() {
  const [state, action, pending] = useActionState<MintResult, FormData>(createToken, {})

  return (
    <div>
      <form action={action} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="name" className="col-label">
            Name
          </label>
          <input
            id="name"
            name="name"
            placeholder="laptop"
            className="field-input w-64"
          />
        </div>
        <Button type="submit">{pending ? 'Creating…' : 'Create token'}</Button>
      </form>

      {state.token === undefined ? null : (
        <div className="mt-6">
          <Callout tone="warning" title="Copy this token now">
            It is shown once. Only its hash is stored, so it cannot be shown again.
            <pre className="mt-3 overflow-x-auto border border-rule px-3 py-2 font-mono text-xs">
              {state.token}
            </pre>
          </Callout>
        </div>
      )}
    </div>
  )
}
