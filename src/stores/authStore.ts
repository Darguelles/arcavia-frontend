import { create } from 'zustand'
import type { UserProfile } from '../types/api'

/**
 * Session/auth state. The access token lives ONLY in memory — never
 * localStorage/sessionStorage (spec §11). The refresh token is an httpOnly
 * cookie the client JS never touches.
 */
interface AuthState {
  accessToken: string | null
  user: UserProfile | null
  // True once a page reload has attempted a silent refresh, so guards know
  // whether "no token" means "logged out" vs "not yet checked".
  bootstrapped: boolean

  setAccessToken: (token: string | null) => void
  setUser: (user: UserProfile | null) => void
  setBootstrapped: (v: boolean) => void
  clearSession: () => void

  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  bootstrapped: false,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setBootstrapped: (v) => set({ bootstrapped: v }),
  clearSession: () => set({ accessToken: null, user: null }),

  isAuthenticated: () => get().accessToken !== null,
}))
