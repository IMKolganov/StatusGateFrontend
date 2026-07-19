/** Decade bucket for outage bar coloring: 0, 10, …, 90 (or null if unknown). */
export function outageAvailabilityBucket(percent: number | null | undefined): number | null {
  if (percent == null || Number.isNaN(percent)) return null
  const clamped = Math.min(99, Math.max(0, percent))
  return Math.floor(clamped / 10) * 10
}

export function outageBarClassName(
  status: string,
  availabilityPercent: number | null | undefined,
): string {
  if (status !== 'outage') return `status-bar-${status}`
  const bucket = outageAvailabilityBucket(availabilityPercent)
  if (bucket == null) return 'status-bar-outage'
  return `status-bar-outage status-bar-outage-${bucket}`
}

export function outagePopoverStatusClassName(
  status: string,
  availabilityPercent: number | null | undefined,
): string {
  if (status !== 'outage') return `status-timeline-popover-status-${status}`
  const bucket = outageAvailabilityBucket(availabilityPercent)
  if (bucket == null) return 'status-timeline-popover-status-outage'
  return `status-timeline-popover-status-outage status-timeline-popover-status-outage-${bucket}`
}
