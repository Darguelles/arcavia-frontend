import { cn } from '../lib/utils'
import type { RewardTeaser, UserReward } from '../types/api'

/** Small image placeholder used when a reward has no image_url. */
function RewardImage({ src, alt }: { src: string | null; alt: string }) {
  return src ? (
    <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-card to-gold/50">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 12v9H4v-9M2 7h20v5H2V7zM12 22V7M12 7S8 7 8 4.5 12 7 12 7zM12 7s4 0 4-2.5S12 7 12 7z"
          stroke="#ffebd9"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/**
 * Teaser preview (name + image only) for the mission-detail "available rewards"
 * section (spec §8.5) — motivates starting the mission.
 */
export function RewardTeaserCard({ reward }: { reward: RewardTeaser }) {
  return (
    <div className="w-[120px] shrink-0 overflow-hidden rounded-[10px] bg-ink-card">
      <div className="h-[80px] w-full">
        <RewardImage src={reward.image_url} alt={reward.name} />
      </div>
      <p className="truncate px-2 py-2 text-[13px] font-semibold text-cream">{reward.name}</p>
    </div>
  )
}

/**
 * Full coupon card for "Mis cupones" (spec §6/§8.10a): image, name, description,
 * validity window, with a distinct expired / not-yet-valid state when
 * `currently_valid` is false.
 */
export function RewardCard({ reward }: { reward: UserReward }) {
  const now = Date.now()
  const notYet = new Date(reward.validity_starts_at).getTime() > now
  const expired = new Date(reward.validity_ends_at).getTime() < now
  const invalid = !reward.currently_valid

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[10px] bg-ink-card',
        invalid && 'opacity-60 grayscale'
      )}
    >
      <div className="relative h-[140px] w-full">
        <RewardImage src={reward.image_url} alt={reward.name} />
        {invalid && (
          <span className="absolute right-2 top-2 rounded-[5px] bg-black/70 px-2 py-1 text-[11px] font-bold uppercase text-cream">
            {notYet ? 'Próximamente' : expired ? 'Expirado' : 'No válido'}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="text-[15px] font-bold text-cream">{reward.name}</h3>
        {reward.description && <p className="text-[13px] text-cream/75">{reward.description}</p>}
        <p className="mt-1 text-[12px] text-cream/55">
          Válido {formatDate(reward.validity_starts_at)} – {formatDate(reward.validity_ends_at)}
        </p>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}
