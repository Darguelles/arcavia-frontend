import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import type {
  GeoCheckinStartResponse,
  GeoFixRequest,
  GeoFixResult,
  GeoKeywordSubmitRequest,
  GeoKeywordSubmitResult,
  GeoQrSubmitRequest,
} from '../types/api'

const V1 = '/api/v1'

/**
 * Geolocation check-in — geo dwell is the always-on presence proof for every
 * waypoint; requires_qr/requires_keyword (from the mission-detail waypoint)
 * indicate which optional additional factors this waypoint also needs.
 * Reconnecting after a tab reload (call start again) returns the existing
 * session rather than resetting progress — nothing is held in memory here.
 */
export function useStartGeoCheckin(waypointId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient.post<GeoCheckinStartResponse>(`${V1}/waypoints/${waypointId}/geo-checkin/start`),
  })
}

/** Submit a raw fix. maximumAge:0 is set by the caller — never send a cached position. */
export function useSubmitGeoFix(waypointId: string) {
  return useMutation({
    mutationFn: (body: GeoFixRequest) =>
      apiClient.post<GeoFixResult>(`${V1}/waypoints/${waypointId}/geo-checkin/fix`, body),
  })
}

/** Optional additional factor — independent of dwell timing. */
export function useSubmitGeoQr(waypointId: string) {
  return useMutation({
    mutationFn: (body: GeoQrSubmitRequest) =>
      apiClient.post<GeoFixResult>(`${V1}/waypoints/${waypointId}/geo-checkin/qr-submit`, body),
  })
}

/** Optional additional factor — gated behind dwell being satisfied server-side. */
export function useSubmitGeoKeyword(waypointId: string) {
  return useMutation({
    mutationFn: (body: GeoKeywordSubmitRequest) =>
      apiClient.post<GeoKeywordSubmitResult>(
        `${V1}/waypoints/${waypointId}/geo-checkin/keyword-submit`,
        body
      ),
  })
}
