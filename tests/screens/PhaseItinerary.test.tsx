import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Fixture is defined via vi.hoisted so the hoisted vi.mock factory can reference it.
const { mission } = vi.hoisted(() => {
  const wp = (id: string, name: string, category: string) => ({
    id,
    name,
    description: '',
    // Category id tracks the name so the itinerary can distinguish categories.
    category_id: `cat-${category}`,
    category_name: category,
    points: 100,
    lat: -12.05,
    lng: -77.04,
    tolerance_radius_m: 50,
    order_index: 0,
  })
  return {
    mission: {
      id: 'm1',
      campaign_id: 'camp1',
      city_id: 'c1',
      name: 'Plaza Mayor',
      description: '',
      translations: {},
      difficulty: 'baja',
      reward_points: 1000,
      estimated_time_minutes: 60,
      explorers_count: 10,
      is_active: true,
      categories: [],
      available_rewards: [],
      phases: [
        {
          id: 'p1',
          name: 'Primera fase',
          order_index: 0,
          waypoints: [
            wp('w1', 'Plaza Mayor de Lima', 'Cultural'),
            wp('w2', 'Catedral', 'Cultural'),
          ],
        },
        {
          id: 'p2',
          name: 'Segunda fase',
          order_index: 1,
          waypoints: [wp('w3', 'Bar Cordano', 'Patrocinador')],
        },
      ],
    },
  }
})

// Stub the Leaflet map so tests don't touch the real map/DOM measurement.
vi.mock('../../src/components/MapView', () => ({
  MapView: () => <div data-testid="map" />,
}))

vi.mock('../../src/api/missions', () => ({
  useMissionDetail: () => ({ data: mission, isLoading: false, isError: false, refetch: vi.fn() }),
}))

// The walking-route hook uses React Query's useMutation; stub it so these
// map/accordion tests don't need a QueryClientProvider.
vi.mock('../../src/api/routing', () => ({
  useWalkingRoute: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { PhaseItinerary } from '../../src/screens/PhaseItinerary'
import { useCitySessionStore } from '../../src/stores/citySessionStore'

function renderItinerary() {
  return render(
    <MemoryRouter initialEntries={['/missions/m1', '/missions/m1/phases/p1']} initialIndex={1}>
      <Routes>
        <Route path="/missions/:missionId" element={<div>MISSION DETAIL</div>} />
        <Route path="/missions/:missionId/phases/:phaseId" element={<PhaseItinerary />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PhaseItinerary', () => {
  beforeEach(() => {
    useCitySessionStore.setState({
      city: {
        id: 'c1',
        slug: 'lima',
        name: 'Lima',
        country: 'PE',
        default_locale: 'es-PE',
        timezone: 'America/Lima',
        center_lat: -12.05,
        center_lng: -77.04,
        legal_regime: 'LEY_29733',
        tile_url: 'https://tiles.example.com/lima/{z}/{x}/{y}.png',
        is_active: true,
        launch_date: null,
      },
      candidates: [],
      hydrated: true,
    })
  })

  it('renders all phases as an accordion, both collapsed at load', () => {
    renderItinerary()
    // Both phase headers present (dynamic N, not hardcoded)
    expect(screen.getByRole('button', { name: /Primera fase/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Segunda fase/ })).toBeInTheDocument()
    // Nothing is expanded until the user taps a phase.
    expect(screen.queryByText('Plaza Mayor de Lima')).not.toBeInTheDocument()
    expect(screen.queryByText('Catedral')).not.toBeInTheDocument()
    expect(screen.queryByText('Bar Cordano')).not.toBeInTheDocument()
  })

  it('tapping a collapsed phase expands it; tapping it again collapses it', async () => {
    renderItinerary()
    const primera = screen.getByRole('button', { name: /Primera fase/ })
    await userEvent.click(primera)
    expect(screen.getByText('Plaza Mayor de Lima')).toBeInTheDocument()
    await userEvent.click(primera)
    expect(screen.queryByText('Plaza Mayor de Lima')).not.toBeInTheDocument()
  })

  it('is single-open: opening another phase collapses the previous', async () => {
    renderItinerary()
    await userEvent.click(screen.getByRole('button', { name: /Primera fase/ }))
    expect(screen.getByText('Plaza Mayor de Lima')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Segunda fase/ }))
    expect(screen.getByText('Bar Cordano')).toBeInTheDocument()
    expect(screen.queryByText('Plaza Mayor de Lima')).not.toBeInTheDocument()
  })

  it('back button pops to the previous history step (no mission↔map loop)', async () => {
    renderItinerary()
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByText('MISSION DETAIL')).toBeInTheDocument()
  })

  it('phase switches use replace, so back still reaches the true previous step', async () => {
    renderItinerary()
    await userEvent.click(screen.getByRole('button', { name: /Segunda fase/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    // Not phase 1 again — the real previous entry
    expect(screen.getByText('MISSION DETAIL')).toBeInTheDocument()
  })

  it('shows a filter chip for every category present across the itinerary', () => {
    renderItinerary()
    // Collected across all phases, not just the open one (Patrocinador is in p2).
    expect(screen.getByRole('button', { name: 'Cultural' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Patrocinador' })).toBeInTheDocument()
  })

  it('toggling a category filter hides its waypoints from the phase list', async () => {
    renderItinerary()
    await userEvent.click(screen.getByRole('button', { name: /Primera fase/ }))
    expect(screen.getByText('Plaza Mayor de Lima')).toBeInTheDocument()

    // Turn Cultural off — the open phase is all Cultural, so it empties out.
    const chip = screen.getByRole('button', { name: 'Cultural' })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(chip)

    expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByText('Plaza Mayor de Lima')).not.toBeInTheDocument()
    expect(screen.getByText(/Ningún punto coincide con el filtro/)).toBeInTheDocument()
  })

  it('re-selecting a category filter brings its waypoints back', async () => {
    renderItinerary()
    await userEvent.click(screen.getByRole('button', { name: /Primera fase/ }))
    const chip = screen.getByRole('button', { name: 'Cultural' })
    await userEvent.click(chip)
    await userEvent.click(chip)
    expect(screen.getByText('Plaza Mayor de Lima')).toBeInTheDocument()
  })
})
