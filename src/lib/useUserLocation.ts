import { useCallback, useEffect, useState } from 'react'

/**
 * Live "you are here" position for map display / wayfinding (spec §10) — a
 * discovery aid, NOT the validation path. It generates zero backend traffic and
 * awards nothing; the server only ever sees the check-in fixes (a separate flow
 * in lib/geoCheckin.ts). Uses coarse, cached location on purpose — the
 * high-accuracy watch runs only on the check-in screen to save battery (spec
 * §13).
 *
 * `status` lets the UI ask the player to enable location and explain *why* it's
 * unavailable — crucially distinguishing `insecure` (served over plain http on
 * a LAN IP, where mobile browsers refuse geolocation entirely and no prompt can
 * appear) from `denied` (permission actively blocked). `request()` re-asks on a
 * user gesture, which is the most reliable way to surface the browser prompt.
 */

export interface UserLocation {
  lat: number
  lng: number
  accuracy: number
}

export type LocationStatus =
  | 'unsupported' // browser has no geolocation API
  | 'insecure' // not a secure context (http on a LAN IP) — prompt can't appear
  | 'prompt' // usable, awaiting the player's decision / first fix
  | 'granted'
  | 'denied'
  | 'unavailable' // position couldn't be determined (signal, timeout)

const COARSE_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 15_000,
  timeout: 20_000,
}

function detectStatus(): LocationStatus {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return 'unsupported'
  // A LAN IP over http is not a secure context — geolocation is blocked before
  // any permission prompt. Only localhost and https qualify.
  if (typeof window !== 'undefined' && window.isSecureContext === false) return 'insecure'
  return 'prompt'
}

export function useUserLocation(enabled = true): {
  location: UserLocation | null
  status: LocationStatus
  request: () => void
} {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [status, setStatus] = useState<LocationStatus>(detectStatus)

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    })
    setStatus('granted')
  }, [])

  const onError = useCallback((err: GeolocationPositionError) => {
    setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')
  }, [])

  useEffect(() => {
    if (!enabled) return
    const s = detectStatus()
    if (s === 'unsupported' || s === 'insecure') {
      setStatus(s)
      return
    }
    // Capture the reference so cleanup clears the watch we actually created,
    // even if `navigator` is swapped out from under us.
    const geo = navigator.geolocation
    const watchId = geo.watchPosition(onSuccess, onError, COARSE_OPTIONS)
    return () => geo.clearWatch(watchId)
  }, [enabled, onSuccess, onError])

  // Re-ask on a user gesture — the reliable path to the browser permission
  // prompt, especially on mobile.
  const request = useCallback(() => {
    const s = detectStatus()
    if (s === 'unsupported' || s === 'insecure') {
      setStatus(s)
      return
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError, COARSE_OPTIONS)
  }, [onSuccess, onError])

  return { location, status, request }
}
