import { useState } from 'react'

export function LoginForm({ onLogin }: { onLogin: (u: string, p: string) => Promise<void> }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await onLogin(user, pass)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <div role="alert" className="banner">{error}</div>}
      <input value={user} onChange={(e) => setUser(e.target.value)} />
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
      <button disabled={busy}>Sign in</button>
    </form>
  )
}
