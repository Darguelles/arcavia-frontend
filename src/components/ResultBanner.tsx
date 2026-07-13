import type { AnswerResponse } from '../types/api'
import { CategoryProgressBar } from './CategoryProgressBar'

/**
 * Correct/incorrect feedback (spec §6/§8.9). `keyword` + `fun_fact` render only
 * when present — the API simply omits them on an incorrect answer, so there's no
 * special-casing beyond "don't render". Also shows overall mission progress from
 * `category_progress`.
 */
export function ResultBanner({
  result,
  pointsEarned,
}: {
  result: AnswerResponse
  // Points for this challenge (from the waypoint), shown as "+N pts".
  pointsEarned?: number
}) {
  const { correct, keyword, fun_fact, category_progress } = result

  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-[36px] font-bold text-cream">
        {correct ? '¡Correcto!' : '¡Incorrecto!'}
      </h1>

      {correct && pointsEarned != null && (
        <span className="rounded-[5px] border-2 border-gold px-5 py-2 text-[22px] font-bold text-gold">
          + {pointsEarned} pts
        </span>
      )}

      {/* keyword + fun_fact — correct answers only */}
      {(keyword || fun_fact) && (
        <div className="w-full rounded-[5px] bg-[#f3efe6] p-4 text-ink">
          {keyword && (
            <p className="text-[16px]">
              La palabra clave es <span className="text-[20px] font-bold text-gold">{keyword}</span>
            </p>
          )}
          {fun_fact && (
            <p className="mt-2 text-[16px] leading-6">
              <span className="font-semibold">Dato curioso: </span>
              {fun_fact}
            </p>
          )}
        </div>
      )}

      {/* Mission progress by category */}
      {category_progress.length > 0 && (
        <div className="w-full rounded-[5px] bg-ink-card p-4">
          <p className="mb-3 text-[16px] font-bold text-cream">Progreso de la misión</p>
          <div className="flex flex-col gap-3">
            {category_progress.map((c) => (
              <CategoryProgressBar
                key={c.category_id}
                label={c.name}
                earnedPct={c.earned_pct}
                thresholdPct={60}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
