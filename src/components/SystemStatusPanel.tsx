import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, ApiError, type PublicDayBar, type PublicSystemStatus } from '../api/client'
import { outageBarClassName, outagePopoverStatusClassName } from './outageAvailabilityBucket'

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

function formatDowntime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

function formatAvailabilityLine(day: PublicDayBar): string {
  if ((day.check_count ?? 0) === 0) return 'No monitoring data'
  if ((day.downtime_seconds ?? 0) === 0) return 'Available all day'
  return `Unavailable ~${formatDowntime(day.downtime_seconds ?? 0)}`
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'operational':
      return 'Operational'
    case 'degraded':
      return 'Degraded'
    case 'outage':
      return 'Outage'
    case 'no_data':
      return 'No data'
    default:
      return status
  }
}

function buildDayDetailText(
  day: PublicDayBar,
  scopeLabel: string,
  showAvailabilityDetail: boolean,
): string {
  const lines = [
    formatDayLabel(day.date),
    `Scope: ${scopeLabel}`,
    `Status: ${formatStatusLabel(day.status)}`,
    day.tooltip,
  ]

  if (showAvailabilityDetail) {
    lines.push(formatAvailabilityLine(day))
    if (day.check_count != null) lines.push(`Checks: ${day.check_count}`)
    if (day.failed_count != null) lines.push(`Failed: ${day.failed_count}`)
    if (day.degraded_count != null) lines.push(`Degraded: ${day.degraded_count}`)
    if (day.availability_percent != null) lines.push(`Availability: ${day.availability_percent.toFixed(2)}%`)
    if (day.downtime_seconds != null) lines.push(`Downtime: ${formatDowntime(day.downtime_seconds)}`)
  }

  if (day.incidents && day.incidents.length > 0) {
    lines.push('', 'Incidents:')
    for (const incident of day.incidents) {
      lines.push(`- ${incident.title} (${incident.status})`)
      if (incident.message) lines.push(`  ${incident.message}`)
    }
  }

  return lines.join('\n')
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

type TimelineTooltipProps = {
  day: PublicDayBar
  anchorRect: DOMRect
  showAvailabilityDetail?: boolean
}

function TimelineTooltip({ day, anchorRect, showAvailabilityDetail }: TimelineTooltipProps) {
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
      {showAvailabilityDetail && (
        <p className="status-timeline-tooltip-availability">{formatAvailabilityLine(day)}</p>
      )}
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
      <p className="status-timeline-tooltip-hint">Click for details</p>
    </div>
  )
}

type DayDetailPopoverProps = {
  day: PublicDayBar
  scopeLabel: string
  showAvailabilityDetail: boolean
  anchorRect: DOMRect
  returnFocusEl: HTMLElement | null
  onClose: () => void
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
}

function clampPopoverPosition(anchorRect: DOMRect): { left: number; top: number; width: number } {
  const margin = 12
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const width = Math.min(22 * 16, viewportWidth - margin * 2)
  const centerX = anchorRect.left + anchorRect.width / 2
  const left = Math.min(Math.max(centerX - width / 2, margin), viewportWidth - width - margin)
  const top = Math.max(anchorRect.top - 8, margin)
  return { left, top, width }
}

function DayDetailPopover({
  day,
  scopeLabel,
  showAvailabilityDetail,
  anchorRect,
  returnFocusEl,
  onClose,
}: DayDetailPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const copyResetTimerRef = useRef<number | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const detailText = useMemo(
    () => buildDayDetailText(day, scopeLabel, showAvailabilityDetail),
    [day, scopeLabel, showAvailabilityDetail],
  )
  const { left, top, width } = clampPopoverPosition(anchorRect)

  const close = useCallback(() => {
    onClose()
    window.requestAnimationFrame(() => {
      returnFocusEl?.focus()
    })
  }, [onClose, returnFocusEl])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = getFocusableElements(panelRef.current)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const active = document.activeElement as HTMLElement | null
      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !panelRef.current.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      // Status bars manage open/close via their own click handler (including toggle).
      if (target.closest('.status-bar')) return
      if (panelRef.current && !panelRef.current.contains(target)) {
        close()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    // Defer so the opening click does not immediately dismiss the popover.
    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [close])

  useEffect(() => {
    const focusable = panelRef.current ? getFocusableElements(panelRef.current) : []
    ;(focusable[0] ?? panelRef.current)?.focus()
  }, [])

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current != null) {
        window.clearTimeout(copyResetTimerRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    const ok = await copyText(detailText)
    setCopyState(ok ? 'copied' : 'failed')
    if (copyResetTimerRef.current != null) {
      window.clearTimeout(copyResetTimerRef.current)
    }
    copyResetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle')
      copyResetTimerRef.current = null
    }, 1600)
  }

  return (
    <div
      ref={panelRef}
      className="status-timeline-popover"
      style={{ left, top, width }}
      role="dialog"
      aria-modal="true"
      aria-label={`Status details for ${formatDayLabel(day.date)}`}
      tabIndex={-1}
    >
      <div className="status-timeline-popover-header">
        <div>
          <div className="status-timeline-popover-date">{formatDayLabel(day.date)}</div>
          <div className="status-timeline-popover-scope">{scopeLabel}</div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={close} aria-label="Close">
          ✕
        </button>
      </div>

      <div className={outagePopoverStatusClassName(day.status, day.availability_percent)}>
        {formatStatusLabel(day.status)}
      </div>

      <p className="status-timeline-popover-summary">{day.tooltip}</p>
      {showAvailabilityDetail && (
        <p className="status-timeline-popover-availability">{formatAvailabilityLine(day)}</p>
      )}

      {showAvailabilityDetail && (
        <dl className="status-timeline-popover-metrics">
          {day.check_count != null && (
            <>
              <dt>Checks</dt>
              <dd>{day.check_count}</dd>
            </>
          )}
          {day.failed_count != null && (
            <>
              <dt>Failed</dt>
              <dd>{day.failed_count}</dd>
            </>
          )}
          {day.degraded_count != null && (
            <>
              <dt>Degraded</dt>
              <dd>{day.degraded_count}</dd>
            </>
          )}
          {day.availability_percent != null && (
            <>
              <dt>Availability</dt>
              <dd>{day.availability_percent.toFixed(2)}%</dd>
            </>
          )}
          {day.downtime_seconds != null && (
            <>
              <dt>Downtime</dt>
              <dd>{formatDowntime(day.downtime_seconds)}</dd>
            </>
          )}
        </dl>
      )}

      {day.incidents && day.incidents.length > 0 && (
        <ul className="status-timeline-popover-list">
          {day.incidents.map((incident, index) => (
            <li key={`${incident.posted_at}-${index}`}>
              <div className="status-timeline-popover-title">{incident.title}</div>
              <div className="status-timeline-popover-message">{incident.message}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="status-timeline-popover-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void handleCopy()}>
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy details'}
        </button>
      </div>
    </div>
  )
}

type DayBarsProps = {
  days: PublicDayBar[]
  todayIso: string
  selectedKey: string | null
  selectionPrefix: string
  onHoverDay: (day: PublicDayBar | null, anchor?: DOMRect) => void
  onSelectDay: (day: PublicDayBar, anchor: DOMRect, trigger: HTMLElement) => void
}

function DayBars({ days, todayIso, selectedKey, selectionPrefix, onHoverDay, onSelectDay }: DayBarsProps) {
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
          const dayKey = `${selectionPrefix}::${day.date}`
          const isSelected = selectedKey === dayKey
          return (
            <button
              key={day.date}
              type="button"
              className={`status-bar ${outageBarClassName(day.status, day.availability_percent)}${isFuture ? ' status-bar-future' : ''}${isSelected ? ' status-bar-selected' : ''}`}
              disabled={isFuture}
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
              onClick={(event) => {
                if (!isFuture) {
                  onSelectDay(day, event.currentTarget.getBoundingClientRect(), event.currentTarget)
                }
              }}
              aria-label={`${formatDayLabel(day.date)}: ${day.tooltip}`}
              aria-haspopup="dialog"
              aria-expanded={isSelected}
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
  selectedKey: string | null
  selectionPrefix: string
  onHoverDay: (day: PublicDayBar | null, anchor?: DOMRect, showAvailabilityDetail?: boolean) => void
  onSelectDay: (
    day: PublicDayBar,
    anchor: DOMRect,
    trigger: HTMLElement,
    scopeLabel: string,
    selectionPrefix: string,
    groupName: string,
    showAvailabilityDetail?: boolean,
  ) => void
  groupName: string
  nested?: boolean
}

function TimelineRow({
  title,
  meta,
  uptimePercent,
  days,
  todayIso,
  selectedKey,
  selectionPrefix,
  onHoverDay,
  onSelectDay,
  groupName,
  nested,
}: TimelineRowProps) {
  const handleHoverDay = useCallback(
    (day: PublicDayBar | null, anchor?: DOMRect) => {
      onHoverDay(day, anchor, nested)
    },
    [nested, onHoverDay],
  )

  const handleSelectDay = useCallback(
    (day: PublicDayBar, anchor: DOMRect, trigger: HTMLElement) => {
      onSelectDay(day, anchor, trigger, title, selectionPrefix, groupName, nested)
    },
    [groupName, nested, onSelectDay, selectionPrefix, title],
  )

  return (
    <div className={`status-timeline-row${nested ? ' status-timeline-row-nested' : ''}`}>
      <div className="status-timeline-label">
        <div className="status-timeline-title">{title}</div>
        {meta && <div className="status-timeline-meta">{meta}</div>}
      </div>
      {uptimePercent != null && (
        <div className="status-timeline-uptime">{uptimePercent.toFixed(2)}% uptime</div>
      )}
      <DayBars
        days={days}
        todayIso={todayIso}
        selectedKey={selectedKey}
        selectionPrefix={selectionPrefix}
        onHoverDay={handleHoverDay}
        onSelectDay={handleSelectDay}
      />
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
  const todayIso = toIsoDate(today)
  const monthEnd = useMemo(() => endOfUtcMonth(viewMonth), [viewMonth])
  const dayCount = useMemo(() => daysInclusive(viewMonth, monthEnd), [viewMonth, monthEnd])
  const fetchKey = `${slug}:${toIsoDate(monthEnd)}:${dayCount}`
  const [trackedFetchKey, setTrackedFetchKey] = useState(fetchKey)
  const [systemStatus, setSystemStatus] = useState<PublicSystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [tooltip, setTooltip] = useState<{
    day: PublicDayBar
    anchorRect: DOMRect
    showAvailabilityDetail: boolean
  } | null>(null)
  const [detail, setDetail] = useState<{
    day: PublicDayBar
    scopeLabel: string
    selectionKey: string
    groupName: string
    anchorRect: DOMRect
    returnFocusEl: HTMLElement | null
    showAvailabilityDetail: boolean
  } | null>(null)

  if (trackedFetchKey !== fetchKey) {
    setTrackedFetchKey(fetchKey)
    setSystemStatus(null)
    setLoading(true)
    setError(null)
    setDetail(null)
  }

  const canMoveForward = !isSameUtcMonth(viewMonth, today)

  useEffect(() => {
    void api
      .getPublicSystemStatus(slug, { end: toIsoDate(monthEnd), days: dayCount })
      .then(setSystemStatus)
      .catch((err: unknown) => {
        setSystemStatus(null)
        setError(err instanceof ApiError ? err.message : 'Failed to load system status')
      })
      .finally(() => setLoading(false))
  }, [slug, monthEnd, dayCount])

  const handleHoverDay = useCallback(
    (day: PublicDayBar | null, anchor?: DOMRect, showAvailabilityDetail = false) => {
      if (detail) {
        setTooltip(null)
        return
      }
      if (day && anchor) {
        setTooltip({ day, anchorRect: anchor, showAvailabilityDetail })
        return
      }
      setTooltip(null)
    },
    [detail],
  )

  const handleSelectDay = useCallback(
    (
      day: PublicDayBar,
      anchor: DOMRect,
      trigger: HTMLElement,
      scopeLabel: string,
      selectionPrefix: string,
      groupName: string,
      showAvailabilityDetail = false,
    ) => {
      const selectionKey = `${selectionPrefix}::${day.date}`
      setTooltip(null)
      setDetail((current) => {
        if (current && current.selectionKey === selectionKey) {
          window.requestAnimationFrame(() => trigger.focus())
          return null
        }
        return {
          day,
          scopeLabel,
          selectionKey,
          groupName,
          anchorRect: anchor,
          returnFocusEl: trigger,
          showAvailabilityDetail,
        }
      })
    },
    [],
  )

  const closeDetail = useCallback(() => setDetail(null), [])

  const moveRange = (direction: -1 | 1) => {
    setViewMonth((current) => {
      const next = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + direction, 1))
      if (direction > 0 && next.getTime() > startOfUtcMonth(today).getTime()) {
        return startOfUtcMonth(today)
      }
      return next
    })
    setDetail(null)
  }

  const toggleGroup = (name: string) => {
    setExpandedGroups((current) => {
      const nextExpanded = !(current[name] ?? false)
      if (!nextExpanded) {
        setDetail((detailState) => {
          if (detailState?.groupName !== name) return detailState
          const el = detailState.returnFocusEl
          window.requestAnimationFrame(() => el?.focus())
          return null
        })
      }
      return { ...current, [name]: nextExpanded }
    })
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
                        selectedKey={detail?.selectionKey ?? null}
                        selectionPrefix={`group:${group.name}`}
                        groupName={group.name}
                        onHoverDay={handleHoverDay}
                        onSelectDay={handleSelectDay}
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
                            selectedKey={detail?.selectionKey ?? null}
                            selectionPrefix={`service:${service.id}`}
                            groupName={group.name}
                            onHoverDay={handleHoverDay}
                            onSelectDay={handleSelectDay}
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

      {tooltip && !detail && (
        <TimelineTooltip
          day={tooltip.day}
          anchorRect={tooltip.anchorRect}
          showAvailabilityDetail={tooltip.showAvailabilityDetail}
        />
      )}

      {detail && (
        <DayDetailPopover
          key={detail.selectionKey}
          day={detail.day}
          scopeLabel={detail.scopeLabel}
          showAvailabilityDetail={detail.showAvailabilityDetail}
          anchorRect={detail.anchorRect}
          returnFocusEl={detail.returnFocusEl}
          onClose={closeDetail}
        />
      )}
    </section>
  )
}
