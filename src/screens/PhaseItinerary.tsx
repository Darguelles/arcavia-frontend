import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Map as LeafletMap } from 'leaflet'
import { MapView, type MapWaypoint } from '../components/MapView'
import { WaypointListItem } from '../components/WaypointListItem'
import {
  CategoryGlyph,
  glyphForCategory,
  type CategoryGlyphVariant,
} from '../components/CategoryGlyph'
import { PrimaryButton } from '../components/PrimaryButton'
import { SecondaryButton } from '../components/SecondaryButton'
import { LoadingState, ErrorState } from '../components/states'
import { cn } from '../lib/utils'
import { useMissionDetail } from '../api/missions'
import { useUserLocation } from '../lib/useUserLocation'
import { useCitySessionStore } from '../stores/citySessionStore'
import type { MissionDetail, WaypointInMission } from '../types/api'

// Figma's floating-control drop shadow.
const CONTROL_SHADOW = 'shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]'

/*
 * ITINERARIO (/missions/:missionId/phases/:phaseId) — Figma frames 115:3 / 115:123.
 * A FULL-SCREEN map sits in the background; floating shadowed controls (back,
 * mission pill, recenter) and a single-open collapsible phase accordion float
 * over it. The accordion loads fully collapsed; tapping a phase reveals its
 * waypoints and points the map at them (tapping it again collapses it). Also
 * serves /missions/:missionId/waypoints/:waypointId (opens the popover).
 *
 * A row of category filter chips ("Culturales" ◆ / "Patrocinado" ◈, Figma 115:3)
 * floats beneath the mission pill. Each chip is a toggle: deselecting a category
 * hides its waypoints from the map and the phase list. The same diamond glyph
 * marks each waypoint's category in the list so the two read distinctly.
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

  const mapRef = useRef<LeafletMap | null>(null)
  // Live "you are here" position for wayfinding (spec §10) — display only, no
  // backend traffic. Coarse/battery-friendly; the high-accuracy watch is the
  // check-in screen's job.
  const { location: userLocation } = useUserLocation()
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(waypointId ?? null)
  // Which phase's list is expanded. Starts null so BOTH phases load collapsed —
  // the URL's phaseId still drives the map, but the accordion opens only on tap.
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null)
  // Categories the player has toggled OFF; empty = show everything (the default).
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<Set<string>>(() => new Set())

  if (isLoading) return <LoadingState label="Cargando itinerario…" />
  if (isError || !mission) {
    return (
      <div className="min-h-dvh w-full max-w-[402px] bg-ink">
        <ErrorState message="No pudimos cargar el itinerario." onRetry={() => refetch()} />
      </div>
    )
  }

  // The phase the map centers on: the expanded one, else the URL's phase (so a
  // deep-link from a challenge still lands on its route), else the first phase.
  const activePhaseId = openPhaseId ?? phaseId ?? mission.phases[0]?.id
  const activePhase = mission.phases.find((p) => p.id === activePhaseId) ?? mission.phases[0]

  const center: [number, number] = city
    ? [city.center_lat, city.center_lng]
    : firstWaypointCenter(mission)

  // Categories present across the whole itinerary, each mapped to its filter glyph.
  const categories = collectCategories(mission)
  const glyphById = new Map(categories.map((c) => [c.id, c.glyph]))
  const isVisible = (w: WaypointInMission) => !hiddenCategoryIds.has(w.category_id)

  const toggleCategory = (id: string) => {
    setHiddenCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Order numbers come from the phase's full sequence, so filtering out a
  // category doesn't renumber the pins that stay on the map.
  const mapWaypoints: MapWaypoint[] = (activePhase?.waypoints ?? [])
    .map((w, i) => ({
      ...w,
      status: 'todo' as const, // see components/waypointStatus.ts — API gap
      order: i + 1,
      glyph: glyphById.get(w.category_id),
    }))
    .filter(isVisible)

  const selectedWaypoint =
    selectedWaypointId != null ? findWaypoint(mission, selectedWaypointId) : undefined

  // Single-open accordion that can also be all-closed: tapping the open phase
  // collapses it; tapping a closed one opens it (and points the map at it).
  const togglePhase = (id: string) => {
    setSelectedWaypointId(null)
    if (openPhaseId === id) {
      setOpenPhaseId(null)
      return
    }
    setOpenPhaseId(id)
    // Keep the URL deep-linkable without adding history entries.
    navigate(`/missions/${mission.id}/phases/${id}`, { replace: true })
  }

  const recenter = () => {
    const map = mapRef.current
    if (!map) return
    const wps = (activePhase?.waypoints ?? []).filter(isVisible)
    if (wps.length > 0) {
      map.fitBounds(
        wps.map((w) => [w.lat, w.lng] as [number, number]),
        { padding: [48, 48], maxZoom: 16 }
      )
    } else {
      map.setView(center, 15)
    }
  }

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 16)
    }
  }

  return (
    <div className="relative min-h-dvh w-full max-w-[402px] overflow-hidden bg-ink">
      {/* Full-screen map background. `isolate` contains Leaflet's internal
          z-indexes so its panes/controls don't paint over the floating UI. */}
      <div className="absolute inset-0 z-0 isolate">
        {city ? (
          <MapView
            center={center}
            tileUrl={city.tile_url ?? ''}
            waypoints={mapWaypoints}
            userLocation={userLocation}
            onSelect={setSelectedWaypointId}
            onMapReady={(m) => {
              mapRef.current = m
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-cream/50">
            Mapa no disponible
          </div>
        )}
      </div>

      {/* Floating top controls (shadowed) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 px-5 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-ink-card text-cream ${CONTROL_SHADOW}`}
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

          <span
            className={`pointer-events-auto rounded-[5px] bg-[#f3efe6] px-3 py-2 text-[12px] font-medium text-ink ${CONTROL_SHADOW}`}
          >
            {mission.name}
          </span>

          <div className="pointer-events-auto flex gap-2">
            {userLocation && (
              <button
                type="button"
                onClick={centerOnUser}
                aria-label="Centrar en mi ubicación"
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-ink-card text-[#7cb0ff] ${CONTROL_SHADOW}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2v3M12 19v3M2 12h3M19 12h3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={recenter}
              aria-label="Centrar mapa"
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-ink-card text-cream ${CONTROL_SHADOW}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 2v3M12 19v3M2 12h3M19 12h3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Category filter chips (Figma 115:3). Toggle a category off to hide its
            waypoints from the map and the phase list. */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories.map((cat) => {
              const active = !hiddenCategoryIds.has(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  aria-pressed={active}
                  className={cn(
                    'pointer-events-auto flex items-center gap-2 rounded-[5px] px-3 py-1.5 text-[12px] font-medium transition-colors',
                    CONTROL_SHADOW,
                    active ? 'bg-[#f3efe6] text-ink' : 'bg-ink-card/85 text-cream/60'
                  )}
                >
                  <CategoryGlyph
                    variant={cat.glyph}
                    size={11}
                    className={active ? 'text-gold' : 'text-cream/50'}
                  />
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Collapsible phase accordion, floating over the map */}
      <div className="absolute inset-x-0 bottom-0 z-10 max-h-[70dvh] overflow-y-auto rounded-t-[20px] bg-ink px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-[0px_-6px_20px_0px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-gold/60" />

        {mission.phases.map((phase) => {
          const open = phase.id === openPhaseId
          const visibleWps = phase.waypoints.filter(isVisible)
          return (
            <div key={phase.id} className="border-b border-cream/10 last:border-b-0">
              <button
                type="button"
                onClick={() => togglePhase(phase.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between py-3 text-left"
              >
                <span className="text-[18px] font-bold text-cream">{phase.name}</span>
                <span
                  className="flex h-6 w-6 items-center justify-center text-[22px] leading-none text-gold"
                  aria-hidden="true"
                >
                  {open ? '−' : '+'}
                </span>
              </button>

              {open && (
                <ul className="flex flex-col pb-2">
                  {visibleWps.map((w) => (
                    <li key={w.id}>
                      <WaypointListItem
                        waypoint={w}
                        glyphVariant={glyphById.get(w.category_id)}
                        onClick={() => setSelectedWaypointId(w.id)}
                      />
                    </li>
                  ))}
                  {visibleWps.length === 0 && (
                    <li className="py-4 text-center text-[14px] text-cream/60">
                      {phase.waypoints.length === 0
                        ? 'Esta fase aún no tiene puntos.'
                        : 'Ningún punto coincide con el filtro.'}
                    </li>
                  )}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* Waypoint popover (VENTANA DE LOC) with a dimming scrim over the map */}
      {selectedWaypoint && (
        <WaypointPopover
          waypoint={selectedWaypoint}
          onScan={() =>
            navigate(`/waypoints/${selectedWaypoint.id}/checkin`, {
              // Carry context the check-in/answer/result screens can't otherwise
              // get (geo-checkin/answer responses don't include waypoint points).
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

interface ItineraryCategory {
  id: string
  name: string
  glyph: CategoryGlyphVariant
}

/*
 * The categories present across the whole itinerary, in a stable order so their
 * filter glyphs never shuffle. mission.categories carries the canonical
 * order_index; anything only referenced by a waypoint falls back to first-seen
 * order. Keyed by category_id (the reliable key) with category_name for display.
 */
function collectCategories(mission: MissionDetail): ItineraryCategory[] {
  const orderIndex = new Map(mission.categories.map((c) => [c.id, c.order_index]))
  const names = new Map<string, string>()
  const appearance: string[] = []
  for (const phase of mission.phases) {
    for (const w of phase.waypoints) {
      if (!names.has(w.category_id)) {
        names.set(w.category_id, w.category_name)
        appearance.push(w.category_id)
      }
    }
  }
  const ordered = [...names.keys()].sort((a, b) => {
    const oa = orderIndex.get(a)
    const ob = orderIndex.get(b)
    if (oa != null && ob != null) return oa - ob
    if (oa != null) return -1
    if (ob != null) return 1
    return appearance.indexOf(a) - appearance.indexOf(b)
  })
  return ordered.map((id, i) => ({ id, name: names.get(id)!, glyph: glyphForCategory(i) }))
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
