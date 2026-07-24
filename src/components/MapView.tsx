import { useEffect, useMemo } from 'react'
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { WaypointInMission } from '../types/api'
import type { UserLocation } from '../lib/useUserLocation'
import { resolveTileUrl } from '../lib/mapTiles'
import { STATUS_COLOR, type WaypointStatus } from './waypointStatus'
import { categoryGlyphSvg, type CategoryGlyphVariant } from './CategoryGlyph'

export interface MapWaypoint extends WaypointInMission {
  status: WaypointStatus
  order: number
  // Category diamond shown inside the pin (Figma 115:3). Falls back to the order
  // number when absent.
  glyph?: CategoryGlyphVariant
}

interface MapViewProps {
  center: [number, number]
  tileUrl: string
  waypoints: MapWaypoint[]
  onSelect: (waypointId: string) => void
  // Live "you are here" position (spec §10) — display only, never validation.
  userLocation?: UserLocation | null
  // Wayfinding guide polyline (spec §10): the street-following walking path when
  // the router returns one, or a straight [from, to] fallback while it loads /
  // if routing is unavailable. Ordered [lat, lng] pairs.
  route?: [number, number][] | null
  // Hands back the Leaflet instance so the parent can drive it (e.g. recenter).
  onMapReady?: (map: L.Map) => void
  className?: string
}

/**
 * Leaflet map for the phase itinerary (spec §10). Tiles come from the city's
 * configured `tile_url`; when that's absent or a placeholder we fall back to a
 * live provider so the map never renders blank. Pins are coloured by
 * user_waypoint_progress.status and carry their category's diamond glyph. Live
 * position/distance are computed client-side elsewhere and generate no backend
 * traffic.
 */
export function MapView({
  center,
  tileUrl,
  waypoints,
  onSelect,
  userLocation,
  route,
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
      {route && route.length >= 2 && (
        <>
          {/* Dark casing underneath, then the bold gold route on top — the
              casing gives contrast so the line reads clearly over any basemap. */}
          <Polyline
            positions={route}
            pathOptions={{
              color: '#3d2f00',
              weight: 10,
              opacity: 0.45,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          <Polyline
            positions={route}
            pathOptions={{
              color: '#e6b800',
              weight: 6,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </>
      )}
      {waypoints.map((wp) => (
        <WaypointMarker key={wp.id} waypoint={wp} onSelect={onSelect} />
      ))}
      {userLocation && <UserLocationMarker location={userLocation} />}
      <FitToWaypoints waypoints={waypoints} center={center} />
      <InvalidateOnMount />
      {onMapReady && <MapReady onReady={onMapReady} />}
    </MapContainer>
  )
}

const USER_DOT_COLOR = '#3b82f6'

/**
 * "You are here" marker: a blue dot with a translucent accuracy halo (spec §10).
 * Distinct from the teardrop waypoint pins so the two never read as the same
 * thing. Display only — this reflects the client's own position and drives no
 * validation.
 */
function UserLocationMarker({ location }: { location: UserLocation }) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'arcavia-user-dot',
        html: `<div style="
          width:16px;height:16px;border-radius:50%;
          background:${USER_DOT_COLOR};border:3px solid #fff;
          box-shadow:0 0 0 2px rgba(59,130,246,.4),0 1px 4px rgba(0,0,0,.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    []
  )
  return (
    <>
      <Circle
        center={[location.lat, location.lng]}
        radius={location.accuracy}
        pathOptions={{
          color: USER_DOT_COLOR,
          weight: 1,
          fillColor: USER_DOT_COLOR,
          fillOpacity: 0.12,
        }}
      />
      <Marker position={[location.lat, location.lng]} icon={icon} />
    </>
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
    () => buildPinIcon(waypoint.status, waypoint.order, waypoint.glyph),
    [waypoint.status, waypoint.order, waypoint.glyph]
  )
  return (
    <Marker
      position={[waypoint.lat, waypoint.lng]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(waypoint.id) }}
    />
  )
}

/**
 * WaypointPin (spec §6): coloured teardrop whose inner symbol is the waypoint's
 * category diamond (Figma 115:3) — the same glyph as the filter chips and list
 * rows. The teardrop is rotated -45°, so the symbol is counter-rotated +45° to
 * sit upright. Falls back to the order number when no category glyph is supplied.
 */
function buildPinIcon(
  status: WaypointStatus,
  order: number,
  glyph?: CategoryGlyphVariant
): L.DivIcon {
  const color = STATUS_COLOR[status]
  // Category glyph styled like the filter chips: a gold diamond (#b19071 →
  // text-gold) on a light disc (#f3efe6), so it reads the same on the map as in
  // the chips. The status colour stays as a band of teardrop body around the
  // disc. The order-number fallback keeps its dark-on-teardrop treatment.
  const symbol = glyph
    ? `<span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#f3efe6;">
         <span style="transform:rotate(45deg);display:flex;line-height:0;">${categoryGlyphSvg(glyph, { size: 20, color: '#b19071' })}</span>
       </span>`
    : `<span style="transform:rotate(45deg);color:#1f1a1e;font-weight:700;font-size:12px;font-family:Montserrat,sans-serif;">${order}</span>`
  return L.divIcon({
    className: 'arcavia-pin',
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:34px;height:34px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};border:2px solid #ffebd9;
        box-shadow:0 2px 6px rgba(0,0,0,.4);">
        ${symbol}
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
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
