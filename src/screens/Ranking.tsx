import { AppShell } from '../components/AppShell'
import { CityGate } from '../components/CityGate'
import { LeaderboardList } from '../components/LeaderboardList'
import { LoadingState, ErrorState } from '../components/states'
import { useLeaderboard } from '../api/cities'
import { useAuthStore } from '../stores/authStore'
import { useCitySessionStore } from '../stores/citySessionStore'

/*
 * RANKING (/ranking) — Figma frame 135:644.
 * DESIGN PENDING (§8.12): the frame only had background/nav as of the last pull,
 * so this is a clean list built against GET /cities/{id}/leaderboard, not an
 * invented layout. Confirm the visual treatment with the designer before polish.
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
