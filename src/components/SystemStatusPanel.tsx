import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { api, ApiError, type PublicDayBar, type PublicSystemStatus } from '../api/client'
import { useTheme } from '../brand/theme'
import {
  buildTimelineGradient,
  dayIndexFromPointer,
  markerPositionPercent,
} from './statusTimelineGradient'

const DEFAULT_DAYS = 90

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
  onHoverDay: (day: PublicDayBar | null, anchor?: DOMRect) => void
}

function DayBars({ days, onHoverDay }: DayBarsProps) {
  const { theme } = useTheme()
  const barRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const gradient = useMemo(() => buildTimelineGradient(days, theme), [days, theme])

  const updateActiveDay = useCallback(
    (index: number | null) => {
      if (index == null || index < 0 || index >= days.length) {
        setActiveIndex(null)
        onHoverDay(null)
        return
      }
      setActiveIndex(index)
      const bar = barRef.current
      if (!bar) {
        onHoverDay(days[index])
        return
      }
      const rect = bar.getBoundingClientRect()
      const left = rect.left + (rect.width * (index + 0.5)) / days.length
      onHoverDay(days[index], new DOMRect(left - 1, rect.top, 2, rect.height))
    },
    [days, onHoverDay],
  )

  const handlePointer = useCallback(
    (clientX: number) => {
      const bar = barRef.current
      if (!bar || days.length === 0) {
        return
      }
      const index = dayIndexFromPointer(clientX, bar.getBoundingClientRect(), days.length)
      updateActiveDay(index)
    },
    [days.length, updateActiveDay],
  )

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (days.length === 0) {
      return
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const current = activeIndex ?? 0
      const next = event.key === 'ArrowRight' ? Math.min(days.length - 1, current + 1) : Math.max(0, current - 1)
      updateActiveDay(next)
    }
  }

  useEffect(() => {
    setActiveIndex(null)
    onHoverDay(null)
  }, [days, onHoverDay])

  return (
    <div className="status-timeline-bars-shell">
      <div
        ref={barRef}
        className="status-timeline-gradient-bar"
        style={{ background: gradient }}
        role="img"
        aria-label="Daily uptime timeline"
        tabIndex={days.length > 0 ? 0 : -1}
        onMouseMove={(event) => handlePointer(event.clientX)}
        onMouseLeave={() => updateActiveDay(null)}
        onFocus={() => updateActiveDay(activeIndex ?? 0)}
        onBlur={() => updateActiveDay(null)}
        onKeyDown={handleKeyDown}
        onTouchStart={(event) => {
          const touch = event.touches[0]
          if (touch) {
            handlePointer(touch.clientX)
          }
        }}
        onTouchMove={(event) => {
          const touch = event.touches[0]
          if (touch) {
            handlePointer(touch.clientX)
          }
        }}
        onTouchEnd={() => updateActiveDay(null)}
      >
        {activeIndex != null && days.length > 0 && (
          <span
            className="status-timeline-gradient-marker"
            style={{ left: `${markerPositionPercent(activeIndex, days.length)}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  )
}

type TimelineRowProps = {
  title: string
  meta?: string
  uptimePercent: number | null | undefined
  days: PublicDayBar[]
  onHoverDay: (day: PublicDayBar | null, anchor?: DOMRect) => void
  nested?: boolean
}

function TimelineRow({ title, meta, uptimePercent, days, onHoverDay, nested }: TimelineRowProps) {
  return (
    <div className={`status-timeline-row${nested ? ' status-timeline-row-nested' : ''}`}>
      <div className="status-timeline-label">
        <div className="status-timeline-title">{title}</div>
        {meta && <div className="status-timeline-meta">{meta}</div>}
      </div>
      {uptimePercent != null && (
        <div className="status-timeline-uptime">{uptimePercent.toFixed(2)}% uptime</div>
      )}
      <DayBars days={days} onHoverDay={onHoverDay} />
    </div>
  )
}

type SystemStatusPanelProps = {
  slug: string
  embedded?: boolean
}

export function SystemStatusPanel({ slug, embedded = false }: SystemStatusPanelProps) {
  const today = useMemo(() => startOfUtcDay(new Date()), [])
  const [rangeEnd, setRangeEnd] = useState(today)
  const [systemStatus, setSystemStatus] = useState<PublicSystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [tooltip, setTooltip] = useState<{ day: PublicDayBar; anchorRect: DOMRect } | null>(null)

  const canMoveForward = rangeEnd.getTime() < today.getTime()

  useEffect(() => {
    setLoading(true)
    setError(null)
    void api
      .getPublicSystemStatus(slug, { end: toIsoDate(rangeEnd), days: DEFAULT_DAYS })
      .then(setSystemStatus)
      .catch((err: unknown) => {
        setSystemStatus(null)
        setError(err instanceof ApiError ? err.message : 'Failed to load system status')
      })
      .finally(() => setLoading(false))
  }, [slug, rangeEnd])

  const handleHoverDay = useCallback((day: PublicDayBar | null, anchor?: DOMRect) => {
    if (day && anchor) {
      setTooltip({ day, anchorRect: anchor })
      return
    }
    setTooltip(null)
  }, [])

  const moveRange = (direction: -1 | 1) => {
    setRangeEnd((current) => {
      const next = new Date(current)
      next.setUTCDate(next.getUTCDate() + direction * DEFAULT_DAYS)
      if (next.getTime() > today.getTime()) {
        return today
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
            aria-label="Previous period"
            onClick={() => moveRange(-1)}
          >
            ←
          </button>
          <span className="system-status-range">
            {systemStatus?.range_label ?? `${DEFAULT_DAYS} days`}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm system-status-nav-btn"
            aria-label="Next period"
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
