import type { PublicDayBar } from '../api/client'
import type { ThemeMode } from '../brand/theme'

const STATUS_COLORS: Record<ThemeMode, Record<string, string>> = {
  light: {
    operational: '#22c55e',
    degraded: '#eab308',
    outage: '#ef4444',
    no_data: 'rgba(221, 227, 237, 0.55)',
  },
  dark: {
    operational: '#22c55e',
    degraded: '#eab308',
    outage: '#ef4444',
    no_data: 'rgba(42, 53, 69, 0.75)',
  },
}

export function buildTimelineGradient(days: PublicDayBar[], theme: ThemeMode): string {
  if (days.length === 0) {
    return 'transparent'
  }

  const palette = STATUS_COLORS[theme]
  const step = 100 / days.length
  const stops: string[] = []

  days.forEach((day, index) => {
    const color = palette[day.status] ?? palette.no_data
    const start = (index * step).toFixed(4)
    const end = ((index + 1) * step).toFixed(4)
    stops.push(`${color} ${start}% ${end}%`)
  })

  return `linear-gradient(to right, ${stops.join(', ')})`
}

export function dayIndexFromPointer(clientX: number, rect: DOMRect, dayCount: number): number {
  if (dayCount <= 0) {
    return 0
  }

  const ratio = (clientX - rect.left) / rect.width
  const clamped = Math.min(1, Math.max(0, ratio))
  return Math.min(dayCount - 1, Math.floor(clamped * dayCount))
}

export function markerPositionPercent(index: number, dayCount: number): number {
  if (dayCount <= 0) {
    return 0
  }
  return ((index + 0.5) / dayCount) * 100
}
