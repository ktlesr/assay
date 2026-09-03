import { isConfigured } from '@ktlsr/assay-db'
import { Callout, ErrorState } from '@ktlsr/assay-ui'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { auth, googleEnabled, signIn } from '../../lib/auth'
import { Shell } from '../components/shell'
import { CredentialsForm } from './credentials-form'

/**
 * Giriş.
 *
 * Hata mesajı hangi alanın yanlış olduğunu söylemez: var olan bir e-postayı
 * var olmayandan ayırt edebilen bir mesaj, hesap sayımına açık bir kapıdır.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>
}) {
  const { error, from } = await searchParams
  const session = await auth()
  if (session !== null) redirect('/')

  if (!isConfigured()) {
    return (
      <Shell breadcrumbs={[{ label: 'sign in' }]}>
        <ErrorState
          title="No database is configured"
          detail="Accounts live in Postgres, and DATABASE_URL is not set for this instance, so no one can sign in. Set it and restart. For local development, `pnpm db:dev` starts an in-process Postgres on port 5433."
        />
      </Shell>
    )
  }

  async function signInWithPassword(formData: FormData) {
    'use server'
    // Açık yönlendirmeyi kapat: dönüş adresi yalnızca bu sitede bir yol olabilir.
    const target = typeof from === 'string' && /^\/[^/]/.test(from) ? from : '/'
    try {
      await signIn('credentials', {
        email: String(formData.get('email') ?? ''),
        password: String(formData.get('password') ?? ''),
        redirectTo: target,
      })
    } catch (cause) {
      // Başarılı girişte de bir yönlendirme fırlatılır; onu yutmuyoruz.
      if (cause instanceof AuthError) redirect('/signin?error=1')
      throw cause
    }
  }

  async function signInWithGoogle() {
    'use server'
    await signIn('google', { redirectTo: '/' })
  }

  return (
    <Shell breadcrumbs={[{ label: 'sign in' }]}>
      <div className="auth">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-lede">
          Runs measured by the CLI are yours before they are anyone else&rsquo;s. An
          account only keeps their history in one place.
        </p>

        {error === undefined ? null : (
          <div className="mt-6">
            <Callout tone="danger" title="Sign-in failed">
              Those credentials do not match an active account. Repeated attempts against
              the same address are throttled.
            </Callout>
          </div>
        )}

        <div className="auth-panel mt-6">
          <CredentialsForm action={signInWithPassword} />

          {googleEnabled ? (
            <>
              <p className="auth-divider">or</p>
              <form action={signInWithGoogle}>
                <button type="submit" className="btn btn-block">
                  Continue with Google
                </button>
              </form>
            </>
          ) : null}
        </div>

        <p className="field-hint mt-5">
          There is no sign-up form. The first administrator is created during
          installation, and further accounts are opened from the admin panel.
        </p>
      </div>
    </Shell>
  )
}
