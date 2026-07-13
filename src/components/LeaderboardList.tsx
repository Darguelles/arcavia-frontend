import { cn } from '../lib/utils'
import type { LeaderboardEntry } from '../types/api'

/**
 * City leaderboard (spec §6/§8.12). Built against the API contract now even
 * though the Figma RANKING layout is still pending.
 *
 * NOTE / API GAP: entries carry only `user_id` + `points` — no display name yet.
 * We render rank + points and a shortened id until the API adds names; the
 * current user's row is highlighted when `currentUserId` matches.
 */
export function LeaderboardList({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[]
  currentUserId?: string
}) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-[14px] text-cream/60">
        Todavía no hay puntajes en esta ciudad. ¡Sé el primero!
      </p>
    )
  }

  return (
    <ol className="flex flex-col gap-2">
      {entries.map((e) => {
        const isMe = currentUserId && e.user_id === currentUserId
        return (
          <li
            key={e.user_id}
            className={cn(
              'flex items-center gap-3 rounded-[5px] px-4 py-3',
              isMe ? 'bg-gold text-ink' : 'bg-ink-card text-cream'
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold',
                e.rank <= 3 ? 'bg-gold text-ink' : 'bg-cream/10 text-cream',
                isMe && 'bg-ink/20 text-ink'
              )}
            >
              {e.rank}
            </span>
            <span className="flex-1 truncate text-[15px] font-semibold">
              {isMe ? 'Tú' : `Jugador ${e.user_id.slice(0, 6)}`}
            </span>
            <span className="text-[15px] font-bold tabular-nums">{e.points} pts</span>
          </li>
        )
      })}
    </ol>
  )
}
