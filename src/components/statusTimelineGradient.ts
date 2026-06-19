import type { PublicDayBar } from '../api/client'
import type { ThemeMode } from '../brand/theme'

const FALLBACK_COLORS: Record<ThemeMode, Record<string, string>> = {
  light: {
    operational: '#22c55e',
    degraded: '#eab308',
    outage: '#ef4444',
    no_data: 'rgba(221, 227, 237, 0.75)',
    track: '#f8fafc',
  },
  dark: {
    operational: '#22c55e',
    degraded: '#eab308',
    outage: '#ef4444',
    no_data: 'rgba(42, 53, 69, 0.85)',
    track: '#1e2736',
  },
}

export function readStatusTimelineColors(theme: ThemeMode): Record<string, string> {
  const fallback = FALLBACK_COLORS[theme]
  if (typeof document === 'undefined') {
    return fallback
  }

  const style = getComputedStyle(document.documentElement)
  return {
    operational: style.getPropertyValue('--sg-status-operational').trim() || fallback.operational,
    degraded: style.getPropertyValue('--sg-status-degraded').trim() || fallback.degraded,
    outage: style.getPropertyValue('--sg-status-outage').trim() || fallback.outage,
    no_data: style.getPropertyValue('--sg-status-no-data').trim() || fallback.no_data,
    track: style.getPropertyValue('--sg-status-track').trim() || fallback.track,
  }
}

function timelineLayout(dayCount: number): { gap: number; segment: number } {
  if (dayCount <= 0) {
    return { gap: 0, segment: 0 }
  }
  const gap = dayCount > 45 ? 0.06 : 0.1
  const segment = (100 - gap * (dayCount - 1)) / dayCount
  return { gap, segment }
}

export function buildTimelineGradient(days: PublicDayBar[], theme: ThemeMode): string {
  if (days.length === 0) {
    return 'transparent'
  }

  const palette = readStatusTimelineColors(theme)
  const { gap, segment } = timelineLayout(days.length)
  const stops: string[] = []
  let position = 0

  days.forEach((day, index) => {
    const color = palette[day.status] ?? palette.no_data
    const start = position
    const end = position + segment
    stops.push(`${color} ${start.toFixed(4)}% ${end.toFixed(4)}%`)
    position = end

    if (index < days.length - 1) {
      const gapEnd = position + gap
      stops.push(`${palette.track} ${position.toFixed(4)}% ${gapEnd.toFixed(4)}%`)
      position = gapEnd
    }
  })

  return `linear-gradient(to right, ${stops.join(', ')})`
}

export function dayIndexFromPointer(clientX: number, rect: DOMRect, dayCount: number): number {
  if (dayCount <= 0) {
    return 0
  }

  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * 100
  const { gap, segment } = timelineLayout(dayCount)
  const step = segment + gap

  return Math.min(dayCount - 1, Math.max(0, Math.floor(ratio / step)))
}

export function markerPositionPercent(index: number, dayCount: number): number {
  if (dayCount <= 0) {
    return 0
  }

  const { gap, segment } = timelineLayout(dayCount)
  return index * (segment + gap) + segment / 2
}
