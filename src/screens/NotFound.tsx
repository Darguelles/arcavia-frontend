import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex min-h-dvh w-full max-w-[402px] flex-col items-center justify-center gap-4 bg-ink px-8 text-center text-cream">
      <p className="text-[64px] font-bold text-gold">404</p>
      <p className="text-[16px] text-cream/80">No encontramos esta página.</p>
      <Link to="/" className="font-semibold text-gold underline">
        Volver al inicio
      </Link>
    </div>
  )
}
