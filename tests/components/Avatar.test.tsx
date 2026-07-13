import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from '../../src/components/Avatar'

describe('Avatar', () => {
  it('falls back to initials when no src is given', () => {
    render(<Avatar name="Ana Ruiz" />)
    expect(screen.getByText('AR')).toBeInTheDocument()
  })

  it('shows a single initial for a one-word name', () => {
    render(<Avatar name="Luz" />)
    expect(screen.getByText('L')).toBeInTheDocument()
  })

  it('renders "?" when name is missing', () => {
    render(<Avatar />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders an image when src is provided', () => {
    render(<Avatar src="https://example.com/a.jpg" name="Ana Ruiz" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/a.jpg')
    expect(img).toHaveAttribute('loading', 'lazy')
  })
})
