import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, ApiClientError } from '../../src/api/client'
import { useAuthStore } from '../../src/stores/authStore'

function mockResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe('apiClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    useAuthStore.getState().clearSession()
    fetchMock.mockReset()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('attaches the bearer token when authenticated', async () => {
    useAuthStore.getState().setAccessToken('tok123')
    fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }))
    await apiClient.get('/api/v1/account')
    const headers = fetchMock.mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer tok123')
  })

  it('omits the token for anonymous requests', async () => {
    useAuthStore.getState().setAccessToken('tok123')
    fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }))
    await apiClient.get('/api/v1/cities', { anonymous: true })
    const headers = fetchMock.mock.calls[0][1].headers as Headers
    expect(headers.get('Authorization')).toBeNull()
  })

  it('unwraps the nested {error:{...}} envelope into ApiClientError', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        { error: { code: 'OUT_OF_RANGE', message: 'Muy lejos', details: { distance_m: 42 } } },
        { status: 403 }
      )
    )
    await expect(
      apiClient.post('/api/v1/waypoints/w/validate-scan', {}, { anonymous: true })
    ).rejects.toMatchObject({
      code: 'OUT_OF_RANGE',
      status: 403,
      details: { distance_m: 42 },
    })
  })

  it('falls back to FastAPI {detail} shape', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ detail: 'boom' }, { status: 422 }))
    const err: unknown = await apiClient
      .get('/api/v1/x', { anonymous: true })
      .catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiClientError)
    expect((err as ApiClientError).code).toBe('VALIDATION_ERROR')
  })

  it('returns undefined for 204 No Content', async () => {
    useAuthStore.getState().setAccessToken('tok')
    fetchMock.mockResolvedValueOnce(mockResponse(null, { status: 204 }))
    await expect(apiClient.post('/api/v1/auth/logout')).resolves.toBeUndefined()
  })

  it('retries once via refresh on 401, then succeeds', async () => {
    useAuthStore.getState().setAccessToken('stale')
    fetchMock
      .mockResolvedValueOnce(mockResponse({ error: { code: 'X', message: 'x' } }, { status: 401 }))
      .mockResolvedValueOnce(mockResponse({ access_token: 'fresh' })) // /auth/refresh
      .mockResolvedValueOnce(mockResponse({ ok: true })) // retried request
    const res = await apiClient.get<{ ok: boolean }>('/api/v1/account')
    expect(res).toEqual({ ok: true })
    expect(useAuthStore.getState().accessToken).toBe('fresh')
  })
})
