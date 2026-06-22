/** Keep in sync with backend MIN/MAX_SPEED_TEST_BYTES. */
export const MIN_SPEED_TEST_BYTES = 1_024
export const MAX_SPEED_TEST_BYTES = 52_428_800
export const DEFAULT_SPEED_TEST_MIB = 0.5

const MIN_SPEED_TEST_MIB = MIN_SPEED_TEST_BYTES / (1024 * 1024)
const MAX_SPEED_TEST_MIB = MAX_SPEED_TEST_BYTES / (1024 * 1024)

const MIB_INPUT_PATTERN = /^\d+(\.\d+)?$/

export function speedTestMibStringFromBytes(bytes: unknown): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return ''
  }
  const mib = Math.round((bytes / (1024 * 1024)) * 100) / 100
  return String(mib)
}

export function validateSpeedTestMibInput(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed === '') {
    return null
  }
  if (!MIB_INPUT_PATTERN.test(trimmed)) {
    return 'Speed test size must be a number in MiB (digits and an optional decimal point only).'
  }

  const mib = Number(trimmed)
  if (!Number.isFinite(mib) || mib <= 0) {
    return 'Speed test size must be greater than zero.'
  }
  if (mib < MIN_SPEED_TEST_MIB) {
    return `Speed test size must be at least ${MIN_SPEED_TEST_MIB.toFixed(3)} MiB (1 KiB).`
  }
  if (mib > MAX_SPEED_TEST_MIB) {
    return 'Speed test size cannot exceed 50 MiB.'
  }

  const bytes = Math.round(mib * 1024 * 1024)
  if (bytes < MIN_SPEED_TEST_BYTES || bytes > MAX_SPEED_TEST_BYTES) {
    return 'Speed test size is out of the allowed range (1 KiB to 50 MiB).'
  }

  return null
}

export function speedTestBytesFromMibInput(raw: string): number | null {
  if (validateSpeedTestMibInput(raw) !== null) {
    return null
  }
  const trimmed = raw.trim()
  if (trimmed === '') {
    return null
  }
  return Math.round(Number(trimmed) * 1024 * 1024)
}
