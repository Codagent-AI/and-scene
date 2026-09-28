import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Presentation } from '../Presentation'
import type { AnyStep } from '../types'

function Scene() {
  return <div>scene</div>
}

const steps: AnyStep[] = [
  { id: 'a', era: 'era-1', title: 'A', caption: 'Caption A', payload: null, Scene },
  { id: 'b', era: 'era-1', title: 'B', caption: 'Caption B', payload: null, Scene },
]

function stepIndex(): number {
  return Number(document.querySelector('[data-presentation-root]')!.getAttribute('data-step-index'))
}

describe('present and browse modes', () => {
  it('browse mode shows caption, progress, and prev/next controls', () => {
    render(<Presentation steps={steps} title="Modes" initialMode="browse" />)

    expect(screen.getByText('Caption A')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous step')).toBeInTheDocument()
    expect(screen.getByLabelText('Next step')).toBeInTheDocument()
    expect(screen.getAllByLabelText(/Go to step/).length).toBe(steps.length)
  })

  it('present mode hides caption, progress, ToC, and prev/next controls', () => {
    render(<Presentation steps={steps} title="Modes" initialMode="present" />)

    expect(screen.queryByText('Caption A')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Previous step')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Next step')).not.toBeInTheDocument()
    expect(document.querySelector('[data-presentation-toc]')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'A' })).toBeInTheDocument()
  })

  it('toggling mode with the keyboard preserves the current step', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={steps} title="Modes" initialMode="browse" />)

    await user.keyboard('{ArrowRight}')
    expect(stepIndex()).toBe(1)

    await user.keyboard('p')
    expect(document.querySelector('[data-presentation-root]')).toHaveAttribute(
      'data-presentation-mode',
      'present',
    )
    expect(stepIndex()).toBe(1)

    await user.keyboard('p')
    expect(document.querySelector('[data-presentation-root]')).toHaveAttribute(
      'data-presentation-mode',
      'browse',
    )
    expect(stepIndex()).toBe(1)
  })
})
