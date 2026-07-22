import { cn } from '../lib/utils'
import type { WaypointInMission } from '../types/api'
import { CategoryGlyph, type CategoryGlyphVariant } from './CategoryGlyph'
import { STATUS_COLOR, STATUS_LABEL, type WaypointStatus } from './waypointStatus'

interface WaypointListItemProps {
  waypoint: WaypointInMission
  status?: WaypointStatus
  // Diamond glyph marking the waypoint's category (Figma 115:3). Omit to hide.
  glyphVariant?: CategoryGlyphVariant
  onClick?: () => void
}

/** Row in the phase list beneath the itinerary map (spec §6/§8.6). */
export function WaypointListItem({
  waypoint,
  status = 'todo',
  glyphVariant,
  onClick,
}: WaypointListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-cream/10 py-3 text-left"
    >
      <span className="flex items-center gap-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: STATUS_COLOR[status] }}
          aria-hidden="true"
        />
        <span>
          <span className="block text-[16px] text-cream">{waypoint.name}</span>
          <span className="block text-[12px] text-cream/55">
            {glyphVariant && (
              <CategoryGlyph
                variant={glyphVariant}
                size={9}
                className="mr-1 inline-block align-middle text-gold"
              />
            )}
            {waypoint.category_name} · {waypoint.points} pts ·{' '}
            <span className={cn(status === 'completed' && 'text-correct')}>
              {STATUS_LABEL[status]}
            </span>
          </span>
        </span>
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="text-cream/70"
      >
        <path
          d="M7 17L17 7M17 7H8M17 7v9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
