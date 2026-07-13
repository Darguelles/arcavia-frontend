import type { AnswerHistoryEntry } from '../types/api'

/**
 * "Desafío N°X: keyword" collect-the-words history (spec §6/§8.11), powered by
 * GET /me/answers. A keyword is only present on a correctly answered challenge;
 * unsolved rows show a locked placeholder so the riddle stays a goal.
 */
export function KeywordHistoryList({ entries }: { entries: AnswerHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-[14px] text-cream/60">
        Aún no has resuelto desafíos. ¡Empieza a explorar para coleccionar palabras clave!
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => (
        <li
          key={e.challenge_id}
          className="flex items-center justify-between rounded-[5px] bg-ink-card px-4 py-3"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold text-cream">
              Desafío N°{e.order_index + 1}
              {e.is_riddle ? ' · Acertijo' : ''}
            </span>
            <span className="block truncate text-[12px] text-cream/60">
              {e.mission_name} · {e.waypoint_name}
            </span>
          </span>
          {e.keyword ? (
            <span className="shrink-0 text-[16px] font-bold text-gold">{e.keyword}</span>
          ) : (
            <span className="shrink-0 text-[13px] text-cream/40">🔒 sin resolver</span>
          )}
        </li>
      ))}
    </ul>
  )
}
