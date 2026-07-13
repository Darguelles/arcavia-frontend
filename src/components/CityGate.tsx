import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useResolveCity, useCities } from '../api/cities'
import { useCitySessionStore } from '../stores/citySessionStore'
import { getCurrentPosition } from '../lib/geo'
import { LoadingState } from './states'
import type { City } from '../types/api'

type Phase = 'idle' | 'locating' | 'pick'

/**
 * Ensures a city is selected before rendering city-scoped content (spec §7.1).
 * Tries GPS → GET /cities/resolve once; on a single match it auto-selects, on
 * overlap it offers the candidates, and on GPS failure/no-match it falls back to
 * the full active-city list. The choice persists via citySessionStore (IndexedDB).
 */
export function CityGate({ children }: { children: ReactNode }) {
  const { city, candidates, hydrated, selectCity, setCandidates } = useCitySessionStore()
  const resolve = useResolveCity()
  const allCities = useCities()
  const [phase, setPhase] = useState<Phase>('idle')
  const attempted = useRef(false)

  useEffect(() => {
    if (!hydrated || city || attempted.current) return
    attempted.current = true
    setPhase('locating')
    ;(async () => {
      try {
        const coords = await getCurrentPosition()
        const res = await resolve.mutateAsync(coords)
        if (res.city) {
          selectCity(res.city)
          return
        }
        if (res.candidates.length > 0) setCandidates(res.candidates)
        setPhase('pick')
      } catch {
        setPhase('pick')
      }
    })()
  }, [hydrated, city, resolve, selectCity, setCandidates])

  if (city) return <>{children}</>
  if (phase === 'locating' || !hydrated) {
    return <LoadingState label="Detectando tu ciudad…" />
  }

  const options = candidates.length > 0 ? candidates : (allCities.data ?? [])
  return <CityPicker cities={options} loading={allCities.isLoading} onSelect={selectCity} />
}

function CityPicker({
  cities,
  loading,
  onSelect,
}: {
  cities: City[]
  loading: boolean
  onSelect: (c: City) => void
}) {
  if (loading) return <LoadingState label="Cargando ciudades…" />
  return (
    <div className="flex flex-col gap-4 py-8">
      <h2 className="text-[22px] font-bold text-cream">Elige tu ciudad</h2>
      <p className="text-[14px] text-cream/70">
        No pudimos detectar tu ubicación automáticamente. Selecciona dónde quieres explorar.
      </p>
      <ul className="flex flex-col gap-3">
        {cities.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="flex w-full items-center justify-between rounded-[5px] bg-ink-card px-4 py-3 text-left transition-colors hover:bg-gold hover:text-black"
            >
              <span>
                <span className="block text-[16px] font-semibold">{c.name}</span>
                <span className="block text-[13px] opacity-70">{c.country}</span>
              </span>
            </button>
          </li>
        ))}
        {cities.length === 0 && (
          <li className="text-[14px] text-cream/60">No hay ciudades disponibles por ahora.</li>
        )}
      </ul>
    </div>
  )
}
