import { type FormEvent, useState } from 'react'
import { api, ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { AccountLayout } from '../components/AccountLayout'
import './admin.css'

export function SecurityPage() {
  const { account, refreshAccount } = useAuth()
  const [setup, setSetup] = useState<{ secret: string; otpauth_url: string; qr_code_base64: string } | null>(null)
  const [enableCode, setEnableCode] = useState('')
  const [linkPassword, setLinkPassword] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startSetup = async () => {
    setError(null)
    try {
      setSetup(await api.setup2fa())
      setMessage('Scan the QR code with your authenticator app.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start 2FA setup')
    }
  }

  const enable2fa = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await api.enable2fa(enableCode)
      setSetup(null)
      setEnableCode('')
      setMessage('Two-factor authentication enabled.')
      await refreshAccount()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to enable 2FA')
    }
  }

  const disable2fa = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await api.disable2fa({ password: disablePassword, code: disableCode })
      setDisablePassword('')
      setDisableCode('')
      setMessage('Two-factor authentication disabled.')
      await refreshAccount()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to disable 2FA')
    }
  }

  const onLinkPassword = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await api.linkPassword(linkPassword)
      setLinkPassword('')
      setMessage('Password linked to your account.')
      await refreshAccount()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to link password')
    }
  }

  return (
    <AccountLayout title="Security" subtitle="2FA, password linking and session security">
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="panel">
        <h2>2FA status</h2>
        <p>{account?.is_totp_enabled ? '2FA is enabled.' : '2FA is not enabled.'}</p>
        {!account?.is_totp_enabled && !setup && (
          <button type="button" className="btn btn-primary" onClick={() => void startSetup()}>Set up 2FA</button>
        )}
        {setup && (
          <form className="stack-form" onSubmit={enable2fa}>
            <img className="qr-image" src={`data:image/png;base64,${setup.qr_code_base64}`} alt="2FA QR code" />
            <p className="mono wrap">{setup.otpauth_url}</p>
            <label>Verification code<input value={enableCode} onChange={(e) => setEnableCode(e.target.value)} pattern="[0-9]{6}" maxLength={6} required /></label>
            <button type="submit" className="btn btn-primary">Enable 2FA</button>
          </form>
        )}
      </section>

      {account?.has_google && !account.has_password && (
        <section className="panel">
          <h2>Link password</h2>
          <form className="stack-form" onSubmit={onLinkPassword}>
            <label>New password<input type="password" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} minLength={8} required /></label>
            <button type="submit" className="btn btn-primary">Link password</button>
          </form>
        </section>
      )}

      {account?.is_totp_enabled && account.has_password && (
        <section className="panel">
          <h2>Disable 2FA</h2>
          <form className="stack-form" onSubmit={disable2fa}>
            <label>Password<input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} required /></label>
            <label>Current 2FA code<input value={disableCode} onChange={(e) => setDisableCode(e.target.value)} pattern="[0-9]{6}" maxLength={6} required /></label>
            <button type="submit" className="btn btn-danger">Disable 2FA</button>
          </form>
        </section>
      )}
    </AccountLayout>
  )
}
