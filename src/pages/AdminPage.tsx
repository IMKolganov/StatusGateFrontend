import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Account } from '../api/client'
import { AdminLayout } from '../components/AdminLayout'
import './admin.css'

const quickLinks = [
  {
    title: 'Monitoring',
    items: [
      { to: '/admin/projects', label: 'Projects' },
      { to: '/admin/components', label: 'Services' },
      { to: '/admin/monitoring', label: 'Polling settings' },
      { to: '/admin/incidents', label: 'Incidents' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { to: '/admin/reference', label: 'All catalogs' },
      { to: '/admin/component-kinds', label: 'Service types' },
    ],
  },
] as const

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
        {quickLinks.map((section) => (
          <section key={section.title} className="panel dashboard-section">
            <h2>{section.title}</h2>
            <ul className="dashboard-link-list">
              {section.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="dashboard-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AdminLayout>
  )
}
