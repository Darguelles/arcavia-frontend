import { API_BASE } from '../config'
import { useAuthStore } from '../stores/authStore'

/**
 * Typed error thrown by the API client. `code` mirrors the backend's stable
 * error codes (OUT_OF_RANGE, INVALID_QR, …) so screens can branch on them
 * rather than parsing messages — spec §8.8.
 */
export class ApiClientError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// Single-flight refresh: concurrent 401s share one /auth/refresh round-trip.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (!res.ok) return null
        const data = (await res.json()) as { access_token: string }
        useAuthStore.getState().setAccessToken(data.access_token)
        return data.access_token
      } catch {
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

/** Normalize both the AppError envelope `{error:{...}}` and FastAPI's `{detail}`. */
async function toApiError(res: Response): Promise<ApiClientError> {
  let code = 'UNKNOWN'
  let message = 'Ocurrió un error inesperado.'
  let details: Record<string, unknown> | undefined
  try {
    const body = await res.json()
    if (body?.error) {
      code = body.error.code ?? code
      message = body.error.message ?? message
      details = body.error.details ?? undefined
    } else if (body?.detail) {
      code = 'VALIDATION_ERROR'
      message = typeof body.detail === 'string' ? body.detail : message
      details = { detail: body.detail }
    }
  } catch {
    // non-JSON body — keep generic message
  }
  return new ApiClientError(res.status, code, message, details)
}

interface RequestOptions {
  // Skip attaching the bearer token (used by the auth endpoints themselves).
  anonymous?: boolean
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: RequestOptions = {},
  retry = true
): Promise<T> {
  const { accessToken, clearSession } = useAuthStore.getState()

  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (!opts.anonymous && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && retry && !opts.anonymous) {
    const newToken = await refreshAccessToken()
    if (!newToken) {
      clearSession()
      throw new ApiClientError(401, 'UNAUTHENTICATED', 'Tu sesión expiró.')
    }
    return request<T>(path, init, opts, false)
  }

  if (!res.ok) throw await toApiError(res)

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { method: 'GET' }, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(
      path,
      { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined },
      opts
    ),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(
      path,
      { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined },
      opts
    ),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { method: 'DELETE' }, opts),
}
