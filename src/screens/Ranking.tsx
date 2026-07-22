import { AppShell } from '../components/AppShell'
import { CityGate } from '../components/CityGate'
import { LeaderboardList } from '../components/LeaderboardList'
import { LoadingState, ErrorState } from '../components/states'
import { useLeaderboard } from '../api/cities'
import { useAuthStore } from '../stores/authStore'
import { useCitySessionStore } from '../stores/citySessionStore'

/*
 * RANKING (/ranking) — Figma frame 135:644.
 * Now designed (§8.12): a top-3 podium over a cream sheet of the remaining
 * ranks (see LeaderboardList), built against GET /cities/{id}/leaderboard.
 */
export function Ranking() {
  return (
    <AppShell back showAvatar title="Ranking">
      <CityGate>
        <LeaderboardView />
      </CityGate>
    </AppShell>
  )
}

function LeaderboardView() {
  const city = useCitySessionStore((s) => s.city)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data, isLoading, isError, refetch } = useLeaderboard(city?.id, 50)

  return (
    <div className="py-4">
      <p className="mb-4 text-[14px] text-cream/70">Mejores exploradores de {city?.name}</p>
      {isLoading && <LoadingState />}
      {isError && !isLoading && (
        <ErrorState message="No pudimos cargar el ranking." onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && (
        <LeaderboardList entries={data?.entries ?? []} currentUserId={currentUserId} />
      )}
    </div>
  )
}
