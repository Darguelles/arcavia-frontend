import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { queryClient, queryKeys } from './queryClient'
import type {
  AnswerResponse,
  ChallengePublic,
  MyProgressResponse,
  UUID,
  WaypointProgressResponse,
} from '../types/api'

const V1 = '/api/v1'

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

/** Per-waypoint status — colours pins and lets the itinerary route only through
 * still-pending waypoints. */
export function useMyWaypointProgress() {
  return useQuery({
    queryKey: queryKeys.myWaypointProgress,
    queryFn: () => apiClient.get<WaypointProgressResponse>(`${V1}/me/waypoint-progress`),
  })
}
