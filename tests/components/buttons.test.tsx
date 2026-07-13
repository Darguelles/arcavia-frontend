import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { SecondaryButton } from '../../src/components/SecondaryButton'

describe('PrimaryButton', () => {
  it('renders children and fires onClick', async () => {
    const onClick = vi.fn()
    render(<PrimaryButton onClick={onClick}>Iniciar</PrimaryButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled and shows a spinner glyph while loading', () => {
    render(<PrimaryButton loading>Enviar</PrimaryButton>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent('…')
  })
})

describe('SecondaryButton', () => {
  it('respects the disabled prop', async () => {
    const onClick = vi.fn()
    render(
      <SecondaryButton disabled onClick={onClick}>
        Cancelar
      </SecondaryButton>
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
