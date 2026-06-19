import { ApiError } from '../api/client'

export function formatApiError(err: unknown, fallback = 'Request failed'): string {
  if (!(err instanceof ApiError)) return fallback
  if (err.detail && err.detail !== err.message) {
    return `${err.message} ${err.detail}`
  }
  return err.message
}
