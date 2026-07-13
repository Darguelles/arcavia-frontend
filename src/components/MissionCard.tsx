import { cn } from '../lib/utils'
import type { Difficulty, MissionCard as MissionCardType } from '../types/api'

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  baja: 'Dificultad baja',
  media: 'Dificultad media',
  alta: 'Dificultad alta',
}

interface MissionCardProps {
  mission: MissionCardType
  index?: number
  // The API's MissionCard has no image field yet — pass one when it does.
  imageUrl?: string | null
  onClick?: () => void
}

/**
 * Mission list card (spec §6/§8.4): image, name, difficulty, explorers_count,
 * reward_points. Until the API returns a mission image, a warm gradient stands
 * in for the photo so the layout holds.
 */
export function MissionCard({ mission, index, imageUrl, onClick }: MissionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block h-[240px] w-full overflow-hidden rounded-[10px] text-left"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-card via-[#5a4a3d] to-gold/70" />
      )}
      {/* Bottom-up scrim so text stays legible over any image */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

      {/* Explorers + points badges */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className="rounded-[5px] bg-black/40 px-2 py-1 text-[13px] text-cream">
          <span className="font-bold">{mission.explorers_count}</span>{' '}
          <span className="font-medium">Exploradores</span>
        </span>
      </div>
      <span className="absolute right-3 top-3 rounded-[5px] border border-gold bg-black/30 px-2 py-1 text-[12px] font-bold text-cream">
        {mission.reward_points} pts
      </span>

      {/* Title block */}
      <div className="absolute inset-x-4 bottom-4">
        <h3 className="text-[28px] font-bold leading-none tracking-tight text-cream">
          {mission.name}
        </h3>
        <p className="mt-1 text-[15px] text-cream/90">
          {index != null ? `Misión N°${index + 1} / ` : ''}
          {DIFFICULTY_LABEL[mission.difficulty]}
        </p>
      </div>

      {/* Open affordance */}
      <span
        className={cn(
          'absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full',
          'bg-ink-card text-cream transition-colors group-hover:bg-gold group-hover:text-black'
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 17L17 7M17 7H8M17 7v9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  )
}
