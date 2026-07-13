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
    category_id: 'cat',
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

  it('renders all phases as an accordion with the active phase expanded', () => {
    renderItinerary()
    // Both phase headers present (dynamic N, not hardcoded)
    expect(screen.getByRole('button', { name: /Primera fase/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Segunda fase/ })).toBeInTheDocument()
    // Phase 1 (route) is expanded; phase 2 collapsed
    expect(screen.getByText('Plaza Mayor de Lima')).toBeInTheDocument()
    expect(screen.getByText('Catedral')).toBeInTheDocument()
    expect(screen.queryByText('Bar Cordano')).not.toBeInTheDocument()
  })

  it('is single-open: tapping another phase reveals it and collapses the previous', async () => {
    renderItinerary()
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
})
