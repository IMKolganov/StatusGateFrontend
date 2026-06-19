import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError, type PublicProjectHistory } from '../api/client'
import { PublicLayout } from '../components/PublicLayout'
import './public.css'

const STATUS_HINTS: Record<string, string> = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
  update: 'Update',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function ProjectHistoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [history, setHistory] = useState<PublicProjectHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    void api
      .getPublicProjectHistory(slug)
      .then(setHistory)
      .catch((err: unknown) => {
        setHistory(null)
        setError(err instanceof ApiError ? err.message : 'Failed to load history')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const monthHeaders = useMemo(() => {
    if (!history) return new Set<string>()
    const seen = new Set<string>()
    const headers = new Set<string>()
    for (const day of history.days) {
      const key = `${day.date.slice(0, 7)}`
      if (!seen.has(key)) {
        seen.add(key)
        headers.add(day.date)
      }
    }
    return headers
  }, [history])

  return (
    <PublicLayout>
      <div className="page-top history-top">
        <Link to={slug ? `/projects/${slug}` : '/'} className="back-link">
          ← Current status
        </Link>
      </div>

      {loading && <p className="muted">Loading history...</p>}
      {error && <div className="alert error">{error}</div>}

      {history && (
        <>
          <header className="page-header">
            <h1>{history.project_name}</h1>
            <p className="page-lead">Incident history</p>
          </header>

          {history.days.length === 0 ? (
            <div className="status-card">
              <p>No incidents recorded yet.</p>
            </div>
          ) : (
            <div className="history-timeline">
              {history.days.map((day) => (
                <section key={day.date} className="history-day">
                  {monthHeaders.has(day.date) && (
                    <h2 className="history-month">{day.month_label}</h2>
                  )}
                  <div className="history-day-header">
                    <span className="history-day-number">{day.day}</span>
                    <span className="history-weekday">{day.weekday_label}</span>
                  </div>
                  <ul className="history-entries">
                    {day.entries.map((entry) => (
                      <li key={entry.update_id} className="history-entry">
                        <h3 className="history-entry-title">{entry.title}</h3>
                        <div className="history-entry-meta">
                          <time dateTime={entry.posted_at}>{formatTime(entry.posted_at)}</time>
                          {entry.status !== 'update' && (
                            <span className={`history-status history-status-${entry.status}`}>
                              {STATUS_HINTS[entry.status] ?? entry.status}
                            </span>
                          )}
                        </div>
                        <p className="history-entry-message">{entry.message}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </PublicLayout>
  )
}
