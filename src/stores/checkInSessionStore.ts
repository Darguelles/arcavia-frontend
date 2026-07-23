import { create } from 'zustand'
import type { GeoCheckinProgress, UUID } from '../types/api'

export type GeoPermission = 'unknown' | 'prompt' | 'granted' | 'denied'
export type CheckInPhase = 'permission' | 'watching' | 'keyword' | 'done'

/**
 * Ephemeral UI/session state for the geo check-in flow. Never persisted — a
 * check-in is an in-session activity and the server (Redis, keyed by
 * user+waypoint) owns the authoritative dwell/qr/keyword state, not this
 * store. On a tab reload this resets to defaults and the screen calls
 * geo-checkin/start again, which reconstructs progress from the server.
 */
interface CheckInSessionState {
  waypointId: UUID | null
  geoPermission: GeoPermission
  phase: CheckInPhase
  // Latest server readout, for the live distance/progress UI. Not
  // authoritative — just a rendering cache of the last response.
  lastReadout: GeoCheckinProgress | null

  startCheckIn: (waypointId: UUID) => void
  setGeoPermission: (p: GeoPermission) => void
  setPhase: (p: CheckInPhase) => void
  setLastReadout: (r: GeoCheckinProgress | null) => void
  reset: () => void
}

const initialState = {
  waypointId: null,
  geoPermission: 'unknown' as GeoPermission,
  phase: 'permission' as CheckInPhase,
  lastReadout: null,
}

export const useCheckInSessionStore = create<CheckInSessionState>((set) => ({
  ...initialState,

  startCheckIn: (waypointId) => set({ waypointId, phase: 'permission', lastReadout: null }),
  setGeoPermission: (geoPermission) => set({ geoPermission }),
  setPhase: (phase) => set({ phase }),
  setLastReadout: (lastReadout) => set({ lastReadout }),
  reset: () => set({ ...initialState }),
}))
