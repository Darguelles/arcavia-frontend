import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { RewardCard } from '../components/RewardCard'
import { LoadingState, ErrorState } from '../components/states'
import { PrimaryButton } from '../components/PrimaryButton'
import { useMyRewards } from '../api/account'

/*
 * "Mis cupones" (/rewards) — spec §8.10a. Grid of RewardCards from GET /me/rewards
 * with a clear valid vs expired/not-yet-valid distinction. The empty state
 * encourages exploring missions rather than dead-ending — this screen is meant
 * to motivate. No redemption action yet (§6.15 open decision).
 */
export function Rewards() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useMyRewards(50, 0)

  return (
    <AppShell back title="Mis cupones">
      {isLoading && <LoadingState />}
      {isError && !isLoading && (
        <ErrorState message="No pudimos cargar tus cupones." onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-[48px]">🎁</span>
          <p className="text-[16px] font-semibold text-cream">Aún no tienes cupones</p>
          <p className="text-[14px] text-cream/70">
            Completa misiones y visita a los patrocinadores para ganar recompensas.
          </p>
          <PrimaryButton fullWidth={false} onClick={() => navigate('/missions')}>
            Explorar misiones
          </PrimaryButton>
        </div>
      )}

      {!isLoading && (data?.items.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-4 py-4">
          {data!.items.map((r) => (
            <RewardCard key={`${r.reward_id}-${r.earned_at}`} reward={r} />
          ))}
        </div>
      )}
    </AppShell>
  )
}
