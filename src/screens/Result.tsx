import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ResultBanner } from '../components/ResultBanner'
import { RewardEarnedToast } from '../components/RewardEarnedToast'
import { PrimaryButton } from '../components/PrimaryButton'
import { TermsFooterLink } from '../components/TermsFooterLink'
import type { ResultNavState } from './challengeNav'

/*
 * PREGUNTA CORRECTA / INCORRECTA (/waypoints/:waypointId/result) — Figma frames
 * 14:287 / 121:389. Transient screen (§8.9): it only renders from the answer
 * response passed in navigation state; a direct hit / refresh has no state and
 * redirects back to the map rather than re-submitting an answer.
 */
export function Result() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: ResultNavState | null }

  if (!state?.result) {
    // No transient state (refresh or direct nav) — don't re-trigger a submit.
    return <Navigate to="/missions" replace />
  }

  const { result, points, missionId, phaseId } = state

  const backToMap = () => {
    if (missionId && phaseId) {
      navigate(`/missions/${missionId}/phases/${phaseId}`, { replace: true })
    } else {
      navigate('/missions', { replace: true })
    }
  }

  return (
    <AppShell>
      <RewardEarnedToast
        rewards={result.rewards_earned}
        onDismiss={() => {
          /* toast auto-dismisses; "Ver en Mis cupones" handled below */
        }}
      />

      <div className="flex flex-col gap-6 py-8">
        <ResultBanner result={result} pointsEarned={result.correct ? points : undefined} />

        {result.mission_complete && (
          <p className="rounded-[5px] bg-correct/20 p-3 text-center text-[15px] font-semibold text-cream">
            ¡Misión completada! 🏆
          </p>
        )}

        {result.rewards_earned.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/rewards')}
            className="text-center text-[13px] text-gold underline"
          >
            Ver mis cupones
          </button>
        )}

        <PrimaryButton onClick={backToMap}>Regresar al mapa</PrimaryButton>
        <TermsFooterLink />
      </div>
    </AppShell>
  )
}
