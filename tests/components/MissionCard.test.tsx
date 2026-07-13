import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MissionCard } from '../../src/components/MissionCard'
import type { MissionCard as MissionCardType } from '../../src/types/api'

const mission: MissionCardType = {
  id: 'm1',
  campaign_id: 'c1',
  city_id: 'city1',
  name: 'Barranco',
  description: 'Explora Barranco',
  difficulty: 'alta',
  reward_points: 500,
  estimated_time_minutes: 90,
  explorers_count: 105,
  is_active: true,
}

describe('MissionCard', () => {
  it('renders name, difficulty, explorers and points', () => {
    render(<MissionCard mission={mission} index={2} />)
    expect(screen.getByText('Barranco')).toBeInTheDocument()
    expect(screen.getByText(/Misión N°3 \/ Dificultad alta/)).toBeInTheDocument()
    expect(screen.getByText('105')).toBeInTheDocument()
    expect(screen.getByText('500 pts')).toBeInTheDocument()
  })

  it('omits the mission number when no index is passed', () => {
    render(<MissionCard mission={mission} />)
    expect(screen.getByText('Dificultad alta')).toBeInTheDocument()
    expect(screen.queryByText(/Misión N°/)).not.toBeInTheDocument()
  })

  it('fires onClick', async () => {
    const onClick = vi.fn()
    render(<MissionCard mission={mission} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
