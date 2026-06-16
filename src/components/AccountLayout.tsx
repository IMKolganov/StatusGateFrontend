import { Link } from 'react-router-dom'
import { hasAdminPanelAccess } from '../auth/roles'
import { useAuth } from '../auth/useAuth'
import { SiteHeader } from './SiteHeader'
import '../pages/admin.css'

export function AccountLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  const { logout, account } = useAuth()

  return (
    <div className="account-layout">
      <SiteHeader>
        <Link to="/account" className="nav-text">
          Account
        </Link>
        <Link to="/account/security" className="nav-text">
          Security
        </Link>
        {hasAdminPanelAccess(account) && (
          <Link to="/admin" className="nav-text">
            Admin panel
          </Link>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
          Sign out
        </button>
      </SiteHeader>
      <main className="account-content">
        <header className="page-header">
          <h1>{title}</h1>
          {subtitle && <p className="page-lead">{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  )
}
