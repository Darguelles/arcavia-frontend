import { useRouteError } from 'react-router-dom'

/**
 * Friendly route-level error boundary (spec §11 — surface errors gracefully
 * instead of a raw stack). Rendered via the router's `errorElement`, so any
 * uncaught render/loader error lands here rather than a dev overlay.
 */
export function RouteError() {
  const error = useRouteError()
  if (import.meta.env.DEV) {
    console.error('Route error:', error)
  }

  return (
    <div className="flex min-h-dvh w-full max-w-[402px] flex-col items-center justify-center gap-4 bg-ink px-8 text-center text-cream">
      <span className="text-[44px]">😕</span>
      <h1 className="text-[20px] font-bold">Algo salió mal</h1>
      <p className="text-[14px] text-cream/70">
        Ocurrió un error inesperado. Intenta recargar la aplicación.
      </p>
      <button
        type="button"
        onClick={() => window.location.assign('/')}
        className="rounded-[5px] bg-gold px-5 py-2 text-[14px] font-semibold text-black"
      >
        Volver al inicio
      </button>
    </div>
  )
}
