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
  const [trackedSlug, setTrackedSlug] = useState(slug)
  const [project, setProject] = useState<PublicProjectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailsExpanded, setDetailsExpanded] = useState<boolean | null>(null)

  if (slug !== trackedSlug) {
    setTrackedSlug(slug)
    setProject(null)
    setLoading(true)
    setError(null)
    setDetailsExpanded(null)
  }

  useEffect(() => {
    if (!slug) return
    void api
      .getPublicProjectStatus(slug)
      .then(setProject)
      .catch((err: unknown) => {
        setProject(null)
        setError(err instanceof ApiError ? err.message : 'Failed to load project status')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const statusGroups =
    project?.groups && project.groups.length > 0
      ? project.groups
      : project
        ? [{ name: '', sort_order: 0, services: project.services }]
        : []
  const hasCurrentStatus = Boolean(
    statusGroups.some((group) => group.services.length > 0),
  )
  const hasNetworkDetails = Boolean(
    statusGroups.some((group) => group.services.some((service) => service.network_summary)),
  )

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

          {hasCurrentStatus && (
            <section className="current-status">
              <div className="current-status-header">
                <h2>Current status</h2>
                {hasNetworkDetails && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setDetailsExpanded((current) => !(current ?? false))}
                  >
                    {detailsExpanded ? 'Collapse all details' : 'Expand all details'}
                  </button>
                )}
              </div>
          {statusGroups.map((group) => (
            <div key={(group.id ?? group.name) || 'all'} className="current-status-group">
              {group.name ? <h3 className="current-status-group-title">{group.name}</h3> : null}
              <ul className="service-list">
                {group.services.map((service) => (
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
                            expanded={detailsExpanded}
                            tunnelHref={`/projects/${project.slug}/services/${service.slug}/tunnel`}
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
            </div>
          ))}
            </section>
          )}
        </>
      )}
    </PublicLayout>
  )
}
