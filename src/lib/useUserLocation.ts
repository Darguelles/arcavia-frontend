import { useEffect, useState } from 'react'

/**
 * Live "you are here" position for map display / wayfinding (spec §10) — a
 * discovery aid, NOT the validation path. It generates zero backend traffic and
 * awards nothing; the server only ever sees the check-in fixes (a separate flow
 * in lib/geoCheckin.ts). Uses coarse, cached location on purpose — the
 * high-accuracy watch runs only on the check-in screen to save battery (spec
 * §13). Degrades silently: if permission is denied or geolocation is
 * unavailable, `location` stays null and the caller just omits the dot.
 */

export interface UserLocation {
  lat: number
  lng: number
  accuracy: number
}

export type UserLocationError = 'denied' | 'unavailable' | null

const COARSE_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 15_000,
  timeout: 20_000,
}

export function useUserLocation(enabled = true): {
  location: UserLocation | null
  error: UserLocationError
} {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<UserLocationError>(null)

  useEffect(() => {
    if (!enabled) return
    if (!('geolocation' in navigator)) {
      setError('unavailable')
      return
    }
    // Capture the reference so cleanup clears the watch we actually created,
    // even if `navigator` is swapped out from under us.
    const geo = navigator.geolocation
    const watchId = geo.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
        setError(null)
      },
      (err) => {
        setError(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
      },
      COARSE_OPTIONS
    )
    return () => geo.clearWatch(watchId)
  }, [enabled])

  return { location, error }
}
