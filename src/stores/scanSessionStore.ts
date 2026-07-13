import { create } from 'zustand'
import type { UUID } from '../types/api'

export type CameraPermission = 'unknown' | 'prompt' | 'granted' | 'denied'

/**
 * Ephemeral state for the QR scan flow (spec §7). Never persisted — a scan is
 * a single in-the-moment gesture and the server owns the outcome.
 */
interface ScanSessionState {
  // The waypoint currently being scanned (route param mirror).
  waypointId: UUID | null
  cameraPermission: CameraPermission
  decoding: boolean

  startScan: (waypointId: UUID) => void
  setCameraPermission: (p: CameraPermission) => void
  setDecoding: (v: boolean) => void
  reset: () => void
}

export const useScanSessionStore = create<ScanSessionState>((set) => ({
  waypointId: null,
  cameraPermission: 'unknown',
  decoding: false,

  startScan: (waypointId) => set({ waypointId, decoding: false }),
  setCameraPermission: (cameraPermission) => set({ cameraPermission }),
  setDecoding: (decoding) => set({ decoding }),
  reset: () => set({ waypointId: null, cameraPermission: 'unknown', decoding: false }),
}))
