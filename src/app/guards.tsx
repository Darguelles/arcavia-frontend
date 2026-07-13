import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

/**
 * Gate for 👤 routes (spec §5). Unauthenticated users are redirected to /login
 * with a return-to param so they land back where they intended after signing in.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthed = useAuthStore((s) => s.accessToken !== null)
  const location = useLocation()

  if (!isAuthed) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }
  return <>{children}</>
}

/** Keeps already-authenticated users out of the public auth screens. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const isAuthed = useAuthStore((s) => s.accessToken !== null)
  if (isAuthed) return <Navigate to="/missions" replace />
  return <>{children}</>
}
