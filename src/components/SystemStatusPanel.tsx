import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, type PublicDayBar, type PublicSystemStatus } from '../api/client'

function formatDayLabel(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function endOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
}

function daysInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function isSameUtcMonth(left: Date, right: Date): boolean {
  return left.getUTCFullYear() === right.getUTCFullYear() && left.getUTCMonth() === right.getUTCMonth()
}

type TimelineTooltipProps = {
  day: PublicDayBar
  anchorRect: DOMRect
}

function TimelineTooltip({ day, anchorRect }: TimelineTooltipProps) {
  const left = anchorRect.left + anchorRect.width / 2
  const top = anchorRect.top - 8

  return (
    <div
      className="status-timeline-tooltip"
      style={{ left, top }}
      role="tooltip"
    >
      <div className="status-timeline-tooltip-date">{formatDayLabel(day.date)}</div>
      <p className="status-timeline-tooltip-summary">{day.tooltip}</p>
      {day.incidents && day.incidents.length > 0 && (
        <ul className="status-timeline-tooltip-list">
          {day.incidents.map((incident, index) => (
            <li key={`${incident.posted_at}-${index}`}>
              <div className="status-timeline-tooltip-title">{incident.title}</div>
              <div className="status-timeline-tooltip-message">{incident.message}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type DayBarsProps = {
  days: PublicDayBar[]
  todayIso: string
  onHoverDay: (day: PublicDayBar | null, anchor?: DOMRect) => void
}

function DayBars({ days, todayIso, onHoverDay }: DayBarsProps) {
  return (
    <div className="status-timeline-bars-shell">
      <div
        className="status-timeline-bars"
        style={{ ['--timeline-days' as string]: String(Math.max(days.length, 1)) }}
        aria-hidden={days.length === 0}
        aria-label="Daily uptime timeline"
      >
        {days.map((day) => {
          const isFuture = day.date > todayIso
          return (
            <span
              key={day.date}
              className={`status-bar status-bar-${day.status}${isFuture ? ' status-bar-future' : ''}`}
              onMouseEnter={(event) => {
                if (!isFuture) {
                  onHoverDay(day, event.currentTarget.getBoundingClientRect())
                }
              }}
              onMouseLeave={() => onHoverDay(null)}
              onFocus={(event) => {
                if (!isFuture) {
                  onHoverDay(day, event.currentTarget.getBoundingClientRect())
                }
              }}
              onBlur={() => onHoverDay(null)}
              tabIndex={isFuture ? -1 : 0}
              aria-label={`${formatDayLabel(day.date)}: ${day.tooltip}`}
            />
          )
        })}
      </div>
    </div>
  )
}

type TimelineRowProps = {
  title: string
  meta?: string
  uptimePercent: number | null | undefined
  days: PublicDayBar[]
  todayIso: string
  onHoverDay: (day: PublicDayBar | null, anchor?: DOMRect) => void
  nested?: boolean
}

function TimelineRow({ title, meta, uptimePercent, days, todayIso, onHoverDay, nested }: TimelineRowProps) {
  return (
    <div className={`status-timeline-row${nested ? ' status-timeline-row-nested' : ''}`}>
      <div className="status-timeline-label">
        <div className="status-timeline-title">{title}</div>
        {meta && <div className="status-timeline-meta">{meta}</div>}
      </div>
      {uptimePercent != null && (
        <div className="status-timeline-uptime">{uptimePercent.toFixed(2)}% uptime</div>
      )}
      <DayBars days={days} todayIso={todayIso} onHoverDay={onHoverDay} />
    </div>
  )
}

type SystemStatusPanelProps = {
  slug: string
  embedded?: boolean
}

export function SystemStatusPanel({ slug, embedded = false }: SystemStatusPanelProps) {
  const today = useMemo(() => startOfUtcDay(new Date()), [])
  const [viewMonth, setViewMonth] = useState(() => startOfUtcMonth(new Date()))
  const [systemStatus, setSystemStatus] = useState<PublicSystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [tooltip, setTooltip] = useState<{ day: PublicDayBar; anchorRect: DOMRect } | null>(null)

  const todayIso = toIsoDate(today)
  const monthEnd = useMemo(() => endOfUtcMonth(viewMonth), [viewMonth])
  const dayCount = useMemo(() => daysInclusive(viewMonth, monthEnd), [viewMonth, monthEnd])
  const canMoveForward = !isSameUtcMonth(viewMonth, today)

  useEffect(() => {
    setLoading(true)
    setError(null)
    void api
      .getPublicSystemStatus(slug, { end: toIsoDate(monthEnd), days: dayCount })
      .then(setSystemStatus)
      .catch((err: unknown) => {
        setSystemStatus(null)
        setError(err instanceof ApiError ? err.message : 'Failed to load system status')
      })
      .finally(() => setLoading(false))
  }, [slug, monthEnd, dayCount])

  const handleHoverDay = useCallback((day: PublicDayBar | null, anchor?: DOMRect) => {
    if (day && anchor) {
      setTooltip({ day, anchorRect: anchor })
      return
    }
    setTooltip(null)
  }, [])

  const moveRange = (direction: -1 | 1) => {
    setViewMonth((current) => {
      const next = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + direction, 1))
      if (direction > 0 && next.getTime() > startOfUtcMonth(today).getTime()) {
        return startOfUtcMonth(today)
      }
      return next
    })
  }

  const toggleGroup = (name: string) => {
    setExpandedGroups((current) => ({ ...current, [name]: !current[name] }))
  }

  return (
    <section className={`system-status${embedded ? ' system-status--embedded' : ''}`}>
      <div className="system-status-header">
        <h2>System status</h2>
        <div className="system-status-nav">
          <button
            type="button"
            className="btn btn-secondary btn-sm system-status-nav-btn"
            aria-label="Previous month"
            onClick={() => moveRange(-1)}
          >
            ←
          </button>
          <span className="system-status-range">
            {systemStatus?.range_label ?? formatMonthLabel(viewMonth)}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm system-status-nav-btn"
            aria-label="Next month"
            onClick={() => moveRange(1)}
            disabled={!canMoveForward}
          >
            →
          </button>
        </div>
      </div>

      {loading && <p className="muted">Loading timeline...</p>}
      {error && <div className="alert error">{error}</div>}

      {systemStatus && !loading && (
        <>
          {(systemStatus.active_alerts?.length ?? 0) > 0 && (
            <div className="system-status-alerts">
              <div className="system-status-alerts-title">We&apos;re currently experiencing issues</div>
              <ul className="system-status-alerts-list">
                {systemStatus.active_alerts?.map((alert) => (
                  <li key={`${alert.title}-${alert.since ?? alert.status}`}>
                    <div className="system-status-alert-title">{alert.title}</div>
                    <div className="system-status-alert-message">{alert.message}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {systemStatus.groups.length === 0 ? (
            <div className="status-card">
              <p>No monitored services in this project yet.</p>
            </div>
          ) : (
            <div className="status-timeline-groups">
              {systemStatus.groups.map((group) => {
                const expanded = expandedGroups[group.name] ?? false
                const meta = `${group.component_count} component${group.component_count === 1 ? '' : 's'}`
                return (
                  <div key={group.name} className="status-timeline-group">
                    <div className="status-timeline-group-header">
                      <button
                        type="button"
                        className="status-timeline-chevron-btn"
                        aria-expanded={expanded}
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${group.name}`}
                        onClick={() => toggleGroup(group.name)}
                      >
                        <span className={`status-timeline-chevron${expanded ? ' expanded' : ''}`} aria-hidden>
                          ›
                        </span>
                      </button>
                      <TimelineRow
                        title={group.name}
                        meta={meta}
                        uptimePercent={group.uptime_percent}
                        days={group.days}
                        todayIso={todayIso}
                        onHoverDay={handleHoverDay}
                      />
                    </div>
                    {expanded && (
                      <div className="status-timeline-services">
                        {group.services.map((service) => (
                          <TimelineRow
                            key={service.id}
                            title={service.name}
                            uptimePercent={service.uptime_percent}
                            days={service.days}
                            todayIso={todayIso}
                            onHoverDay={handleHoverDay}
                            nested
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tooltip && <TimelineTooltip day={tooltip.day} anchorRect={tooltip.anchorRect} />}
    </section>
  )
}
