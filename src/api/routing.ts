import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import type { RouteRequest, WalkingRoute } from '../types/api'

const V1 = '/api/v1'

/**
 * Walking route through ordered stops (spec §10 wayfinding). Two points is a
 * single "Cómo llegar" A→B route; more is a multi-stop mission route. Proxied
 * through the backend — the browser never talks to the routing provider
 * directly. Fetched on demand; on failure the caller falls back to straight
 * lines. Coordinates go in the POST body, never the URL.
 */
export function useWalkingRoute() {
  return useMutation({
    mutationFn: (body: RouteRequest) => apiClient.post<WalkingRoute>(`${V1}/route`, body),
  })
}
