import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'
import { ThemeToggle } from './ThemeToggle'

export function SiteHeader({ children }: { children: ReactNode }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <BrandLogo />
        </div>
        <div className="site-header__actions">
          <nav className="site-header__nav" aria-label="Site navigation">
            {children}
          </nav>
          <div className="site-header__tools">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
