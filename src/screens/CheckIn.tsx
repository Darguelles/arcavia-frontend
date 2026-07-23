import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { ChallengeQuestion } from '../components/ChallengeQuestion'
import { QrScanner } from '../components/QrScanner'
import { PrimaryButton } from '../components/PrimaryButton'
import { SecondaryButton } from '../components/SecondaryButton'
import { LoadingState } from '../components/states'
import { ApiClientError } from '../api/client'
import {
  useStartGeoCheckin,
  useSubmitGeoFix,
  useSubmitGeoKeyword,
  useSubmitGeoQr,
} from '../api/geoCheckin'
import { formatDistance } from '../lib/geo'
import { useDocumentVisibility, useWakeLock, watchAndPoll, type RawFix } from '../lib/geoCheckin'
import { useCheckInSessionStore } from '../stores/checkInSessionStore'
import { isGeoCheckinComplete } from '../types/api'
import type { ChallengePublic, GeoCheckinStartResponse } from '../types/api'
import type { ChallengeNavState } from './challengeNav'

/*
 * CheckIn (/waypoints/:waypointId/checkin) — replaces the QR-only scan phase.
 * Geolocation dwell check-in is the always-on presence proof for every
 * waypoint; requires_qr/requires_keyword (returned by the server, never
 * assumed client-side) add optional sub-steps. Once every required factor is
 * satisfied, the server hands back the waypoint's challenges and this screen
 * hands off to the exact same ChallengeQuestion/answer/result flow the old
 * QR scan used — only the presence-proof gate changed.
 */
export function CheckIn() {
  const { waypointId } = useParams<{ waypointId: string }>()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: ChallengeNavState | null }

  const startCheckIn = useStartGeoCheckin(waypointId ?? '')
  const submitFix = useSubmitGeoFix(waypointId ?? '')
  const submitQr = useSubmitGeoQr(waypointId ?? '')
  const submitKeyword = useSubmitGeoKeyword(waypointId ?? '')

  const phase = useCheckInSessionStore((s) => s.phase)
  const setPhase = useCheckInSessionStore((s) => s.setPhase)
  const geoPermission = useCheckInSessionStore((s) => s.geoPermission)
  const setGeoPermission = useCheckInSessionStore((s) => s.setGeoPermission)
  const lastReadout = useCheckInSessionStore((s) => s.lastReadout)
  const setLastReadout = useCheckInSessionStore((s) => s.setLastReadout)
  const reset = useCheckInSessionStore((s) => s.reset)

  const [session, setSession] = useState<GeoCheckinStartResponse | null>(null)
  const [challenges, setChallenges] = useState<ChallengePublic[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrVerified, setQrVerified] = useState(false)
  const [keywordVerified, setKeywordVerified] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const [keywordWrong, setKeywordWrong] = useState(false)

  // Held only while this screen is mounted; re-acquired on visibilitychange.
  useWakeLock()
  const visibility = useDocumentVisibility()
  const stopWatchingRef = useRef<(() => void) | null>(null)

  // Start (or reconnect to) the check-in session as soon as the screen mounts —
  // this needs no device permission, just the geofence/dwell config.
  useEffect(() => {
    if (!waypointId) return
    startCheckIn.mutate(undefined, {
      onSuccess: (res) => {
        setSession(res)
        setQrVerified(res.qr_verified)
        setKeywordVerified(res.keyword_verified)
      },
      onError: (err) => setError(checkInErrorMessage(err)),
    })
    return () => {
      stopWatchingRef.current?.()
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypointId])

  const handleFix = (fix: RawFix) => {
    setGeoPermission('granted')
    submitFix.mutate(
      { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy, altitude: fix.altitude },
      {
        onSuccess: (result) => {
          if (isGeoCheckinComplete(result)) {
            stopWatchingRef.current?.()
            setChallenges(result.challenges)
          } else {
            setLastReadout(result)
            setQrVerified(result.qr_verified)
            setKeywordVerified(result.keyword_verified)
          }
        },
        onError: (err) => setError(checkInErrorMessage(err)),
      }
    )
  }

  const beginWatching = () => {
    setGeoPermission('prompt')
    setPhase('watching')
    stopWatchingRef.current = watchAndPoll(handleFix, (err) => {
      if (err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED) {
        setGeoPermission('denied')
      } else if (geoPermission !== 'granted') {
        setError('No pudimos obtener tu ubicación. Activa el GPS e inténtalo de nuevo.')
      }
    })
  }

  const handleQrDecode = (token: string) => {
    setShowQrScanner(false)
    submitQr.mutate(
      { token },
      {
        onSuccess: (result) => {
          if (isGeoCheckinComplete(result)) {
            stopWatchingRef.current?.()
            setChallenges(result.challenges)
          } else {
            setLastReadout(result)
            setQrVerified(result.qr_verified)
          }
        },
        onError: (err) => setError(checkInErrorMessage(err)),
      }
    )
  }

  const handleKeywordSubmit = () => {
    if (!keywordInput.trim()) return
    setKeywordWrong(false)
    submitKeyword.mutate(
      { answer: keywordInput },
      {
        onSuccess: (result) => {
          if (!result.correct) {
            setKeywordWrong(true)
            return
          }
          setKeywordVerified(true)
          if ('challenges' in result) {
            stopWatchingRef.current?.()
            setChallenges(result.challenges)
          }
        },
        onError: (err) => setError(checkInErrorMessage(err)),
      }
    )
  }

  const abandon = () => {
    stopWatchingRef.current?.()
    if (state?.missionId && state?.phaseId) {
      navigate(`/missions/${state.missionId}/phases/${state.phaseId}`)
    } else {
      navigate('/missions')
    }
  }

  // Hand off to the unchanged answer/completion pipeline once presence is proven.
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

  if (startCheckIn.isPending || !session) {
    return (
      <AppShell back title="Verificación">
        <LoadingState label="Preparando la verificación de ubicación…" />
      </AppShell>
    )
  }

  const awaitingQr = session.requires_qr && !qrVerified
  const awaitingKeyword = session.requires_keyword && !keywordVerified
  const dwellSatisfied = lastReadout?.dwell_satisfied ?? false

  return (
    <AppShell back title="Verificación">
      <div className="flex flex-col gap-5 py-4">
        <div>
          <p className="text-[14px] text-cream/80">{state?.category ?? 'Punto de la misión'}</p>
          <h1 className="text-[28px] font-bold text-cream">
            {state?.waypointName ?? 'Confirma tu ubicación'}
          </h1>
        </div>

        {phase === 'permission' && geoPermission !== 'denied' && (
          <div className="flex flex-col gap-3 rounded-[5px] border border-gold p-4">
            <p className="text-[14px] text-cream/90">
              Necesitamos tu ubicación para confirmar que estás en este punto. Quédate cerca durante{' '}
              {session.dwell_seconds} segundos — no usamos tu ubicación fuera de esta pantalla.
            </p>
            <PrimaryButton onClick={beginWatching}>Activar ubicación</PrimaryButton>
          </div>
        )}

        {geoPermission === 'denied' && (
          <p className="rounded-[5px] bg-incorrect/20 p-3 text-center text-[14px] text-cream">
            Activa el permiso de ubicación en los ajustes del navegador para continuar.
          </p>
        )}

        {geoPermission === 'granted' && (
          <>
            {visibility === 'hidden' && (
              <p className="rounded-[5px] bg-incorrect/20 p-3 text-center text-[14px] text-cream">
                Mantén la app abierta y la pantalla encendida para seguir verificando tu ubicación.
              </p>
            )}

            {lastReadout && !lastReadout.accurate && (
              <p className="rounded-[5px] bg-incorrect/20 p-3 text-center text-[14px] text-cream">
                Tu señal de ubicación es poco precisa. Activa "Ubicación precisa" o sal a un espacio
                abierto.
              </p>
            )}

            <div className="rounded-[5px] border border-gold p-4">
              {lastReadout && !lastReadout.inside ? (
                <p className="text-[14px] text-cream/90">
                  Estás a {formatDistance(lastReadout.distance_m)} — acércate más.
                </p>
              ) : (
                <p className="text-[14px] text-cream/90">
                  {dwellSatisfied ? 'Presencia confirmada.' : 'Quédate aquí un momento…'}
                </p>
              )}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cream/10">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${Math.round((lastReadout?.dwell_progress ?? 0) * 100)}%` }}
                />
              </div>
            </div>

            {awaitingQr && (
              <div className="flex flex-col gap-3 rounded-[5px] border border-gold p-4">
                <p className="text-[14px] text-cream/90">
                  Este punto también requiere escanear su código QR.
                </p>
                {showQrScanner ? (
                  <QrScanner onDecode={handleQrDecode} onError={setError} />
                ) : (
                  <SecondaryButton onClick={() => setShowQrScanner(true)}>
                    Escanear código QR
                  </SecondaryButton>
                )}
              </div>
            )}

            {session.requires_keyword && dwellSatisfied && !keywordVerified && (
              <div className="flex flex-col gap-3 rounded-[5px] border border-gold p-4">
                <p className="text-[14px] text-cream/90">
                  {lastReadout?.keyword_prompt ?? 'Responde la pregunta del lugar.'}
                </p>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="rounded-[5px] border border-cream/20 bg-transparent px-3 py-2 text-[14px] text-cream"
                  placeholder="Tu respuesta"
                />
                {keywordWrong && (
                  <p className="text-[13px] text-incorrect">
                    Respuesta incorrecta. Inténtalo de nuevo.
                  </p>
                )}
                <PrimaryButton
                  onClick={handleKeywordSubmit}
                  disabled={!keywordInput.trim()}
                  loading={submitKeyword.isPending}
                >
                  Confirmar respuesta
                </PrimaryButton>
              </div>
            )}

            {!awaitingQr && !awaitingKeyword && dwellSatisfied && (
              <LoadingState label="Confirmando…" />
            )}
          </>
        )}

        {error && (
          <p className="rounded-[5px] bg-incorrect/20 p-3 text-center text-[14px] text-cream">
            {error}
          </p>
        )}

        <SecondaryButton onClick={abandon}>Abandonar desafío</SecondaryButton>
      </div>
    </AppShell>
  )
}

/** Map geo-checkin error codes to distinct, user-facing messages. */
function checkInErrorMessage(err: unknown): string {
  if (!(err instanceof ApiClientError)) {
    return 'Ocurrió un error al verificar tu ubicación.'
  }
  switch (err.code) {
    case 'ALREADY_COMPLETED':
      return 'Ya completaste este punto.'
    case 'WAYPOINT_UNAVAILABLE':
    case 'MISSION_UNAVAILABLE':
      return 'Este punto no está disponible por ahora.'
    case 'CHECKIN_NOT_STARTED':
      return 'Tu verificación expiró. Vuelve a intentarlo.'
    case 'DWELL_NOT_SATISFIED':
      return 'Quédate en el lugar un poco más antes de responder.'
    case 'INVALID_QR':
      return 'Código QR no válido o inactivo.'
    case 'QR_WAYPOINT_MISMATCH':
      return 'Este código no corresponde a este punto de la ruta.'
    case 'RATE_LIMITED':
      return 'Vas muy rápido. Espera unos segundos e inténtalo de nuevo.'
    default:
      return err.message || 'No se pudo verificar tu ubicación.'
  }
}
