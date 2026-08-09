import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/mutator'
import { formatApiError } from './apiError'

describe('formatApiError', () => {
  it('returns fallback for non-ApiError values', () => {
    expect(formatApiError(new Error('nope'))).toBe('Request failed')
    expect(formatApiError('string', 'Custom')).toBe('Custom')
  })

  it('returns message when detail is missing or equal', () => {
    expect(formatApiError(new ApiError('Boom', 500))).toBe('Boom')
    expect(formatApiError(new ApiError('Boom', 500, 'Boom'))).toBe('Boom')
  })

  it('appends distinct detail to the message', () => {
    expect(formatApiError(new ApiError('Boom', 400, 'Invalid slug'))).toBe('Boom Invalid slug')
  })
})
