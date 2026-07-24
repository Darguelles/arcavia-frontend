import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CityGate } from '../components/CityGate'
import { MissionCard } from '../components/MissionCard'
import { LoadingState, ErrorState, EmptyState } from '../components/states'
import { TermsFooterLink } from '../components/TermsFooterLink'
import { useCityCampaigns } from '../api/cities'
import { useMissionsForCampaigns } from '../api/missions'
import { useMyProgress } from '../api/gameplay'
import { useAuthStore } from '../stores/authStore'
import { useCitySessionStore } from '../stores/citySessionStore'

/*
 * MISIONES (/missions) — Figma frame 9:175. Greeting header + a MissionCard per
 * mission in the resolved/selected city (spec §8.4). Missions are aggregated
 * across the city's active campaigns.
 */
export function Missions() {
  return (
    <AppShell showAvatar>
      <CityGate>
        <MissionsList />
      </CityGate>
    </AppShell>
  )
}

function MissionsList() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const city = useCitySessionStore((s) => s.city)
  const clearCity = useCitySessionStore((s) => s.clearCity)
  const { data: progress } = useMyProgress()

  const campaignsQuery = useCityCampaigns(city?.id)
  const campaignIds = (campaignsQuery.data?.items ?? []).map((c) => c.id)
  const { missions, isLoading, isError } = useMissionsForCampaigns(campaignIds)

  const loading = campaignsQuery.isLoading || (campaignIds.length > 0 && isLoading)

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Greeting */}
      <header className="flex items-start justify-between pt-2">
        <div>
          <p className="text-[16px] text-cream/80">Bienvenido Explorador</p>
          <h1 className="text-[32px] font-bold text-cream">
            ¡Hola, {user?.display_name?.split(' ')[0] ?? 'Explorador'}!
          </h1>
          <button
            type="button"
            onClick={clearCity}
            className="mt-1 text-[13px] text-gold underline"
          >
            {city?.name} · cambiar
          </button>
        </div>
        <span className="mt-2 shrink-0 rounded-[2px] border border-gold px-3 py-1 text-[14px] font-bold text-cream">
          {progress?.total_points ?? 0} pts
        </span>
      </header>

      {/* Missions */}
      {loading && <LoadingState />}
      {isError && !loading && (
        <ErrorState
          message="No pudimos cargar las misiones."
          onRetry={() => campaignsQuery.refetch()}
        />
      )}
      {!loading && !isError && missions.length === 0 && (
        <EmptyState>
          <p className="text-[15px]">Aún no hay misiones en {city?.name}.</p>
          <p className="text-[13px]">Vuelve pronto: estamos preparando nuevas aventuras.</p>
        </EmptyState>
      )}

      <div className="flex flex-col gap-5">
        {missions.map((mission, i) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            index={i}
            imageUrl={mission.image_url}
            onClick={() => navigate(`/missions/${mission.id}`)}
          />
        ))}
      </div>

      <TermsFooterLink className="pt-6" />
    </div>
  )
}
