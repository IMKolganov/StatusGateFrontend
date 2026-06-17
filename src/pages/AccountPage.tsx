import { AccountLayout } from '../components/AccountLayout'
import { useAuth } from '../auth/useAuth'
import './admin.css'

export function AccountPage() {
  const { account } = useAuth()

  return (
    <AccountLayout title="Your account" subtitle="Manage sign-in and notification preferences">
      <section className="panel">
        <h2>Profile</h2>
        <p>
          <strong>Email:</strong> {account?.email}
        </p>
        {account?.full_name && (
          <p>
            <strong>Name:</strong> {account.full_name}
          </p>
        )}
        <p className="muted">
          Signed in with {account?.has_google ? 'Google' : 'email'}
          {account?.has_password && account.has_google ? ' and password' : ''}.
        </p>
      </section>

      <section className="panel">
        <h2>Status updates</h2>
        <p className="muted">
          Subscribe to email or webhook notifications when component status changes — coming soon.
        </p>
      </section>
    </AccountLayout>
  )
}
