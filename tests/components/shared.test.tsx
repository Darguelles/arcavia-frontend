import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AnswerOption } from '../../src/components/AnswerOption'
import { WaypointListItem } from '../../src/components/WaypointListItem'
import { KeywordHistoryList } from '../../src/components/KeywordHistoryList'
import { LeaderboardList } from '../../src/components/LeaderboardList'
import { FormField } from '../../src/components/FormField'
import { TermsFooterLink } from '../../src/components/TermsFooterLink'
import { Wordmark } from '../../src/components/Wordmark'
import { LoadingState, ErrorState, EmptyState } from '../../src/components/states'
import type { AnswerHistoryEntry, LeaderboardEntry, WaypointInMission } from '../../src/types/api'

describe('AnswerOption', () => {
  it('shows the letter + text and reflects selection', async () => {
    const onSelect = vi.fn()
    render(<AnswerOption letter="B" text="Pileta" selected onSelect={onSelect} />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveTextContent('B')
    expect(btn).toHaveTextContent('Pileta')
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(btn)
    expect(onSelect).toHaveBeenCalled()
  })
})

describe('WaypointListItem', () => {
  const wp: WaypointInMission = {
    id: 'w1',
    name: 'Plaza Mayor',
    description: '',
    category_id: 'cat1',
    category_name: 'Culturales',
    points: 300,
    lat: -12,
    lng: -77,
    tolerance_radius_m: 50,
    order_index: 0,
  }
  it('renders name, category, points and default "por visitar" status', () => {
    render(<WaypointListItem waypoint={wp} />)
    expect(screen.getByText('Plaza Mayor')).toBeInTheDocument()
    expect(screen.getByText(/Culturales · 300 pts/)).toBeInTheDocument()
    expect(screen.getByText('Por visitar')).toBeInTheDocument()
  })
  it('shows completed status when passed', () => {
    render(<WaypointListItem waypoint={wp} status="completed" />)
    expect(screen.getByText('Completado')).toBeInTheDocument()
  })
})

describe('KeywordHistoryList', () => {
  const entry: AnswerHistoryEntry = {
    challenge_id: 'c1',
    mission_name: 'Plaza Mayor',
    waypoint_name: 'Catedral',
    order_index: 0,
    keyword: 'Pileta',
    is_riddle: false,
    correct: true,
    answered_at: new Date().toISOString(),
  }
  it('shows a collected keyword', () => {
    render(<KeywordHistoryList entries={[entry]} />)
    expect(screen.getByText('Pileta')).toBeInTheDocument()
    expect(screen.getByText(/Desafío N°1/)).toBeInTheDocument()
  })
  it('shows a locked placeholder for an unsolved challenge', () => {
    render(<KeywordHistoryList entries={[{ ...entry, keyword: null, correct: false }]} />)
    expect(screen.getByText(/sin resolver/)).toBeInTheDocument()
  })
  it('shows an encouraging empty state', () => {
    render(<KeywordHistoryList entries={[]} />)
    expect(screen.getByText(/coleccionar palabras clave/)).toBeInTheDocument()
  })
})

describe('LeaderboardList', () => {
  const entries: LeaderboardEntry[] = [
    { user_id: 'aaaaaa11', points: 900, rank: 1 },
    { user_id: 'bbbbbb22', points: 700, rank: 2 },
  ]
  it('highlights the current user as "Tú"', () => {
    render(<LeaderboardList entries={entries} currentUserId="bbbbbb22" />)
    expect(screen.getByText('Tú')).toBeInTheDocument()
    expect(screen.getByText('900 pts')).toBeInTheDocument()
  })
  it('shows an empty state', () => {
    render(<LeaderboardList entries={[]} />)
    expect(screen.getByText(/Sé el primero/)).toBeInTheDocument()
  })
})

describe('FormField', () => {
  it('associates label and shows an error', () => {
    render(<FormField label="Correo" name="email" error="Correo inválido" />)
    const input = screen.getByLabelText('Correo')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Correo inválido')).toBeInTheDocument()
  })
})

describe('misc shared components', () => {
  it('TermsFooterLink renders the terms link', () => {
    render(<TermsFooterLink />)
    expect(screen.getByRole('link', { name: /términos y condiciones/i })).toBeInTheDocument()
  })
  it('Wordmark renders the brand', () => {
    render(<Wordmark />)
    expect(screen.getByText('Arcavia')).toBeInTheDocument()
    expect(screen.getByText('Quest')).toBeInTheDocument()
  })
  it('state components render', async () => {
    const onRetry = vi.fn()
    const { rerender } = render(<LoadingState />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    rerender(<ErrorState message="Falló" onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(onRetry).toHaveBeenCalled()
    rerender(<EmptyState>Vacío</EmptyState>)
    expect(screen.getByText('Vacío')).toBeInTheDocument()
  })
})
