import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryProgressBar } from '../../src/components/CategoryProgressBar'

describe('CategoryProgressBar', () => {
  it('shows earned and threshold percentages', () => {
    render(<CategoryProgressBar label="Culturales" earnedPct={45} thresholdPct={60} />)
    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText(/\/ 60%/)).toBeInTheDocument()
  })

  it('flips to the met (green/correct) state when earned ≥ threshold', () => {
    render(<CategoryProgressBar label="Culturales" earnedPct={80} thresholdPct={60} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveClass('bg-correct')
    expect(bar).toHaveAttribute('aria-valuenow', '80')
  })

  it('uses the gold (not-met) fill below threshold', () => {
    render(<CategoryProgressBar label="Culturales" earnedPct={30} thresholdPct={60} />)
    expect(screen.getByRole('progressbar')).toHaveClass('bg-gold')
  })

  it('renders threshold-only (no bar) when earned is undefined', () => {
    render(<CategoryProgressBar label="Culturales" thresholdPct={60} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText(/\/ 60%/)).toBeInTheDocument()
  })
})
