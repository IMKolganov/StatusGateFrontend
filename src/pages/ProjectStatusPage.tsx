import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, type PublicProjectStatus } from '../api/client'
import { PublicLayout } from '../components/PublicLayout'
import { VpnNetworkDetails } from '../components/VpnNetworkDetails'
import { SystemStatusPanel } from '../components/SystemStatusPanel'
import './public.css'

const STATUS_LABELS: Record<string, string> = {
  up: 'Operational',
  down: 'Outage',
  degraded: 'Degraded',
  timeout: 'Timeout',
  error: 'Error',
  unknown: 'No data',
}

function formatCheckedAt(value: string | null | undefined): string | null {
  if (!value) return null
  return new Date(value).toLocaleString()
}

export function ProjectStatusPage() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<PublicProjectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    void api
      .getPublicProjectStatus(slug)
      .then(setProject)
      .catch((err: unknown) => {
        setProject(null)
        setError(err instanceof ApiError ? err.message : 'Failed to load project status')
      })
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <PublicLayout>
      <div className="page-top">
        <Link to="/" className="back-link">
          ← All projects
        </Link>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {error && <div className="alert error">{error}</div>}

      {project && (
        <>
          <header className="page-header">
            <div className="page-header-row">
              <div>
                <h1>{project.name}</h1>
                {project.description && <p className="page-lead">{project.description}</p>}
              </div>
              <Link to={`/projects/${project.slug}/history`} className="btn btn-secondary btn-sm">
                Incident history
              </Link>
            </div>
          </header>

          {slug && <SystemStatusPanel slug={slug} />}

          {project.services.length > 0 && (
            <section className="current-status">
              <h2>Current status</h2>
              <ul className="service-list">
                {project.services.map((service) => (
                  <li key={service.id} className="service-row">
                    <div className="service-main">
                      <span className={`status-dot status-${service.status}`} aria-hidden />
                      <div>
                        <div className="service-name">{service.name}</div>
                        <div className="service-meta">
                          {service.component_kind}
                          {service.environment ? ` · ${service.environment}` : ''}
                        </div>
                        {service.description && <div className="service-desc">{service.description}</div>}
                        {service.network_summary && (
                          <VpnNetworkDetails
                            summary={service.network_summary}
                            className="network-summary--service"
                            collapsible
                            defaultOpen={service.status !== 'up' && service.status !== 'degraded'}
                          />
                        )}
                      </div>
                    </div>
                    <div className="service-status">
                      <span className={`status-badge status-${service.status}`}>
                        {STATUS_LABELS[service.status] ?? service.status}
                      </span>
                      {service.latency_ms != null && (
                        <span className="service-latency">{service.latency_ms} ms</span>
                      )}
                      {formatCheckedAt(service.checked_at) && (
                        <span className="service-checked">Checked {formatCheckedAt(service.checked_at)}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </PublicLayout>
  )
}
