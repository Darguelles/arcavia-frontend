import { useEffect, useState } from 'react'
import type { RewardEarnedEntry } from '../types/api'

/**
 * Celebratory overlay when a scan/answer grants new rewards (spec §6/§8.9).
 * Fires from AnswerResponse.rewards_earned — distinct from the routine
 * correct/incorrect feedback, since this is the moment most likely to keep a
 * player engaged. Renders nothing when there are no rewards.
 */
export function RewardEarnedToast({
  rewards,
  onDismiss,
}: {
  rewards: RewardEarnedEntry[]
  onDismiss?: () => void
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (rewards.length === 0) return
    const t = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, 5000)
    return () => clearTimeout(t)
  }, [rewards.length, onDismiss])

  if (rewards.length === 0 || !visible) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[max(16px,env(safe-area-inset-top))]"
    >
      <div className="w-full max-w-[360px] rounded-[10px] border border-gold bg-ink-card p-4 shadow-lg">
        <p className="text-center text-[13px] font-semibold uppercase tracking-wide text-gold">
          ¡Recompensa desbloqueada! 🎉
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          {rewards.map((r) => (
            <li key={r.reward_id} className="flex items-center gap-3">
              {r.image_url ? (
                <img src={r.image_url} alt="" className="h-10 w-10 rounded-[5px] object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gold/30 text-[18px]">
                  🎁
                </span>
              )}
              <span className="text-[15px] font-semibold text-cream">{r.name}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            setVisible(false)
            onDismiss?.()
          }}
          className="mt-3 w-full text-center text-[12px] text-cream/70 underline"
        >
          Ver en Mis cupones
        </button>
      </div>
    </div>
  )
}
