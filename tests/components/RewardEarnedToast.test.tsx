import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RewardEarnedToast } from '../../src/components/RewardEarnedToast'

describe('RewardEarnedToast', () => {
  it('renders nothing when there are no rewards', () => {
    const { container } = render(<RewardEarnedToast rewards={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders each earned reward when present', () => {
    render(
      <RewardEarnedToast
        rewards={[
          { reward_id: 'r1', name: 'Café gratis', image_url: null },
          { reward_id: 'r2', name: 'Descuento', image_url: null },
        ]}
      />
    )
    expect(screen.getByText('Café gratis')).toBeInTheDocument()
    expect(screen.getByText('Descuento')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
