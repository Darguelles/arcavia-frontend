import { useEffect, useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../api/queryClient'
import { bootstrapSession } from '../api/auth'
import { useCitySessionStore } from '../stores/citySessionStore'

/**
 * Global providers + one-time boot: restore the session via the refresh cookie
 * and hydrate the persisted city from IndexedDB before rendering routes.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const hydrateCity = useCitySessionStore((s) => s.hydrate)

  useEffect(() => {
    let active = true
    void Promise.all([bootstrapSession(), hydrateCity()]).finally(() => {
      if (active) setReady(true)
    })
    return () => {
      active = false
    }
  }, [hydrateCity])

  return (
    <QueryClientProvider client={queryClient}>
      {ready ? children : <BootSplash />}
    </QueryClientProvider>
  )
}

function BootSplash() {
  return (
    <div className="flex min-h-dvh w-full max-w-[402px] items-center justify-center bg-ink">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-cream/20 border-t-gold" />
    </div>
  )
}
