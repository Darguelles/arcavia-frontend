import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import type { RouteRequest, WalkingRoute } from '../types/api'

const V1 = '/api/v1'

/**
 * Walking route from the player to a waypoint (spec §10 wayfinding). Proxied
 * through the backend — the browser never talks to the routing provider
 * directly. Fetched on demand (when the player taps "Cómo llegar"); on failure
 * the caller falls back to a straight-line guide. Coordinates go in the POST
 * body, never the URL.
 */
export function useWalkingRoute() {
  return useMutation({
    mutationFn: (body: RouteRequest) => apiClient.post<WalkingRoute>(`${V1}/route`, body),
  })
}
