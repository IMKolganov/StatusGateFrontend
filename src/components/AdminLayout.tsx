import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Account } from '../api/client'
import { isAdmin } from '../auth/roles'
import { useAuth } from '../auth/useAuth'
import { BrandLogo } from './BrandLogo'
import { ThemeToggle } from './ThemeToggle'
import '../pages/admin.css'

type NavItem = {
  to: string
  label: string
  adminOnly?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

const NAV_COLLAPSED_KEY = 'sg-admin-nav-collapsed'

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard' }],
  },
  {
    title: 'Monitoring',
    items: [
      { to: '/admin/projects', label: 'Projects' },
      { to: '/admin/components', label: 'Services' },
      { to: '/admin/monitoring', label: 'Monitoring' },
      { to: '/admin/incidents', label: 'Incidents' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { to: '/admin/reference', label: 'Catalogs' },
      { to: '/admin/component-kinds', label: 'Service types' },
    ],
  },
  {
    title: 'Administration',
    items: [{ to: '/admin/accounts', label: 'Accounts', adminOnly: true }],
  },
]

function isNavActive(itemTo: string, pathname: string): boolean {
  if (itemTo === '/admin') {
    return pathname === '/admin'
  }
  return pathname === itemTo || pathname.startsWith(`${itemTo}/`)
}

function visibleItems(section: NavSection, account: Account | null): NavItem[] {
  return section.items.filter((item) => !item.adminOnly || isAdmin(account))
}

function sectionIsActive(section: NavSection, pathname: string, account: Account | null): boolean {
  return visibleItems(section, account).some((item) => isNavActive(item.to, pathname))
}

function readCollapsedSections(): Set<string> {
  try {
    const raw = localStorage.getItem(NAV_COLLAPSED_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((value): value is string => typeof value === 'string'))
    }
  } catch {
    /* ignore corrupt storage */
  }
  return new Set()
}

function writeCollapsedSections(collapsed: Set<string>) {
  localStorage.setItem(NAV_COLLAPSED_KEY, JSON.stringify([...collapsed]))
}

export function AdminLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const { logout, account } = useAuth()
  const location = useLocation()
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(readCollapsedSections)

  const sections = useMemo(
    () => navSections.map((section) => ({ section, items: visibleItems(section, account) })).filter(({ items }) => items.length > 0),
    [account],
  )

  const displayedCollapsedSections = useMemo(() => {
    const next = new Set(collapsedSections)
    for (const { section } of sections) {
      if (sectionIsActive(section, location.pathname, account)) {
        next.delete(section.title)
      }
    }
    return next
  }, [collapsedSections, sections, location.pathname, account])

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((current) => {
      const next = new Set(current)
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle)
      } else {
        next.add(sectionTitle)
      }
      writeCollapsedSections(next)
      return next
    })
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <BrandLogo />
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {sections.map(({ section, items }) => {
            const collapsed = displayedCollapsedSections.has(section.title)
            const activeSection = sectionIsActive(section, location.pathname, account)

            return (
              <div
                key={section.title}
                className={`nav-section${collapsed ? ' is-collapsed' : ''}${activeSection ? ' is-active' : ''}`}
              >
                <button
                  type="button"
                  className="nav-section-toggle"
                  aria-expanded={!collapsed}
                  aria-controls={`nav-section-${section.title.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => toggleSection(section.title)}
                >
                  <span className="nav-section-title">{section.title}</span>
                  <span className="nav-section-chevron" aria-hidden />
                </button>
                <div
                  id={`nav-section-${section.title.replace(/\s+/g, '-').toLowerCase()}`}
                  className="nav-section-items"
                  hidden={collapsed}
                >
                  {items.map((item) => (
                    <Link
                      key={item.to}
                      className={isNavActive(item.to, location.pathname) ? 'nav-link active' : 'nav-link'}
                      to={item.to}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <ThemeToggle />
          <Link className="back-home-link" to="/">
            ← Status page
          </Link>
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => { void logout() }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="admin-content">
        <header className="page-header">
          <h1>{title}</h1>
          {subtitle && <p className="page-lead">{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  )
}
