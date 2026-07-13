import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultBanner } from '../../src/components/ResultBanner'
import type { AnswerResponse } from '../../src/types/api'

const base: AnswerResponse = {
  correct: true,
  waypoint_complete: false,
  mission_complete: false,
  category_progress: [],
  rewards_earned: [],
}

describe('ResultBanner', () => {
  it('renders keyword and fun_fact on a correct answer', () => {
    render(
      <ResultBanner
        result={{ ...base, correct: true, keyword: 'Pileta', fun_fact: 'Dato interesante.' }}
        pointsEarned={1300}
      />
    )
    expect(screen.getByText('¡Correcto!')).toBeInTheDocument()
    expect(screen.getByText('Pileta')).toBeInTheDocument()
    expect(screen.getByText(/Dato interesante/)).toBeInTheDocument()
    expect(screen.getByText('+ 1300 pts')).toBeInTheDocument()
  })

  it('does not render keyword/fun_fact block on an incorrect answer', () => {
    render(<ResultBanner result={{ ...base, correct: false }} />)
    expect(screen.getByText('¡Incorrecto!')).toBeInTheDocument()
    expect(screen.queryByText(/Dato curioso/)).not.toBeInTheDocument()
    expect(screen.queryByText(/palabra clave/)).not.toBeInTheDocument()
  })

  it('renders category progress bars when present', () => {
    render(
      <ResultBanner
        result={{
          ...base,
          category_progress: [{ category_id: 'c1', name: 'Culturales', earned_pct: 84 }],
        }}
      />
    )
    expect(screen.getByText('Culturales')).toBeInTheDocument()
    expect(screen.getByText('84%')).toBeInTheDocument()
  })
})
