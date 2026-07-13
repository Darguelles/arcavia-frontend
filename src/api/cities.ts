import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { queryKeys } from './queryClient'
import type { CampaignList, City, CityResolveResponse, LeaderboardResponse } from '../types/api'

const V1 = '/api/v1'

/** Resolve the player's city from GPS. Public — no auth required (§7.1). */
export function useResolveCity() {
  return useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      apiClient.get<CityResolveResponse>(
        `${V1}/cities/resolve?lat=${coords.lat}&lng=${coords.lng}`,
        { anonymous: true }
      ),
  })
}

export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities,
    queryFn: () => apiClient.get<City[]>(`${V1}/cities`, { anonymous: true }),
  })
}

export function useCityCampaigns(cityId: string | undefined) {
  return useQuery({
    queryKey: cityId ? queryKeys.cityCampaigns(cityId) : ['city', 'none', 'campaigns'],
    queryFn: () => apiClient.get<CampaignList>(`${V1}/cities/${cityId}/campaigns`),
    enabled: !!cityId,
  })
}

export function useLeaderboard(cityId: string | undefined, topN = 20) {
  return useQuery({
    queryKey: cityId ? queryKeys.leaderboard(cityId) : ['city', 'none', 'leaderboard'],
    queryFn: () =>
      apiClient.get<LeaderboardResponse>(`${V1}/cities/${cityId}/leaderboard?top_n=${topN}`, {
        anonymous: true,
      }),
    enabled: !!cityId,
  })
}
