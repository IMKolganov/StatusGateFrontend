import { describe, expect, it } from 'vitest'
import {
  outageAvailabilityBucket,
  outageBarClassName,
  outagePopoverStatusClassName,
} from './outageAvailabilityBucket'

describe('outageAvailabilityBucket', () => {
  it('returns null for missing values', () => {
    expect(outageAvailabilityBucket(null)).toBeNull()
    expect(outageAvailabilityBucket(undefined)).toBeNull()
    expect(outageAvailabilityBucket(Number.NaN)).toBeNull()
  })

  it('maps availability into decade buckets', () => {
    expect(outageAvailabilityBucket(0)).toBe(0)
    expect(outageAvailabilityBucket(9.9)).toBe(0)
    expect(outageAvailabilityBucket(10)).toBe(10)
    expect(outageAvailabilityBucket(61.78)).toBe(60)
    expect(outageAvailabilityBucket(99.9)).toBe(90)
  })

  it('clamps out-of-range values', () => {
    expect(outageAvailabilityBucket(-5)).toBe(0)
    expect(outageAvailabilityBucket(100)).toBe(90)
    expect(outageAvailabilityBucket(150)).toBe(90)
  })
})

describe('outage bar class names', () => {
  it('keeps non-outage statuses unchanged', () => {
    expect(outageBarClassName('operational', 50)).toBe('status-bar-operational')
    expect(outageBarClassName('degraded', 80)).toBe('status-bar-degraded')
  })

  it('adds decade class for outage with availability', () => {
    expect(outageBarClassName('outage', 61.78)).toBe('status-bar-outage status-bar-outage-60')
    expect(outageBarClassName('outage', null)).toBe('status-bar-outage')
  })

  it('mirrors buckets on the popover status badge', () => {
    expect(outagePopoverStatusClassName('outage', 61.78)).toBe(
      'status-timeline-popover-status-outage status-timeline-popover-status-outage-60',
    )
    expect(outagePopoverStatusClassName('operational', 100)).toBe(
      'status-timeline-popover-status-operational',
    )
  })
})
