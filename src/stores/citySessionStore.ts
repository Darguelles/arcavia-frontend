import { create } from 'zustand'
import type { City } from '../types/api'
import { idbStore } from '../lib/idb'

const IDB_KEY = 'arcavia:selected-city'

/**
 * The city the player is exploring — either auto-detected from GPS
 * (GET /cities/resolve) or manually chosen when the bounding boxes overlap.
 * Persisted to IndexedDB (not localStorage — §11) so a reload keeps context.
 */
interface CitySessionState {
  city: City | null
  // Candidate cities when GPS resolved to more than one bbox (§7.1).
  candidates: City[]
  hydrated: boolean

  hydrate: () => Promise<void>
  selectCity: (city: City) => void
  setCandidates: (candidates: City[]) => void
  clearCity: () => void
}

export const useCitySessionStore = create<CitySessionState>((set) => ({
  city: null,
  candidates: [],
  hydrated: false,

  hydrate: async () => {
    const stored = await idbStore.get<City>(IDB_KEY)
    set({ city: stored ?? null, hydrated: true })
  },

  selectCity: (city) => {
    void idbStore.set(IDB_KEY, city)
    set({ city, candidates: [] })
  },

  setCandidates: (candidates) => set({ candidates }),

  clearCity: () => {
    void idbStore.del(IDB_KEY)
    set({ city: null, candidates: [] })
  },
}))
