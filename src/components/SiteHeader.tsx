import { useEffect, useId, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import { ThemeToggle } from './ThemeToggle'

export function SiteHeader({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const mobileNavId = useId()
  const location = useLocation()
  const [trackedPathname, setTrackedPathname] = useState(location.pathname)

  if (trackedPathname !== location.pathname) {
    setTrackedPathname(location.pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    document.body.classList.toggle('site-header-menu-open', menuOpen)
    return () => document.body.classList.remove('site-header-menu-open')
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <BrandLogo />
        </div>
        <div className="site-header__actions">
          <nav className="site-header__nav site-header__nav--desktop" aria-label="Site navigation">
            {children}
          </nav>
          <div className="site-header__tools">
            <ThemeToggle />
            <button
              type="button"
              className={`site-header__menu-btn${menuOpen ? ' is-open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls={mobileNavId}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="site-header__menu-icon" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="site-header__backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}

      <nav
        id={mobileNavId}
        className={`site-header__nav site-header__nav--mobile${menuOpen ? ' is-open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        {children}
      </nav>
    </header>
  )
}
