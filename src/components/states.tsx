import type { ReactNode } from 'react'
import { useT } from '../lib/i18n'

/** Centered spinner for query loading states. */
export function LoadingState({ label }: { label?: string }) {
  const t = useT()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-cream/70">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-cream/20 border-t-gold"
        role="status"
        aria-label={label ?? t('common.loading')}
      />
      <p className="text-[14px]">{label ?? t('common.loading')}</p>
    </div>
  )
}

/** Error panel with a retry affordance. */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useT()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-[15px] text-cream/80">{message ?? 'Algo salió mal.'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[5px] border border-gold px-4 py-2 text-[14px] font-semibold text-cream"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

/** Generic empty-state block. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-cream/70">
      {children}
    </div>
  )
}
