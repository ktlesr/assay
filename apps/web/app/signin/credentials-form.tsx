'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

/**
 * Parola ile giriş formu.
 *
 * İstemci bileşeni olmasının iki sebebi var ve ikisi de kullanıcıyı bekleme
 * anında yalnız bırakmamakla ilgili:
 *
 * - `useFormStatus` gönderim sırasında düğmeyi kilitliyor ve metni
 *   değiştiriyor. Sunucu eylemi bir tur atarken hiçbir geri bildirim
 *   olmaması, kullanıcıya iki kez tıklatan şeydi.
 * - Parola göster/gizle. Mono yazı tipinde noktalar birbirine benziyor;
 *   yanlış yazılmış bir parolayı görmeden anlamanın yolu yok.
 */
export function CredentialsForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>
}) {
  const [visible, setVisible] = useState(false)

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="col-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          // Ekran açıldığında imleç burada: giriş sayfasının tek işi bu.
          autoFocus
          required
          placeholder="you@example.com"
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="col-label">
          Password
        </label>
        <div className="field-with-action">
          <input
            id="password"
            name="password"
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="field-input"
          />
          <button
            type="button"
            className="field-action"
            onClick={() => setVisible((on) => !on)}
            aria-pressed={visible}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <SubmitButton />
    </form>
  )
}

/**
 * Gönderim düğmesi ayrı bir bileşen: `useFormStatus` yalnızca formun
 * *içindeki* bir bileşenden okunabiliyor.
 */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}
