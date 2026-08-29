import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Account } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import { navIcons, sectionIcons } from '../components/icons'
import './admin.css'

const quickLinks = [
  {
    title: 'Monitoring' as const,
    items: [
      { to: '/admin/projects' as const, label: 'Projects' },
      { to: '/admin/components' as const, label: 'Services' },
      { to: '/admin/monitoring' as const, label: 'Polling settings' },
      { to: '/admin/incidents' as const, label: 'Incidents' },
    ],
  },
  {
    title: 'Reference' as const,
    items: [
      { to: '/admin/reference' as const, label: 'All catalogs' },
      { to: '/admin/component-kinds' as const, label: 'Service types' },
    ],
  },
  {
    title: 'Administration' as const,
    items: [
      { to: '/admin/datagate' as const, label: 'DataGate import' },
      { to: '/admin/accounts' as const, label: 'Accounts' },
    ],
  },
]

export function AdminPage() {
  const [dashboard, setDashboard] = useState<{ message: string; account: Account } | null>(null)

  useEffect(() => {
    void api.dashboard().then(setDashboard)
  }, [])

  return (
    <AdminLayout title="Dashboard" subtitle="StatusGate admin panel">
      <section className="panel">
        <h2>Welcome</h2>
        <p>{dashboard?.message ?? 'Loading…'}</p>
        {dashboard?.account && (
          <p className="muted">
            Signed in as <strong>{dashboard.account.email}</strong>
          </p>
        )}
      </section>

      <div className="dashboard-sections">
        {quickLinks.map((section) => {
          const SectionIcon = sectionIcons[section.title]
          return (
            <section key={section.title} className="panel dashboard-section">
              <h2 className="dashboard-section-title">
                <SectionIcon className="dashboard-section-icon" />
                <span>{section.title}</span>
              </h2>
              <ul className="dashboard-link-list">
                {section.items.map((item) => {
                  const ItemIcon = navIcons[item.to]
                  return (
                    <li key={item.to}>
                      <Link to={item.to} className="dashboard-link">
                        <ItemIcon className="dashboard-link-icon" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </AdminLayout>
  )
}
