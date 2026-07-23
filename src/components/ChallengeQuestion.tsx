import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from './AppShell'
import { AnswerOption } from './AnswerOption'
import { PrimaryButton } from './PrimaryButton'
import { SecondaryButton } from './SecondaryButton'
import { ApiClientError } from '../api/client'
import { useAnswerChallenge } from '../api/gameplay'
import type { ChallengePublic, UUID } from '../types/api'
import type { ChallengeNavState } from '../screens/challengeNav'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * Answer-a-challenge UI (spec §8.8's Phase 2). Extracted so both the QR-scan
 * flow's old handoff and the geo check-in screen render the identical
 * post-presence-proof step: once presence is proven — however that happened —
 * the downstream answer/completion pipeline is unchanged.
 */
export function ChallengeQuestion({
  waypointId,
  challenge,
  state,
  onAbandon,
}: {
  waypointId: string
  challenge: ChallengePublic
  state: ChallengeNavState | null
  onAbandon: () => void
}) {
  const navigate = useNavigate()
  const answer = useAnswerChallenge(state?.missionId)
  const [selected, setSelected] = useState<UUID | null>(null)

  const confirm = () => {
    if (!selected) return
    answer.mutate(
      { challengeId: challenge.id, selectedOptionId: selected },
      {
        onSuccess: (result) => {
          navigate(`/waypoints/${waypointId}/result`, {
            // Transient screen — replace so browser-back skips it (§8.9).
            replace: true,
            state: {
              result,
              points: state?.points,
              missionId: state?.missionId,
              phaseId: state?.phaseId,
            },
          })
        },
      }
    )
  }

  const answerError =
    answer.error instanceof ApiClientError
      ? answer.error.message
      : answer.error
        ? 'No se pudo enviar la respuesta.'
        : null

  return (
    <AppShell back title="Desafío">
      <div className="flex flex-col gap-5 py-4">
        <div>
          <p className="text-[14px] text-cream/80">{state?.category ?? 'Visita'}</p>
          <h1 className="text-[28px] font-bold text-cream">{state?.waypointName ?? 'Desafío'}</h1>
        </div>

        <div className="rounded-[5px] border border-gold p-4">
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-bold text-cream">
              {challenge.is_riddle ? 'Acertijo' : 'Desafío'}
            </span>
            {state?.points != null && (
              <span className="text-[18px] font-bold text-gold">+ {state.points} pts</span>
            )}
          </div>
        </div>

        <p className="text-[22px] font-semibold leading-8 text-cream">{challenge.prompt}</p>

        <div className="flex flex-col gap-3">
          {challenge.options.map((opt, i) => (
            <AnswerOption
              key={opt.id}
              letter={LETTERS[i] ?? '?'}
              text={opt.text}
              selected={selected === opt.id}
              disabled={answer.isPending}
              onSelect={() => setSelected(opt.id)}
            />
          ))}
        </div>

        {answerError && <p className="text-center text-[14px] text-incorrect">{answerError}</p>}

        <PrimaryButton onClick={confirm} disabled={!selected} loading={answer.isPending}>
          Confirmar respuesta
        </PrimaryButton>
        <SecondaryButton onClick={onAbandon}>Abandonar desafío</SecondaryButton>
      </div>
    </AppShell>
  )
}
