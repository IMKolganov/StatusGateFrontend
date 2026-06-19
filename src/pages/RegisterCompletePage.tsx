import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { api } from '../api/client'
import { BrandLogo } from '../components/BrandLogo'
import { ThemeToggle } from '../components/ThemeToggle'
import '../pages/admin.css'

type RegisterCompleteLocationState = {
  email?: string
}

export function RegisterCompletePage() {
  const location = useLocation()
  const state = (location.state as RegisterCompleteLocationState | null) ?? {}
  const email = state.email?.trim() ?? ''

  const [requireEmailVerification, setRequireEmailVerification] = useState<boolean | null>(null)

  useEffect(() => {
    void api.registrationStatus().then((status) => {
      setRequireEmailVerification(status.require_email_verification)
    })
  }, [])

  if (!email) {
    return <Navigate to="/login" replace />
  }

  const pendingVerification = requireEmailVerification === true

  return (
    <div className="admin-shell">
      <div className="auth-toolbar">
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <BrandLogo className="auth-card-brand" />
        {requireEmailVerification === null ? (
          <p className="muted page-lead">Loading...</p>
        ) : pendingVerification ? (
          <>
            <h1>Confirm your email</h1>
            <p className="page-lead">
              We created your account for <strong>{email}</strong>. Check your inbox and follow the link to activate it.
            </p>
            <p className="muted">
              After confirming, you can sign in and subscribe to project or service status updates.
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Sign in
            </Link>
          </>
        ) : (
          <>
            <h1>Account created</h1>
            <div className="alert success">
              Registration successful. Please sign in to continue.
            </div>
            <p className="muted page-lead">
              You can sign in with <strong>{email}</strong> and subscribe to status updates for projects or individual services.
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Sign in
            </Link>
          </>
        )}
        <Link className="back-link" to="/">
          Back to status page
        </Link>
      </div>
    </div>
  )
}
