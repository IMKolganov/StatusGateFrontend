import { Link } from 'react-router-dom'
import { AdminLayout } from '../components/AdminLayout'
import './admin.css'

const catalogs = [
  {
    to: '/admin/component-kinds',
    title: 'Service types',
    description: 'API, database, web app, SFTP — labels used when adding a service.',
  },
] as const

export function ReferencePage() {
  return (
    <AdminLayout
      title="Reference data"
      subtitle="Shared catalogs used across projects — edit here, pick values when configuring services"
    >
      <ul className="reference-catalog-list">
        {catalogs.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="reference-catalog-card">
              <span className="reference-catalog-card__title">{item.title}</span>
              <span className="reference-catalog-card__desc">{item.description}</span>
              <span className="reference-catalog-card__action">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminLayout>
  )
}
