import { cn } from '../lib/utils'

interface AnswerOptionProps {
  // Lettered A/B/C/D per the DESAFIO design (spec §6/§8.8).
  letter: string
  text: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}

/**
 * A single answer choice. Order is fixed by the server's anti-cheat shuffle —
 * NEVER re-sort client-side (spec §8.8/§9). Selected state uses the gold accent
 * matching the Figma "Pileta" highlight.
 */
export function AnswerOption({ letter, text, selected, disabled, onSelect }: AnswerOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-[5px] bg-[#f3efe6] px-4 py-3 text-left transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-70',
        selected && 'ring-2 ring-gold'
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold',
          selected ? 'border-gold bg-gold text-ink' : 'border-ink/40 text-ink/70'
        )}
        aria-hidden="true"
      >
        {letter}
      </span>
      <span className={cn('text-[18px]', selected ? 'font-bold text-gold' : 'text-ink')}>
        {text}
      </span>
    </button>
  )
}
