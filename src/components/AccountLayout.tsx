import { NavLink } from 'react-router-dom'
import { hasAdminPanelAccess } from '../auth/roles'
import { useAuth } from '../auth/useAuth'
import { PublicHeader } from './PublicHeader'
import '../pages/admin.css'

function accountNavClassName({ isActive }: { isActive: boolean }) {
  return isActive ? 'account-nav__link is-active' : 'account-nav__link'
}

export function AccountLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle?: string
}) {
  const { account } = useAuth()

  return (
    <div className="account-layout">
      <PublicHeader />
      <div className="account-body">
        <aside className="account-nav" aria-label="Account navigation">
          <NavLink to="/account" className={accountNavClassName} end>
            Account
          </NavLink>
          <NavLink to="/account/security" className={accountNavClassName}>
            Security
          </NavLink>
          {hasAdminPanelAccess(account) && (
            <NavLink to="/admin" className={accountNavClassName}>
              Admin panel
            </NavLink>
          )}
        </aside>
        <main className="account-content">
          <header className="page-header">
            <h1>{title}</h1>
            {subtitle && <p className="page-lead">{subtitle}</p>}
          </header>
          {children}
        </main>
      </div>
    </div>
  )
}
