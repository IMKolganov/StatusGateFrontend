import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SPEED_TEST_MIB,
  MAX_SPEED_TEST_BYTES,
  MIN_SPEED_TEST_BYTES,
  speedTestBytesFromMibInput,
  speedTestMibStringFromBytes,
  validateSpeedTestMibInput,
} from './speedTest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('speedTestMibStringFromBytes', () => {
  it('returns empty string for non-positive or non-finite values', () => {
    expect(speedTestMibStringFromBytes(null)).toBe('')
    expect(speedTestMibStringFromBytes(0)).toBe('')
    expect(speedTestMibStringFromBytes(-1)).toBe('')
    expect(speedTestMibStringFromBytes(Number.NaN)).toBe('')
  })

  it('formats bytes as MiB with up to two decimals', () => {
    expect(speedTestMibStringFromBytes(1024 * 1024)).toBe('1')
    expect(speedTestMibStringFromBytes(DEFAULT_SPEED_TEST_MIB * 1024 * 1024)).toBe('5')
  })
})

describe('validateSpeedTestMibInput', () => {
  it('allows empty input (optional field)', () => {
    expect(validateSpeedTestMibInput('')).toBeNull()
    expect(validateSpeedTestMibInput('   ')).toBeNull()
  })

  it('rejects non-numeric patterns', () => {
    expect(validateSpeedTestMibInput('1.2.3')).toMatch(/number in MiB/i)
    expect(validateSpeedTestMibInput('abc')).toMatch(/number in MiB/i)
  })

  it('rejects zero and out-of-range sizes', () => {
    expect(validateSpeedTestMibInput('0')).toMatch(/greater than zero/i)
    expect(validateSpeedTestMibInput('0.0001')).toMatch(/at least/i)
    expect(validateSpeedTestMibInput('51')).toMatch(/cannot exceed 50 MiB/i)
  })

  it('accepts values within 1 KiB–50 MiB', () => {
    expect(validateSpeedTestMibInput('0.5')).toBeNull()
    expect(validateSpeedTestMibInput('50')).toBeNull()
  })
})

describe('speedTestBytesFromMibInput', () => {
  it('returns null for invalid or empty input', () => {
    expect(speedTestBytesFromMibInput('')).toBeNull()
    expect(speedTestBytesFromMibInput('nope')).toBeNull()
  })

  it('converts valid MiB input to rounded bytes', () => {
    expect(speedTestBytesFromMibInput('1')).toBe(1024 * 1024)
    expect(speedTestBytesFromMibInput('0.5')).toBe(Math.round(0.5 * 1024 * 1024))
  })

  it('stays within backend byte bounds for edge values', () => {
    const minBytes = speedTestBytesFromMibInput((MIN_SPEED_TEST_BYTES / (1024 * 1024)).toFixed(6))
    const maxBytes = speedTestBytesFromMibInput('50')
    expect(minBytes).toBeGreaterThanOrEqual(MIN_SPEED_TEST_BYTES)
    expect(maxBytes).toBeLessThanOrEqual(MAX_SPEED_TEST_BYTES)
  })

  it('does not call fetch (pure conversion)', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(speedTestBytesFromMibInput('1')).toBe(1024 * 1024)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
