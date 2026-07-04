const API_BASE = ''

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

/** Maps Orval ApiResponse_* types to the payload returned after envelope unwrap. */
export type UnwrapApiResponse<T> = T extends { data?: infer D } ? NonNullable<D> : T

export class ApiError extends Error {
  status: number
  detail?: string
  traceId?: string

  constructor(message: string, status: number, detail?: string, traceId?: string) {
    super(message)
    this.status = status
    this.detail = detail
    this.traceId = traceId
  }
}

function parseEnvelope<T>(json: unknown, status: number): T {
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    const envelope = json as ApiEnvelope<T> & { data?: { detail?: string; trace_id?: string } }
    if (!envelope.success) {
      const errorData = envelope.data as { detail?: string; trace_id?: string } | null
      throw new ApiError(
        envelope.message || 'Request failed',
        status,
        errorData?.detail,
        errorData?.trace_id,
      )
    }
    return envelope.data
  }
  return json as T
}

async function tryRefreshSession(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  return response.ok
}

function shouldRetryWithRefresh(url: string): boolean {
  return !url.endsWith('/api/auth/me') && !url.endsWith('/api/auth/login')
}

export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const headers = new Headers(options.headers)
  if (options.body !== undefined && options.body !== null && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && shouldRetryWithRefresh(url)) {
    const refreshed = await tryRefreshSession()
    if (refreshed) {
      return customFetch<T>(url, options)
    }
  }

  if (!response.ok) {
    let detail = 'Request failed'
    let traceId: string | undefined
    try {
      const body: unknown = await response.json()
      if (body && typeof body === 'object' && 'success' in body) {
        parseEnvelope<never>(body, response.status)
      }
      if (body && typeof body === 'object') {
        detail = (body as { detail?: string; message?: string }).detail
          ?? (body as { message?: string }).message
          ?? detail
        traceId = (body as { data?: { trace_id?: string } }).data?.trace_id
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
    }
    throw new ApiError(detail, response.status, detail, traceId)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const json: unknown = await response.json()
  return parseEnvelope<T>(json, response.status)
}

export default customFetch
