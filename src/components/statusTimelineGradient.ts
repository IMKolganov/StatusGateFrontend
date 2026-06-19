import type { PublicDayBar } from '../api/client'
import type { ThemeMode } from '../brand/theme'

const STATUS_COLORS: Record<ThemeMode, Record<string, string>> = {
  light: {
    operational: '#22c55e',
    degraded: '#eab308',
    outage: '#ef4444',
    no_data: 'rgba(203, 213, 225, 0.9)',
  },
  dark: {
    operational: '#22c55e',
    degraded: '#eab308',
    outage: '#ef4444',
    no_data: 'rgba(58, 71, 92, 0.9)',
  },
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

  const palette = STATUS_COLORS[theme]
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
      stops.push(`transparent ${position.toFixed(4)}% ${gapEnd.toFixed(4)}%`)
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
