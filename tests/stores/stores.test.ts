import { beforeEach, describe, expect, it, vi } from 'vitest'

// citySessionStore persists through this module — mock it so tests don't touch IndexedDB.
vi.mock('../../src/lib/idb', () => {
  const mem = new Map<string, unknown>()
  return {
    idbStore: {
      get: vi.fn((k: string) => Promise.resolve(mem.get(k))),
      set: vi.fn((k: string, v: unknown) => {
        mem.set(k, v)
        return Promise.resolve()
      }),
      del: vi.fn((k: string) => {
        mem.delete(k)
        return Promise.resolve()
      }),
    },
  }
})

import { useAuthStore } from '../../src/stores/authStore'
import { useCheckInSessionStore } from '../../src/stores/checkInSessionStore'
import { useCitySessionStore } from '../../src/stores/citySessionStore'
import { useScanSessionStore } from '../../src/stores/scanSessionStore'
import type { City } from '../../src/types/api'

const city: City = {
  id: 'c1',
  slug: 'lima',
  name: 'Lima',
  country: 'PE',
  default_locale: 'es-PE',
  timezone: 'America/Lima',
  center_lat: -12.05,
  center_lng: -77.04,
  legal_regime: 'LEY_29733',
  tile_url: 'https://tiles/{z}/{x}/{y}.png',
  is_active: true,
  launch_date: null,
}

describe('authStore', () => {
  beforeEach(() => useAuthStore.getState().clearSession())

  it('tracks authentication via the access token', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    useAuthStore.getState().setAccessToken('tok')
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
  })

  it('clearSession wipes token and user', () => {
    useAuthStore.getState().setAccessToken('tok')
    useAuthStore.getState().setUser({ id: 'u1' } as never)
    useAuthStore.getState().clearSession()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })
})

describe('citySessionStore', () => {
  beforeEach(() => useCitySessionStore.getState().clearCity())

  it('selectCity sets the city and clears candidates', () => {
    useCitySessionStore.getState().setCandidates([city])
    useCitySessionStore.getState().selectCity(city)
    expect(useCitySessionStore.getState().city?.id).toBe('c1')
    expect(useCitySessionStore.getState().candidates).toHaveLength(0)
  })

  it('hydrate restores a previously selected city', async () => {
    useCitySessionStore.getState().selectCity(city)
    // reset in-memory then hydrate from the mocked idb
    useCitySessionStore.setState({ city: null, hydrated: false })
    await useCitySessionStore.getState().hydrate()
    expect(useCitySessionStore.getState().city?.id).toBe('c1')
    expect(useCitySessionStore.getState().hydrated).toBe(true)
  })
})

describe('scanSessionStore', () => {
  beforeEach(() => useScanSessionStore.getState().reset())

  it('startScan sets the waypoint and resets decoding', () => {
    useScanSessionStore.getState().setDecoding(true)
    useScanSessionStore.getState().startScan('wp1')
    expect(useScanSessionStore.getState().waypointId).toBe('wp1')
    expect(useScanSessionStore.getState().decoding).toBe(false)
  })

  it('reset clears everything', () => {
    useScanSessionStore.getState().startScan('wp1')
    useScanSessionStore.getState().setCameraPermission('granted')
    useScanSessionStore.getState().reset()
    expect(useScanSessionStore.getState().waypointId).toBeNull()
    expect(useScanSessionStore.getState().cameraPermission).toBe('unknown')
  })
})

describe('checkInSessionStore', () => {
  beforeEach(() => useCheckInSessionStore.getState().reset())

  it('startCheckIn sets the waypoint and resets to the permission phase', () => {
    useCheckInSessionStore.getState().setPhase('watching')
    useCheckInSessionStore.getState().startCheckIn('wp1')
    expect(useCheckInSessionStore.getState().waypointId).toBe('wp1')
    expect(useCheckInSessionStore.getState().phase).toBe('permission')
    expect(useCheckInSessionStore.getState().lastReadout).toBeNull()
  })

  it('setLastReadout stores the latest server progress readout', () => {
    const readout = {
      distance_m: 12,
      inside: true,
      accurate: true,
      accepted_fixes: 2,
      dwell_progress: 0.5,
      dwell_satisfied: false,
      qr_verified: false,
      keyword_verified: false,
      awaiting: ['dwell'],
      keyword_prompt: null,
    }
    useCheckInSessionStore.getState().setLastReadout(readout)
    expect(useCheckInSessionStore.getState().lastReadout).toEqual(readout)
  })

  it('reset clears everything', () => {
    useCheckInSessionStore.getState().startCheckIn('wp1')
    useCheckInSessionStore.getState().setGeoPermission('granted')
    useCheckInSessionStore.getState().setPhase('watching')
    useCheckInSessionStore.getState().reset()
    expect(useCheckInSessionStore.getState().waypointId).toBeNull()
    expect(useCheckInSessionStore.getState().geoPermission).toBe('unknown')
    expect(useCheckInSessionStore.getState().phase).toBe('permission')
  })
})
