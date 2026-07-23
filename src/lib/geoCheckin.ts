import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Client-side geolocation streaming for the check-in flow (spec: geolocation
 * validation). Foreground-only — navigator.geolocation is document-scoped and
 * does not exist in a Service Worker, so this only runs while the check-in
 * screen is mounted and the tab is visible. Authoritative dwell state lives
 * server-side (app/services/geo_checkin.py); nothing here decides pass/fail.
 */

export interface RawFix {
  lat: number
  lng: number
  accuracy: number
  altitude: number | null
}

function toRawFix(pos: GeolocationPosition): RawFix {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude,
  }
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0, // never accept a cached fix — the server assumes nothing anyway
  timeout: 15_000,
}

/**
 * watchPosition alone gives no cadence guarantee — a stationary user may get
 * very few callbacks. Supplement with a getCurrentPosition poll on a timer so
 * fixes keep reaching the server across the dwell window. Returns one cleanup
 * function that clears both.
 */
export function watchAndPoll(
  onFix: (fix: RawFix) => void,
  onError: (err: GeolocationPositionError | Error) => void,
  pollIntervalMs = 12_000
): () => void {
  if (!('geolocation' in navigator)) {
    onError(new Error('GEOLOCATION_UNSUPPORTED'))
    return () => {}
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => onFix(toRawFix(pos)),
    (err) => onError(err),
    GEOLOCATION_OPTIONS
  )

  const intervalId = window.setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => onFix(toRawFix(pos)),
      (err) => onError(err),
      GEOLOCATION_OPTIONS
    )
  }, pollIntervalMs)

  return () => {
    navigator.geolocation.clearWatch(watchId)
    window.clearInterval(intervalId)
  }
}

/**
 * Screen Wake Lock, held only while the check-in screen is active so the
 * watch keeps firing while the screen stays on (Safari 16.4+ / Chrome).
 * Auto-releases on `visibilitychange` → hidden; re-acquires on → visible.
 * Feature-detected no-op on unsupported browsers — check-in still works,
 * just without the screen-stay-on guarantee.
 */
export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null)
  const [active, setActive] = useState(false)

  const acquire = useCallback(async () => {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try {
      const lock = await navigator.wakeLock.request('screen')
      lockRef.current = lock
      setActive(true)
      lock.addEventListener('release', () => setActive(false))
    } catch {
      // denied / not allowed in this context — degrade silently
      setActive(false)
    }
  }, [])

  const release = useCallback(async () => {
    const lock = lockRef.current
    lockRef.current = null
    try {
      await lock?.release()
    } catch {
      // already released
    }
    setActive(false)
  }, [])

  useEffect(() => {
    void acquire()
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !lockRef.current) void acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      void release()
    }
  }, [acquire, release])

  return { active, release }
}

/** Tracks document.visibilityState — used to surface a "keep the app open and
 * screen on" banner when the tab is backgrounded (watchPosition/wake lock both
 * stop firing then; server-side Redis dwell state means nothing is lost). */
export function useDocumentVisibility(): DocumentVisibilityState {
  const [visibility, setVisibility] = useState<DocumentVisibilityState>(
    () => document.visibilityState
  )
  useEffect(() => {
    const onChange = () => setVisibility(document.visibilityState)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visibility
}
