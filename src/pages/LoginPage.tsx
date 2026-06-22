import { type FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { BrandLogo } from '../components/BrandLogo'
import { GoogleLoginForm } from '../components/auth/GoogleLoginForm'
import { getRuntimeEnv } from '../utils/runtimeEnv'
import { ThemeToggle } from '../components/ThemeToggle'
import { brandConfig } from '../brand/config'
import '../pages/admin.css'

function postLoginPath(from: string | undefined): string {
  if (from && from !== '/login') return from
  return '/'
}

export function LoginPage() {
  const { login, verifyMfa, account, completeLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaToken, setMfaToken] = useState<string | null>(searchParams.get('mfa_token'))
  const [mfaCode, setMfaCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [allowRegistration, setAllowRegistration] = useState(false)
  const [googleOauthEnabled, setGoogleOauthEnabled] = useState(false)
  const [googleClientIdFromApi, setGoogleClientIdFromApi] = useState('')

  const googleClientId = getRuntimeEnv().googleClientId || googleClientIdFromApi
  const showGoogleLogin = googleOauthEnabled && Boolean(googleClientId)

  const redirectTo = (from: string | undefined) => {
    navigate(postLoginPath(from), { replace: true })
  }

  useEffect(() => {
    if (account) {
      redirectTo((location.state as { from?: { pathname?: string } } | null)?.from?.pathname)
    }
  }, [account, location.state])

  useEffect(() => {
    void api.registrationStatus().then((s) => {
      setAllowRegistration(s.allow_registration)
      setGoogleOauthEnabled(s.google_oauth_enabled)
      setGoogleClientIdFromApi(s.google_client_id ?? '')
    })
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      if (mfaToken) {
        await verifyMfa(mfaToken, mfaCode)
        redirectTo((location.state as { from?: { pathname?: string } } | null)?.from?.pathname)
        return
      }
      const result = await login(email, password)
      if (result === 'ok') {
        redirectTo((location.state as { from?: { pathname?: string } } | null)?.from?.pathname)
      } else {
        setMfaToken(result)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    }
  }

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setDuplicateEmail(false)
    try {
      await api.register({ email, password })
      navigate('/register/complete', { replace: true, state: { email } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDuplicateEmail(true)
        setError('This email is already registered.')
      } else {
        setError(err instanceof ApiError ? err.message : 'Registration failed')
      }
    }
  }

  return (
    <div className="admin-shell">
      <div className="auth-toolbar">
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <BrandLogo className="auth-card-brand" />
        <p className="muted page-lead">{brandConfig.tagline}</p>
        {error && <div className="alert error">{error}</div>}
        {duplicateEmail && (
          <p className="auth-inline-hint">
            <Link to="/login" className="text-link" onClick={() => setMode('login')}>
              Sign in with this email
            </Link>
          </p>
        )}
        <form className="stack-form" onSubmit={mfaToken ? handleSubmit : mode === 'login' ? handleSubmit : handleRegister}>
          {!mfaToken && (
            <>
              <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
            </>
          )}
          {mfaToken && (
            <label>2FA code<input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" /></label>
          )}
          <button type="submit" className="btn btn-primary btn-block">
            {mfaToken ? 'Verify 2FA' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        {!mfaToken && (
          <>
            {showGoogleLogin && (
              <>
                <div className="divider">or</div>
                <div className="social-login">
                  <div className="social-login-item">
                    <GoogleLoginForm
                      clientId={googleClientId}
                      onSuccess={async () => {
                        await completeLogin()
                        redirectTo((location.state as { from?: { pathname?: string } } | null)?.from?.pathname)
                      }}
                      onMfaRequired={setMfaToken}
                    />
                  </div>
                </div>
              </>
            )}
            {allowRegistration && (
              <button type="button" className="btn btn-ghost btn-block" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Create an account' : 'Already have an account? Sign in'}
              </button>
            )}
          </>
        )}
        <Link className="back-link" to="/">Back to status page</Link>
      </div>
    </div>
  )
}
