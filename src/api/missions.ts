import { useQueries, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { queryKeys } from './queryClient'
import type { MissionCard, MissionDetail } from '../types/api'

const V1 = '/api/v1'

/**
 * Missions across every active campaign of a city, flattened. Missions belong to
 * campaigns (§0), so the city list view fans out one query per campaign and
 * concatenates — each is cached independently under its own key.
 */
export function useMissionsForCampaigns(campaignIds: string[]) {
  return useQueries({
    queries: campaignIds.map((id) => ({
      queryKey: queryKeys.campaignMissions(id),
      queryFn: () => apiClient.get<MissionCard[]>(`${V1}/campaigns/${id}/missions`),
    })),
    combine: (results) => ({
      missions: results.flatMap((r) => r.data ?? []),
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  })
}

export function useCampaignMissions(campaignId: string | undefined) {
  return useQuery({
    queryKey: campaignId
      ? queryKeys.campaignMissions(campaignId)
      : ['campaign', 'none', 'missions'],
    queryFn: () => apiClient.get<MissionCard[]>(`${V1}/campaigns/${campaignId}/missions`),
    enabled: !!campaignId,
  })
}

/**
 * Full nested mission detail — categories, phases → waypoints, reward teaser
 * — in ONE call (spec §13, avoids N+1). Powers both the mission-detail screen
 * and the phase itinerary/map.
 */
export function useMissionDetail(missionId: string | undefined) {
  return useQuery({
    queryKey: missionId ? queryKeys.mission(missionId) : ['mission', 'none'],
    queryFn: () => apiClient.get<MissionDetail>(`${V1}/missions/${missionId}`),
    enabled: !!missionId,
  })
}
