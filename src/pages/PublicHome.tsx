import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, type PublicProjectSummary } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { hasAdminPanelAccess } from '../auth/roles'
import { PublicLayout } from '../components/PublicLayout'
import './public.css'

function PublicHome() {
  const { account, loading: authLoading } = useAuth()
  const [projects, setProjects] = useState<PublicProjectSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api
      .listPublicProjects()
      .then((data) => setProjects(data ?? []))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PublicLayout>
      <header className="page-header">
        <h1>System status</h1>
        <p className="page-lead">Select a project to view service health</p>
      </header>

      {!authLoading && account && (
        <div className="status-card public-welcome">
          <p>
            Signed in as <strong>{account.email}</strong>
          </p>
          <p className="muted">
            Open your account to manage subscriptions when they are available.
          </p>
          <div className="public-welcome__actions">
            <Link to="/account" className="btn btn-secondary btn-sm">
              Your account
            </Link>
            {hasAdminPanelAccess(account) && (
              <Link to="/admin" className="btn btn-ghost btn-sm">
                Admin panel
              </Link>
            )}
          </div>
        </div>
      )}

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p className="muted">Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="status-card">
          <p>No active projects yet.</p>
          <p className="muted">Projects will appear here once they are published in the admin panel.</p>
        </div>
      ) : (
        <ul className="project-list">
          {projects.map((project) => (
            <li key={project.id}>
              <Link to={`/projects/${project.slug}`} className="project-card">
                <span className="project-card-name">{project.name}</span>
                {project.description && <span className="project-card-desc">{project.description}</span>}
                <span className="project-card-action">View services →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PublicLayout>
  )
}

export default PublicHome
