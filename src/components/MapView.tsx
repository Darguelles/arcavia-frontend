import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { WaypointInMission } from '../types/api'
import { STATUS_COLOR, type WaypointStatus } from './waypointStatus'

export interface MapWaypoint extends WaypointInMission {
  status: WaypointStatus
  order: number
}

interface MapViewProps {
  center: [number, number]
  tileUrl: string
  waypoints: MapWaypoint[]
  onSelect: (waypointId: string) => void
  // Hands back the Leaflet instance so the parent can drive it (e.g. recenter).
  onMapReady?: (map: L.Map) => void
  className?: string
}

// Dev/QA fallback when a city's tile_url is missing or a seed placeholder
// (e.g. the "tiles.example.com" seed values). Override with a real keyed
// provider via VITE_MAP_TILE_URL. Public OSM is fine for low-volume dev only
// (spec §10 — don't use it at production volume).
const FALLBACK_TILE_URL =
  import.meta.env.VITE_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

/** A tile_url is usable only if it's a real {z}/{x}/{y} template on a live host. */
function resolveTileUrl(tileUrl: string | undefined): string {
  if (!tileUrl || !tileUrl.includes('{z}') || tileUrl.includes('example.com')) {
    return FALLBACK_TILE_URL
  }
  return tileUrl
}

/**
 * Leaflet map for the phase itinerary (spec §10). Tiles come from the city's
 * configured `tile_url`; when that's absent or a placeholder we fall back to a
 * live provider so the map never renders blank. Pins are coloured by
 * user_waypoint_progress.status. Live position/distance are computed client-side
 * elsewhere and generate no backend traffic.
 */
export function MapView({
  center,
  tileUrl,
  waypoints,
  onSelect,
  onMapReady,
  className,
}: MapViewProps) {
  const resolvedUrl = resolveTileUrl(tileUrl)
  return (
    <MapContainer
      center={center}
      zoom={15}
      className={className}
      style={{ height: '100%', width: '100%', background: '#1f1a1e' }}
      zoomControl={false}
      attributionControl
    >
      <TileLayer
        url={resolvedUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {waypoints.map((wp) => (
        <WaypointMarker key={wp.id} waypoint={wp} onSelect={onSelect} />
      ))}
      <FitToWaypoints waypoints={waypoints} center={center} />
      <InvalidateOnMount />
      {onMapReady && <MapReady onReady={onMapReady} />}
    </MapContainer>
  )
}

function MapReady({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()
  // Block body: must NOT return onReady()'s value — React would treat a truthy
  // return as an effect cleanup function and call it on unmount.
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  return null
}

function WaypointMarker({
  waypoint,
  onSelect,
}: {
  waypoint: MapWaypoint
  onSelect: (id: string) => void
}) {
  const icon = useMemo(
    () => buildPinIcon(waypoint.status, waypoint.order),
    [waypoint.status, waypoint.order]
  )
  return (
    <Marker
      position={[waypoint.lat, waypoint.lng]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(waypoint.id) }}
    />
  )
}

/** WaypointPin (spec §6): coloured teardrop with its order number. */
function buildPinIcon(status: WaypointStatus, order: number): L.DivIcon {
  const color = STATUS_COLOR[status]
  return L.divIcon({
    className: 'arcavia-pin',
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:30px;height:30px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};border:2px solid #ffebd9;
        box-shadow:0 2px 6px rgba(0,0,0,.4);">
        <span style="transform:rotate(45deg);color:#1f1a1e;font-weight:700;font-size:12px;font-family:Montserrat,sans-serif;">${order}</span>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  })
}

/** Fit the viewport to the phase's waypoints (or center on the city if none). */
function FitToWaypoints({
  waypoints,
  center,
}: {
  waypoints: MapWaypoint[]
  center: [number, number]
}) {
  const map = useMap()
  useEffect(() => {
    if (waypoints.length === 0) {
      map.setView(center, 15)
      return
    }
    const bounds = L.latLngBounds(waypoints.map((w) => [w.lat, w.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 })
  }, [waypoints, center, map])
  return null
}

/**
 * Recompute the map size after mount. The map lives in an absolutely-positioned
 * container overlapped by the bottom sheet; without this Leaflet can latch onto a
 * 0/stale size and render blank grey/black tiles.
 */
function InvalidateOnMount() {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 0)
    return () => clearTimeout(id)
  }, [map])
  return null
}
