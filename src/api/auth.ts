import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import { queryClient } from './queryClient'
import { useAuthStore } from '../stores/authStore'
import type { LoginRequest, RegisterRequest, TokenResponse, UserProfile } from '../types/api'

const AUTH_PATH = '/api/v1/auth'

/** Fetch the current account and store it. Used after login/register and on boot. */
async function loadAccount(): Promise<UserProfile> {
  const user = await apiClient.get<UserProfile>('/api/v1/account')
  useAuthStore.getState().setUser(user)
  return user
}

export function useRegister() {
  return useMutation({
    mutationFn: async (body: RegisterRequest) => {
      const token = await apiClient.post<TokenResponse>(`${AUTH_PATH}/register`, body, {
        anonymous: true,
      })
      useAuthStore.getState().setAccessToken(token.access_token)
      await loadAccount()
    },
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const token = await apiClient.post<TokenResponse>(`${AUTH_PATH}/login`, body, {
        anonymous: true,
      })
      useAuthStore.getState().setAccessToken(token.access_token)
      await loadAccount()
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      // Best-effort server revocation; always clear locally regardless.
      try {
        await apiClient.post<void>(`${AUTH_PATH}/logout`)
      } finally {
        useAuthStore.getState().clearSession()
        queryClient.clear()
      }
    },
  })
}

/**
 * Silent boot: try a refresh (httpOnly cookie) to restore a session on reload.
 * Marks the auth store bootstrapped either way so guards stop waiting.
 */
export async function bootstrapSession(): Promise<void> {
  const store = useAuthStore.getState()
  try {
    // A protected GET triggers the client's 401→refresh path automatically.
    await loadAccount()
  } catch {
    store.clearSession()
  } finally {
    store.setBootstrapped(true)
  }
}
