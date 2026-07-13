import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PhaseProgressFooter } from '../../src/components/PhaseProgressFooter'

describe('PhaseProgressFooter', () => {
  it('renders however many phases the mission has (not hardcoded to two)', () => {
    const phases = [
      { id: 'p1', name: 'Primera fase' },
      { id: 'p2', name: 'Segunda fase' },
      { id: 'p3', name: 'Tercera fase' },
    ]
    render(<PhaseProgressFooter phases={phases} currentPhaseId="p1" onSelect={() => {}} />)
    expect(screen.getByText('Primera fase')).toBeInTheDocument()
    expect(screen.getByText('Segunda fase')).toBeInTheDocument()
    expect(screen.getByText('Tercera fase')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('marks the active phase and fires onSelect for others', async () => {
    const onSelect = vi.fn()
    const phases = [
      { id: 'p1', name: 'Primera fase' },
      { id: 'p2', name: 'Segunda fase' },
    ]
    render(<PhaseProgressFooter phases={phases} currentPhaseId="p1" onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: /Primera fase/ })).toHaveAttribute(
      'aria-current',
      'true'
    )
    await userEvent.click(screen.getByRole('button', { name: /Segunda fase/ }))
    expect(onSelect).toHaveBeenCalledWith('p2')
  })

  it('renders a single-phase mission without inventing a second', () => {
    render(
      <PhaseProgressFooter
        phases={[{ id: 'only', name: 'Fase única' }]}
        currentPhaseId="only"
        onSelect={() => {}}
      />
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
