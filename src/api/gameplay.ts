import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { queryClient, queryKeys } from './queryClient'
import type {
  AnswerResponse,
  ChallengePublic,
  MyProgressResponse,
  UUID,
  ValidateScanResponse,
} from '../types/api'

const V1 = '/api/v1'

/**
 * QR proximity + anti-cheat gate; starts the waypoint and returns its
 * challenges (spec §8.8). Distinct error codes bubble up as ApiClientError.code:
 * OUT_OF_RANGE (403), INVALID_QR (404), QR_WAYPOINT_MISMATCH (400),
 * ALREADY_COMPLETED (409), SCAN_REJECTED (403).
 */
export function useValidateScan(waypointId: string) {
  return useMutation({
    mutationFn: (body: { token: UUID; lat: number; lng: number }) =>
      apiClient.post<ValidateScanResponse>(`${V1}/waypoints/${waypointId}/validate-scan`, body),
  })
}

/** Challenges for an already-started waypoint (requires progress row — 403 otherwise). */
export function useWaypointChallenges(waypointId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: waypointId
      ? queryKeys.waypointChallenges(waypointId)
      : ['waypoint', 'none', 'challenges'],
    queryFn: () => apiClient.get<ChallengePublic[]>(`${V1}/waypoints/${waypointId}/challenges`),
    enabled: !!waypointId && enabled,
    staleTime: 0, // gameplay content — always fresh
  })
}

export function useAnswerChallenge(missionId?: string) {
  return useMutation({
    mutationFn: (vars: { challengeId: UUID; selectedOptionId: UUID }) =>
      apiClient.post<AnswerResponse>(`${V1}/challenges/${vars.challengeId}/answer`, {
        selected_option_id: vars.selectedOptionId,
      }),
    onSuccess: () => {
      // A successful answer can complete waypoints/mission — invalidate the
      // mission detail and personal progress so the map/list reflect it (§7).
      if (missionId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.mission(missionId) })
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.myProgress })
    },
  })
}

export function useMyProgress() {
  return useQuery({
    queryKey: queryKeys.myProgress,
    queryFn: () => apiClient.get<MyProgressResponse>(`${V1}/me/progress`),
  })
}
