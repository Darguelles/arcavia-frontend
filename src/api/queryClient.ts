import { QueryClient } from '@tanstack/react-query'
import { ApiClientError } from './client'

/**
 * Shared TanStack Query client. `staleTime` roughly matches the backend's Redis
 * content-cache TTL (~5 min, spec §7/§13) so we don't defeat server-side caching
 * with aggressive refetches. Auth failures are not retried.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof ApiClientError && [401, 403, 404].includes(error.status)) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})

// Query-key factory — namespaced by city/mission so a city switch or content
// update never serves stale cross-city data (spec §7).
export const queryKeys = {
  account: ['account'] as const,
  cityResolve: (lat: number, lng: number) => ['city', 'resolve', lat, lng] as const,
  cities: ['cities'] as const,
  cityCampaigns: (cityId: string) => ['city', cityId, 'campaigns'] as const,
  campaignMissions: (campaignId: string) => ['campaign', campaignId, 'missions'] as const,
  mission: (missionId: string) => ['mission', missionId] as const,
  waypointChallenges: (waypointId: string) => ['waypoint', waypointId, 'challenges'] as const,
  myProgress: ['me', 'progress'] as const,
  myAnswers: (limit: number, offset: number) => ['me', 'answers', limit, offset] as const,
  myRewards: (limit: number, offset: number) => ['me', 'rewards', limit, offset] as const,
  leaderboard: (cityId: string) => ['city', cityId, 'leaderboard'] as const,
}
