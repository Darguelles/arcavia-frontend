import { cn } from '../lib/utils'
import type { PhaseInMission } from '../types/api'

interface PhaseProgressFooterProps {
  phases: Pick<PhaseInMission, 'id' | 'name'>[]
  currentPhaseId: string
  onSelect: (phaseId: string) => void
}

/**
 * Phase navigator (spec §6/§8.6). Renders however many phases the mission
 * actually has — NEVER hardcoded to "fase 1 / fase 2". The active phase is
 * highlighted; tapping another switches the map/list to it.
 */
export function PhaseProgressFooter({
  phases,
  currentPhaseId,
  onSelect,
}: PhaseProgressFooterProps) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto" aria-label="Fases de la misión">
      {phases.map((phase, i) => {
        const active = phase.id === currentPhaseId
        return (
          <button
            key={phase.id}
            type="button"
            onClick={() => onSelect(phase.id)}
            aria-current={active ? 'true' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors',
              active ? 'bg-gold text-black' : 'bg-ink-card text-cream/80'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                active ? 'bg-black/20 text-black' : 'bg-cream/10 text-cream'
              )}
            >
              {i + 1}
            </span>
            {phase.name}
          </button>
        )
      })}
    </nav>
  )
}
