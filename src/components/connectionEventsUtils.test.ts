import { describe, expect, it } from 'vitest'
import { eventClass, formatTimestamp } from './connectionEventsUtils'

describe('eventClass', () => {
  it('maps success events to ok class', () => {
    expect(eventClass('tunnel_up')).toBe('connection-event--ok')
    expect(eventClass('available')).toBe('connection-event--ok')
  })

  it('maps failure events to down class', () => {
    expect(eventClass('tunnel_down')).toBe('connection-event--down')
    expect(eventClass('connect_failed')).toBe('connection-event--down')
  })

  it('maps reconnect and degraded events', () => {
    expect(eventClass('reconnect')).toBe('connection-event--reconnect')
    expect(eventClass('unavailable')).toBe('connection-event--degraded')
  })

  it('falls back to neutral for unknown events', () => {
    expect(eventClass('unknown')).toBe('connection-event--neutral')
  })
})

describe('formatTimestamp', () => {
  it('formats ISO timestamps', () => {
    const formatted = formatTimestamp('2026-07-04T12:30:00.000Z')
    expect(formatted).toContain('2026')
  })

  it('returns original value when parsing fails', () => {
    expect(formatTimestamp('not-a-date')).toBe('not-a-date')
  })
})
