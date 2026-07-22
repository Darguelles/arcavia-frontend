import { cn } from '../lib/utils'
import { Avatar } from './Avatar'
import type { LeaderboardEntry } from '../types/api'

/**
 * City leaderboard (spec §6/§8.12). Figma frame 135:644: a top-3 podium over a
 * cream sheet listing the remaining ranks.
 *
 * NOTE / API GAP: entries carry only `user_id` + `points` — no display name or
 * avatar yet. We label rows from a shortened id (initials feed the Avatar
 * fallback) until the API adds names; the current user's row reads "Tú" and is
 * highlighted when `currentUserId` matches.
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

  const label = (e: LeaderboardEntry) =>
    currentUserId && e.user_id === currentUserId ? 'Tú' : `Jugador ${e.user_id.slice(0, 6)}`

  const podium = entries.filter((e) => e.rank <= 3)
  const rest = entries.filter((e) => e.rank > 3)
  // Podium display order: 2nd, 1st (elevated), 3rd.
  const ordered = [
    podium.find((e) => e.rank === 2),
    podium.find((e) => e.rank === 1),
    podium.find((e) => e.rank === 3),
  ]

  return (
    <div className="flex flex-col">
      {/* Top-3 podium */}
      <div className="flex items-end justify-center gap-4 pb-8 pt-2">
        {ordered.map((e, i) => {
          if (!e) return <div key={i} className="flex-1" />
          const isFirst = e.rank === 1
          const isMe = currentUserId && e.user_id === currentUserId
          return (
            <div key={e.user_id} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative">
                <Avatar
                  src={null}
                  name={label(e)}
                  size={isFirst ? 95 : 80}
                  className={cn(isMe && 'ring-2 ring-gold ring-offset-2 ring-offset-ink')}
                />
                <span className="absolute -bottom-1 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-gold text-[13px] font-bold text-ink">
                  {e.rank}
                </span>
              </div>
              <span
                className={cn('mt-2 font-bold text-cream', isFirst ? 'text-[16px]' : 'text-[14px]')}
              >
                {label(e)}
              </span>
              <span className={cn('text-cream/80', isFirst ? 'text-[12px]' : 'text-[10px]')}>
                {e.points} pts
              </span>
            </div>
          )
        })}
      </div>

      {/* Ranks 4+ on a cream sheet */}
      {rest.length > 0 && (
        <div className="-mx-5 rounded-t-[30px] bg-[#f3efe6] px-6 pb-8 pt-6">
          <ol className="flex flex-col divide-y divide-ink/10">
            {rest.map((e) => {
              const isMe = currentUserId && e.user_id === currentUserId
              return (
                <li
                  key={e.user_id}
                  className={cn(
                    'flex items-center gap-4 py-4',
                    isMe && 'rounded-[5px] bg-gold/20 px-2'
                  )}
                >
                  <span className="w-4 text-[14px] font-bold text-ink">{e.rank}</span>
                  <Avatar src={null} name={label(e)} size={42} />
                  <span className="flex-1 truncate text-[16px] text-ink">{label(e)}</span>
                  <span className="text-[16px] font-bold text-gold">{e.points} pts</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
