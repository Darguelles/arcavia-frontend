import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PrimaryButton } from '../components/PrimaryButton'
import { RewardTeaserCard } from '../components/RewardCard'
import { LoadingState, ErrorState } from '../components/states'
import { TermsFooterLink } from '../components/TermsFooterLink'
import { useMissionDetail } from '../api/missions'
import { useMyProgress } from '../api/gameplay'
import type { MissionDetail as MissionDetailType, WaypointInMission } from '../types/api'

const DIFFICULTY_LABEL = {
  baja: 'Dificultad baja',
  media: 'Dificultad media',
  alta: 'Dificultad alta',
}

/*
 * PERFIL MISIÓN (/missions/:missionId) — Figma frame 12:305.
 * Header + reward summary + objectives (from categories + riddle) + available-
 * rewards teaser (§8.5) + per-phase itinerary. "Iniciar misión" opens the first
 * phase's map/itinerary (spec §8.5).
 */
export function MissionDetail() {
  const { missionId } = useParams<{ missionId: string }>()
  const navigate = useNavigate()
  const { data: mission, isLoading, isError, refetch } = useMissionDetail(missionId)

  if (isLoading) {
    return (
      <AppShell back showAvatar>
        <LoadingState />
      </AppShell>
    )
  }
  if (isError || !mission) {
    return (
      <AppShell back showAvatar>
        <ErrorState message="No pudimos cargar la misión." onRetry={() => refetch()} />
      </AppShell>
    )
  }

  const firstPhaseId = mission.phases[0]?.id
  const start = () => firstPhaseId && navigate(`/missions/${mission.id}/phases/${firstPhaseId}`)

  return (
    <AppShell back showAvatar>
      <div className="-mx-5 flex flex-col">
        <Hero mission={mission} />

        <div className="flex flex-col gap-6 px-5 pb-8">
          <RewardSummary mission={mission} />
          <PrimaryButton onClick={start} disabled={!firstPhaseId}>
            Iniciar misión
          </PrimaryButton>

          <Objectives mission={mission} />

          {mission.available_rewards.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-[18px] font-bold text-cream">Recompensas disponibles</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {mission.available_rewards.map((r, i) => (
                  <RewardTeaserCard key={`${r.name}-${i}`} reward={r} />
                ))}
              </div>
            </section>
          )}

          <Itinerary mission={mission} />

          <PrimaryButton onClick={start} disabled={!firstPhaseId}>
            Iniciar misión
          </PrimaryButton>
          <TermsFooterLink />
        </div>
      </div>
    </AppShell>
  )
}

function Hero({ mission }: { mission: MissionDetailType }) {
  return (
    <div className="relative h-[300px] w-full overflow-hidden">
      {mission.image_url ? (
        <img
          src={mission.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-card via-[#5a4a3d] to-gold/60" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      <div className="absolute inset-x-5 bottom-4">
        <p className="text-[14px] text-cream/85">{DIFFICULTY_LABEL[mission.difficulty]}</p>
        <h1 className="text-[36px] font-bold leading-none text-cream">{mission.name}</h1>
        {mission.description && (
          <p className="mt-2 text-[14px] italic text-cream/85">{mission.description}</p>
        )}
      </div>
    </div>
  )
}

function RewardSummary({ mission }: { mission: MissionDetailType }) {
  // "Objetivo" mirrors the Figma "6 Visitas" — the number of waypoints to visit.
  const waypointCount = mission.phases.reduce((n, p) => n + p.waypoints.length, 0)
  const time = mission.estimated_time_minutes
  const timeLabel = time >= 60 ? `${Math.floor(time / 60)}h ${time % 60}m` : `${time}m`

  const cells = [
    { label: 'Recompensa', value: `${mission.reward_points} pts` },
    { label: 'Objetivo', value: `${waypointCount} Visitas` },
    { label: 'Tiempo', value: timeLabel },
  ]
  return (
    <div className="grid grid-cols-3 rounded-[5px] border border-gold">
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col items-center gap-0.5 py-3">
          <span className="text-[10px] text-cream/70">{c.label}</span>
          <span className="text-[18px] font-bold text-cream">{c.value}</span>
        </div>
      ))}
    </div>
  )
}

function Objectives({ mission }: { mission: MissionDetailType }) {
  return (
    <section className="rounded-[10px] bg-[#f3efe6] p-5 text-ink">
      <h2 className="text-[20px] font-bold">Objetivos de la misión</h2>
      <ul className="mt-3 flex flex-col divide-y divide-ink/10">
        {mission.categories.map((c) => (
          <li key={c.id} className="py-3 text-[14px]">
            Visitas &gt; {c.threshold_pct}% de puntos {c.name}
          </li>
        ))}
        <li className="py-3 text-[14px]">Resolver al menos 1 acertijo histórico</li>
      </ul>
    </section>
  )
}

function Itinerary({ mission }: { mission: MissionDetailType }) {
  const { data: progress } = useMyProgress()

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[20px] font-bold text-cream">Itinerario de la misión</h2>
      {mission.phases.map((phase) => {
        const byCategory = groupByCategory(phase.waypoints)
        return (
          <div key={phase.id} className="rounded-[10px] bg-ink-card p-4">
            <h3 className="border-b border-cream/15 pb-2 text-[16px] font-bold text-cream">
              {phase.name}
            </h3>
            {Array.from(byCategory.entries()).map(([category, waypoints]) => (
              <div key={category} className="mt-3">
                <p className="text-[14px] font-bold text-gold">{category}</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {waypoints.map((w) => (
                    <li key={w.id} className="flex items-center justify-between text-[14px]">
                      <span className="text-cream/90">• {w.name}</span>
                      <span className="font-bold text-gold">{w.points} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      })}
      {/* Once started, mission progress is available via /me/progress. */}
      {progress?.missions.some((m) => m.mission_id === mission.id) && (
        <p className="text-[13px] text-cream/60">Ya iniciaste esta misión. ¡Sigue explorando!</p>
      )}
    </section>
  )
}

function groupByCategory(waypoints: WaypointInMission[]): Map<string, WaypointInMission[]> {
  const map = new Map<string, WaypointInMission[]>()
  for (const w of waypoints) {
    const list = map.get(w.category_name) ?? []
    list.push(w)
    map.set(w.category_name, list)
  }
  return map
}
