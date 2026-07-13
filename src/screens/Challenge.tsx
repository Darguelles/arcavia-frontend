import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { AnswerOption } from '../components/AnswerOption'
import { QrScanner } from '../components/QrScanner'
import { PrimaryButton } from '../components/PrimaryButton'
import { SecondaryButton } from '../components/SecondaryButton'
import { LoadingState } from '../components/states'
import { ApiClientError } from '../api/client'
import { useAnswerChallenge, useValidateScan } from '../api/gameplay'
import { getCurrentPosition } from '../lib/geo'
import type { ChallengePublic, UUID } from '../types/api'
import type { ChallengeNavState } from './challengeNav'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/*
 * DESAFIO (/waypoints/:waypointId/challenge) — Figma frame 115:164.
 * Two phases: (1) scan the QR → validate-scan proximity/anti-cheat gate, then
 * (2) answer the returned challenge. Distinct scan errors get distinct messages
 * (spec §8.8). Options are server-shuffled — never re-sorted (§9).
 */
export function Challenge() {
  const { waypointId } = useParams<{ waypointId: string }>()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: ChallengeNavState | null }

  const validateScan = useValidateScan(waypointId ?? '')
  const [challenges, setChallenges] = useState<ChallengePublic[] | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const online = typeof navigator === 'undefined' || navigator.onLine

  const handleDecode = async (token: string) => {
    setScanError(null)
    setBusy(true)
    try {
      const coords = await getCurrentPosition()
      const res = await validateScan.mutateAsync({
        token: token as UUID,
        lat: coords.lat,
        lng: coords.lng,
      })
      setChallenges(res.challenges)
    } catch (err) {
      setScanError(scanErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const abandon = () => {
    if (state?.missionId && state?.phaseId) {
      navigate(`/missions/${state.missionId}/phases/${state.phaseId}`)
    } else {
      navigate('/missions')
    }
  }

  // Phase 2 — answering
  if (challenges && challenges.length > 0) {
    return (
      <ChallengeQuestion
        waypointId={waypointId!}
        challenge={challenges[0]}
        state={state}
        onAbandon={abandon}
      />
    )
  }

  // Phase 1 — scanning
  return (
    <AppShell back title="Desafío">
      <div className="flex flex-col gap-5 py-4">
        <div>
          <p className="text-[14px] text-cream/80">{state?.category ?? 'Punto de la misión'}</p>
          <h1 className="text-[28px] font-bold text-cream">
            {state?.waypointName ?? 'Escanea el código'}
          </h1>
        </div>

        {!online && (
          <p className="rounded-[5px] bg-incorrect/20 p-3 text-center text-[14px] text-cream">
            Necesitas conexión para escanear.
          </p>
        )}

        {busy ? (
          <LoadingState label="Validando tu ubicación…" />
        ) : (
          <>
            <p className="text-[14px] text-cream/70">
              Apunta la cámara al código QR del punto para comenzar el desafío.
            </p>
            <QrScanner onDecode={handleDecode} onError={setScanError} />
          </>
        )}

        {scanError && (
          <p className="rounded-[5px] bg-incorrect/20 p-3 text-center text-[14px] text-cream">
            {scanError}
          </p>
        )}

        <SecondaryButton onClick={abandon}>Abandonar desafío</SecondaryButton>
      </div>
    </AppShell>
  )
}

function ChallengeQuestion({
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

/** Map validate-scan error codes to distinct, user-facing messages (spec §8.8). */
function scanErrorMessage(err: unknown): string {
  if (!(err instanceof ApiClientError)) {
    if (err instanceof GeolocationPositionError || (err as { code?: number })?.code != null) {
      return 'No pudimos obtener tu ubicación. Activa el GPS e inténtalo de nuevo.'
    }
    return 'Ocurrió un error al validar el escaneo.'
  }
  switch (err.code) {
    case 'OUT_OF_RANGE': {
      const d = err.details?.distance_m
      return d != null
        ? `Estás a ${d} m del punto. Acércate más para escanear.`
        : 'Estás demasiado lejos del punto. Acércate más.'
    }
    case 'INVALID_QR':
      return 'Código QR no válido o inactivo.'
    case 'QR_WAYPOINT_MISMATCH':
      return 'Este código no corresponde a este punto de la ruta.'
    case 'ALREADY_COMPLETED':
      return 'Ya completaste este punto.'
    case 'WAYPOINT_UNAVAILABLE':
    case 'MISSION_UNAVAILABLE':
      return 'Este punto no está disponible por ahora.'
    default:
      return err.message || 'No se pudo validar el escaneo.'
  }
}
