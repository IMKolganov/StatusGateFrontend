import { describe, expect, it } from 'vitest'
import { formatSpeedTestError } from './speedTestError'

describe('formatSpeedTestError', () => {
  it('returns a default when empty', () => {
    expect(formatSpeedTestError(null)).toBe('Speed test failed')
    expect(formatSpeedTestError('')).toBe('Speed test failed')
    expect(formatSpeedTestError('   ')).toBe('Speed test failed')
  })

  it('maps known HTTP client errors', () => {
    expect(formatSpeedTestError("Client error '429' for url")).toBe('Speed test rate limited (HTTP 429)')
    expect(formatSpeedTestError("Client error '403' for url")).toBe('Speed test blocked (HTTP 403)')
    expect(formatSpeedTestError("Client error '502' for url")).toBe('Speed test failed (HTTP 502)')
  })

  it('detects timeouts and preserves Speed test prefixes', () => {
    expect(formatSpeedTestError('Request timeout after 30s')).toBe('Speed test timed out')
    expect(formatSpeedTestError('Speed test aborted')).toBe('Speed test aborted')
    expect(formatSpeedTestError('something else')).toBe('Speed test failed')
  })
})
