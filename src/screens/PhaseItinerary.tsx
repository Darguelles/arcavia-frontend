import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapView, type MapWaypoint } from '../components/MapView'
import { PhaseProgressFooter } from '../components/PhaseProgressFooter'
import { WaypointListItem } from '../components/WaypointListItem'
import { PrimaryButton } from '../components/PrimaryButton'
import { SecondaryButton } from '../components/SecondaryButton'
import { LoadingState, ErrorState } from '../components/states'
import { useMissionDetail } from '../api/missions'
import { useCitySessionStore } from '../stores/citySessionStore'
import type { MissionDetail, PhaseInMission, WaypointInMission } from '../types/api'

/*
 * ITINERARIO (/missions/:missionId/phases/:phaseId) — Figma frames 115:3 / 115:123.
 * Full-screen map with WaypointPins for the phase, a collapsible per-phase list
 * sheet, a phase navigator, and the waypoint popover (VENTANA DE LOC) that
 * starts the scan flow. Also serves /missions/:missionId/waypoints/:waypointId
 * (opens with that waypoint's popover).
 */
export function PhaseItinerary() {
  const { missionId, phaseId, waypointId } = useParams<{
    missionId: string
    phaseId?: string
    waypointId?: string
  }>()
  const navigate = useNavigate()
  const city = useCitySessionStore((s) => s.city)
  const { data: mission, isLoading, isError, refetch } = useMissionDetail(missionId)

  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(waypointId ?? null)

  const activePhase: PhaseInMission | undefined = useMemo(() => {
    if (!mission) return undefined
    return mission.phases.find((p) => p.id === phaseId) ?? mission.phases[0]
  }, [mission, phaseId])

  if (isLoading) return <LoadingState label="Cargando itinerario…" />
  if (isError || !mission) {
    return (
      <div className="min-h-dvh w-full max-w-[402px] bg-ink">
        <ErrorState message="No pudimos cargar el itinerario." onRetry={() => refetch()} />
      </div>
    )
  }

  const center: [number, number] = city
    ? [city.center_lat, city.center_lng]
    : firstWaypointCenter(mission)

  const mapWaypoints: MapWaypoint[] = (activePhase?.waypoints ?? []).map((w, i) => ({
    ...w,
    status: 'todo', // see components/waypointStatus.ts — API gap
    order: i + 1,
  }))

  const selectedWaypoint =
    selectedWaypointId != null ? findWaypoint(mission, selectedWaypointId) : undefined

  const goToPhase = (id: string) => {
    setSelectedWaypointId(null)
    navigate(`/missions/${mission.id}/phases/${id}`, { replace: true })
  }

  return (
    <div className="relative min-h-dvh w-full max-w-[402px] overflow-hidden bg-ink">
      {/* Map fills the top portion */}
      <div className="absolute inset-0 h-[60dvh]">
        {city ? (
          <MapView
            center={center}
            tileUrl={city.tile_url ?? ''}
            waypoints={mapWaypoints}
            onSelect={setSelectedWaypointId}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-cream/50">
            Mapa no disponible
          </div>
        )}
      </div>

      {/* Top controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(12px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(`/missions/${mission.id}`)}
          aria-label="Volver"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink-card/90 text-cream shadow"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="pointer-events-auto rounded-[5px] bg-[#f3efe6] px-3 py-2 text-[12px] font-medium text-ink shadow">
          {mission.name}
        </span>
        <span className="h-10 w-10" />
      </div>

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[52dvh] overflow-y-auto rounded-t-[20px] bg-ink px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gold/60" />

        <div className="mb-4">
          <PhaseProgressFooter
            phases={mission.phases}
            currentPhaseId={activePhase?.id ?? ''}
            onSelect={goToPhase}
          />
        </div>

        <h2 className="text-[18px] font-bold text-cream">{activePhase?.name}</h2>
        <ul className="mt-2 flex flex-col">
          {(activePhase?.waypoints ?? []).map((w) => (
            <li key={w.id}>
              <WaypointListItem waypoint={w} onClick={() => setSelectedWaypointId(w.id)} />
            </li>
          ))}
          {(activePhase?.waypoints ?? []).length === 0 && (
            <li className="py-6 text-center text-[14px] text-cream/60">
              Esta fase aún no tiene puntos.
            </li>
          )}
        </ul>
      </div>

      {/* Waypoint popover */}
      {selectedWaypoint && (
        <WaypointPopover
          waypoint={selectedWaypoint}
          onScan={() =>
            navigate(`/waypoints/${selectedWaypoint.id}/challenge`, {
              // Carry context the scan/answer/result screens can't otherwise get
              // (validate-scan/answer responses don't include waypoint points).
              state: {
                points: selectedWaypoint.points,
                waypointName: selectedWaypoint.name,
                category: selectedWaypoint.category_name,
                missionId: mission.id,
                phaseId: activePhase?.id,
              },
            })
          }
          onClose={() => setSelectedWaypointId(null)}
        />
      )}
    </div>
  )
}

/*
 * VENTANA DE LOC popover (spec §8.7). Two states: "Completa el desafío" starts
 * the scan flow; "Volver a la ruta" dismisses back to the map. (Completed state
 * would show only "Volver a la ruta" once the API exposes waypoint status.)
 */
function WaypointPopover({
  waypoint,
  onScan,
  onClose,
}: {
  waypoint: WaypointInMission
  onScan: () => void
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/50 px-6">
      <div className="w-full max-w-[320px] rounded-[10px] bg-[#f3efe6] p-6 text-ink">
        <p className="text-center text-[12px] text-ink/70">{waypoint.category_name}</p>
        <h3 className="mt-1 text-center text-[21px] font-bold">“{waypoint.name}”</h3>
        {waypoint.description && (
          <p className="mt-2 text-center text-[14px] text-ink/80">{waypoint.description}</p>
        )}
        <div className="mt-5 flex flex-col gap-3">
          <PrimaryButton onClick={onScan}>Completa el desafío</PrimaryButton>
          <SecondaryButton onClick={onClose} className="!border-gold !text-ink hover:!bg-gold/10">
            Volver a la ruta
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}

function findWaypoint(mission: MissionDetail, id: string): WaypointInMission | undefined {
  for (const phase of mission.phases) {
    const wp = phase.waypoints.find((w) => w.id === id)
    if (wp) return wp
  }
  return undefined
}

function firstWaypointCenter(mission: MissionDetail): [number, number] {
  for (const phase of mission.phases) {
    if (phase.waypoints[0]) return [phase.waypoints[0].lat, phase.waypoints[0].lng]
  }
  return [-12.0464, -77.0428] // Lima fallback
}
