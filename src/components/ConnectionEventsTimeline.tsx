import { useState, type SyntheticEvent } from 'react'
import type { ConnectionEventResponse } from '../api/client'
import { eventClass, formatTimestamp } from './connectionEventsUtils'
import { useConnectionEvents } from './useConnectionEvents'
import './ConnectionEventsTimeline.css'

type ConnectionEventsTimelineProps = {
  componentId: string
  componentName: string
}

function eventLogTail(details: ConnectionEventResponse['details']): string | null {
  if (!details || typeof details !== 'object') return null
  const raw = details.log_tail
  return typeof raw === 'string' && raw.trim() ? raw : null
}

function formatEventsForCopy(componentName: string, events: ConnectionEventResponse[]): string {
  const lines = [`${componentName} — connection log`, '']
  for (const event of events) {
    lines.push(`${event.event_label} · ${formatTimestamp(event.occurred_at)}`)
    if (event.outcome) lines.push(`outcome: ${event.outcome}`)
    if (event.message) lines.push(event.message)
    const logTail = eventLogTail(event.details)
    if (logTail) {
      lines.push('--- openvpn log ---')
      lines.push(logTail)
      lines.push('--- end log ---')
    }
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.left = '-9999px'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

export function ConnectionEventsTimeline({
  componentId,
  componentName,
}: ConnectionEventsTimelineProps) {
  const { events, loading, error, total, hasMore, load, reset } = useConnectionEvents(componentId)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (event.currentTarget.open) {
      void load()
      return
    }
    reset()
  }

  const onCopy = async () => {
    const ok = await copyText(formatEventsForCopy(componentName, events))
    setCopyState(ok ? 'copied' : 'failed')
    window.setTimeout(() => setCopyState('idle'), 1600)
  }

  return (
    <details className="connection-events" onToggle={onToggle}>
      <summary className="connection-events__toggle">Connection log</summary>

      <div className="connection-events__panel">
        <div className="connection-events__header">
          <strong>{componentName}</strong>
          <div className="connection-events__actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={loading || events.length === 0}
              onClick={() => void onCopy()}
            >
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled={loading} onClick={() => void load()}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
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
            {events.map((event) => {
              const logTail = eventLogTail(event.details)
              return (
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
                  {logTail && (
                    <pre className="connection-event__log">{logTail}</pre>
                  )}
                </li>
              )
            })}
            </ol>
          </>
        )}
      </div>
    </details>
  )
}
