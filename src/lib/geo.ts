/**
 * Client-side geo helpers. Distance-to-waypoint is computed locally while the
 * player walks — this generates zero backend traffic; the server only sees the
 * scan moment (spec §7/§10). Mirrors the backend haversine so the on-screen
 * distance matches the server's proximity check.
 */

const EARTH_RADIUS_M = 6_371_000

export interface LatLng {
  lat: number
  lng: number
}

/** Great-circle distance in metres between two coordinates. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Human-friendly distance label, e.g. "12 m" or "1.4 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Promisified single-shot geolocation with a sane timeout. */
export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 }
): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('GEOLOCATION_UNSUPPORTED'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      options
    )
  })
}
