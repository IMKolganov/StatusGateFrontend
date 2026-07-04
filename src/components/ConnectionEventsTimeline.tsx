import { type SyntheticEvent } from 'react'
import { eventClass, formatTimestamp } from './connectionEventsUtils'
import { useConnectionEvents } from './useConnectionEvents'
import './ConnectionEventsTimeline.css'

type ConnectionEventsTimelineProps = {
  componentId: string
  componentName: string
}

export function ConnectionEventsTimeline({
  componentId,
  componentName,
}: ConnectionEventsTimelineProps) {
  const { events, loading, error, total, hasMore, load, reset } = useConnectionEvents(componentId)

  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open) {
      void load()
      return
    }
    reset()
  }

  return (
    <details className="connection-events" onToggle={onToggle}>
      <summary className="connection-events__toggle">Connection log</summary>

      <div className="connection-events__panel">
        <div className="connection-events__header">
          <strong>{componentName}</strong>
          <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => void load()}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && <p className="alert error">{error}</p>}

        {loading && events.length === 0 && !error && (
          <p className="muted">Loading connection events…</p>
        )}

        {!loading && !error && events.length === 0 && (
          <p className="muted">No connection events yet. Events appear after the persistent session starts.</p>
        )}

        {events.length > 0 && (
          <>
            {hasMore && (
              <p className="muted connection-events__truncation">
                Showing latest {events.length} of {total} events.
              </p>
            )}
            <ol className="connection-events__list">
            {events.map((event) => (
              <li key={event.id} className={`connection-event ${eventClass(event.event_type)}`}>
                <div className="connection-event__main">
                  <span className="connection-event__label">{event.event_label}</span>
                  <time className="connection-event__time" dateTime={event.occurred_at}>
                    {formatTimestamp(event.occurred_at)}
                  </time>
                </div>
                {event.message && <p className="connection-event__message">{event.message}</p>}
                {event.outcome && event.outcome !== 'up' && (
                  <span className="connection-event__outcome">{event.outcome}</span>
                )}
              </li>
            ))}
            </ol>
          </>
        )}
      </div>
    </details>
  )
}
