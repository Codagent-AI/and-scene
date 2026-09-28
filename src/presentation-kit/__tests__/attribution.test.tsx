import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Presentation } from '../Presentation'
import { ATTRIBUTION_HREF } from '../chrome/Footer'
import type { AnyStep } from '../types'

function Scene() {
  return <div>scene</div>
}

const steps: AnyStep[] = [
  { id: 'one', era: 'era-1', title: 'One', caption: 'First step.', payload: null, Scene },
]

describe('kit attribution', () => {
  it('shows a default bottom-right "made by and-scene" link to the and-scene GitHub repository', () => {
    render(<Presentation steps={steps} title="Attribution" />)

    const link = screen.getByRole('link', { name: 'made by and-scene' })
    expect(link).toHaveAttribute('data-presentation-attribution', 'true')
    expect(link).toHaveAttribute('href', ATTRIBUTION_HREF)
  })

  it('does not render a default top-left and-scene brand link', () => {
    render(<Presentation steps={steps} title="Attribution" />)

    expect(screen.queryByTestId('and-scene-brand')).not.toBeInTheDocument()
    expect(document.querySelector('[data-presentation-brand]')).not.toBeInTheDocument()
  })
})
