import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RewardCard, RewardTeaserCard } from '../../src/components/RewardCard'
import type { UserReward } from '../../src/types/api'

const YEAR = 365 * 24 * 3600 * 1000

function makeReward(overrides: Partial<UserReward>): UserReward {
  const now = Date.now()
  return {
    reward_id: 'r1',
    name: 'Café gratis',
    description: 'Un café en la casa',
    image_url: null,
    validity_starts_at: new Date(now - YEAR).toISOString(),
    validity_ends_at: new Date(now + YEAR).toISOString(),
    earned_at: new Date(now).toISOString(),
    currently_valid: true,
    ...overrides,
  }
}

describe('RewardCard', () => {
  it('shows a valid reward without a status badge', () => {
    render(<RewardCard reward={makeReward({ currently_valid: true })} />)
    expect(screen.getByText('Café gratis')).toBeInTheDocument()
    expect(screen.queryByText(/Expirado|Próximamente|No válido/)).not.toBeInTheDocument()
  })

  it('marks an expired reward', () => {
    const now = Date.now()
    render(
      <RewardCard
        reward={makeReward({
          currently_valid: false,
          validity_starts_at: new Date(now - 2 * YEAR).toISOString(),
          validity_ends_at: new Date(now - YEAR).toISOString(),
        })}
      />
    )
    expect(screen.getByText('Expirado')).toBeInTheDocument()
  })

  it('marks a not-yet-valid reward', () => {
    const now = Date.now()
    render(
      <RewardCard
        reward={makeReward({
          currently_valid: false,
          validity_starts_at: new Date(now + YEAR).toISOString(),
          validity_ends_at: new Date(now + 2 * YEAR).toISOString(),
        })}
      />
    )
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })
})

describe('RewardTeaserCard', () => {
  it('renders name only', () => {
    render(<RewardTeaserCard reward={{ name: 'Descuento 20%', image_url: null }} />)
    expect(screen.getByText('Descuento 20%')).toBeInTheDocument()
  })
})
