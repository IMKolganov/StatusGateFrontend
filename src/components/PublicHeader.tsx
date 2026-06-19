import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { HeaderUserMenu } from './HeaderUserMenu'
import { SiteHeader } from './SiteHeader'
import '../pages/public.css'

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-text is-active' : 'nav-text'
}

export function PublicHeader() {
  const { account, loading, logout } = useAuth()

  return (
    <SiteHeader>
      <NavLink to="/" className={navClassName} end>
        Home
      </NavLink>
      <NavLink to="/about" className={navClassName}>
        About
      </NavLink>
      <NavLink to="/contact" className={navClassName}>
        Contact
      </NavLink>
      {loading ? (
        <span className="muted site-header__placeholder">...</span>
      ) : account ? (
        <>
          <HeaderUserMenu account={account} />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            Sign out
          </button>
        </>
      ) : (
        <NavLink to="/login" className="btn btn-primary btn-sm">
          Sign in
        </NavLink>
      )}
    </SiteHeader>
  )
}
