import { cn } from '../lib/utils'

interface CategoryProgressBarProps {
  label: string
  // 0–100; omit when the player hasn't started (objectives-only view).
  earnedPct?: number
  thresholdPct: number
}

/**
 * One progress bar per mission category (spec §6/§8.2): earned % vs the
 * completion threshold. No direct Figma precedent — a plain labeled bar with a
 * threshold marker is the agreed safe default. When earned ≥ threshold the bar
 * flips to the "met" (green) state.
 */
export function CategoryProgressBar({ label, earnedPct, thresholdPct }: CategoryProgressBarProps) {
  const earned = earnedPct != null ? Math.max(0, Math.min(100, earnedPct)) : undefined
  const met = earned != null && earned >= thresholdPct

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-semibold text-cream">{label}</span>
        <span className={cn('tabular-nums', met ? 'text-correct' : 'text-cream/70')}>
          {earned != null ? `${Math.round(earned)}%` : ''}
          <span className="text-cream/50"> / {thresholdPct}%</span>
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink-card">
        {earned != null && (
          <div
            className={cn('h-full rounded-full transition-[width]', met ? 'bg-correct' : 'bg-gold')}
            style={{ width: `${earned}%` }}
            role="progressbar"
            aria-valuenow={Math.round(earned)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          />
        )}
        {/* Threshold marker */}
        <span
          className="absolute top-0 h-full w-0.5 bg-cream/60"
          style={{ left: `${thresholdPct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
