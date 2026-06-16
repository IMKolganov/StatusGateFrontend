import { Link } from 'react-router-dom'
import { hasAdminPanelAccess } from '../auth/roles'
import { useAuth } from '../auth/useAuth'
import { SiteHeader } from './SiteHeader'
import '../pages/public.css'

export function PublicHeader() {
  const { account, loading, logout } = useAuth()

  return (
    <SiteHeader>
      <Link to="/about" className="nav-text">
        About
      </Link>
      {loading ? (
        <span className="muted site-header__placeholder">...</span>
      ) : account ? (
        <>
          <Link to="/account" className="nav-text nav-truncate" title={account.email}>
            {account.email}
          </Link>
          {hasAdminPanelAccess(account) && (
            <Link to="/admin" className="nav-text">
              Admin panel
            </Link>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            Sign out
          </button>
        </>
      ) : (
        <Link to="/login" className="btn btn-primary btn-sm">
          Sign in
        </Link>
      )}
    </SiteHeader>
  )
}
