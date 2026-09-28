import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Presentation } from '../Presentation'
import type { AnyStep } from '../types'

function Scene() {
  return <div>scene</div>
}

function makeSteps(count: number): AnyStep[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `step-${index}`,
    era: `era-${index}`,
    title: `Step ${index}`,
    caption: `Caption ${index}`,
    payload: null,
    Scene,
  }))
}

function stepIndex(): number {
  return Number(document.querySelector('[data-presentation-root]')!.getAttribute('data-step-index'))
}

describe('step navigation', () => {
  it('advances and retreats via keyboard, and exposes step-count/index hooks', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={makeSteps(3)} title="Nav" />)

    const root = document.querySelector('[data-presentation-root]')!
    expect(root).toHaveAttribute('data-step-count', '3')
    expect(stepIndex()).toBe(0)

    await user.keyboard('{ArrowRight}')
    expect(stepIndex()).toBe(1)

    await user.keyboard('{ArrowLeft}')
    expect(stepIndex()).toBe(0)
  })

  it('clamps at the start and end with no wrap-around', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={makeSteps(2)} title="Nav" />)

    await user.keyboard('{ArrowLeft}')
    expect(stepIndex()).toBe(0)

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(stepIndex()).toBe(1)
  })

  it('jumps directly to a step via the progress control and marks it active', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={makeSteps(3)} title="Nav" />)

    const progressButtons = screen.getAllByLabelText(/Go to step/)
    await user.click(progressButtons[2])

    expect(stepIndex()).toBe(2)
    expect(progressButtons[2]).toHaveAttribute('data-presentation-active', 'true')
    expect(progressButtons[2]).toHaveAttribute('aria-current', 'step')
    expect(progressButtons[0]).not.toHaveAttribute('data-presentation-active')
  })

  it('jumps to a section via the table of contents entry', async () => {
    const user = userEvent.setup()
    render(<Presentation steps={makeSteps(3)} title="Nav" />)

    const tocEntry = screen.getByRole('button', { name: 'era-2' })
    await user.click(tocEntry)

    expect(stepIndex()).toBe(2)
  })

  it('keeps navigation keys with a focused control instead of also advancing', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <input aria-label="notes" />
        <Presentation steps={makeSteps(3)} title="Nav" />
      </div>,
    )

    const input = screen.getByLabelText('notes')
    await user.click(input)
    await user.keyboard('{ArrowRight}')

    expect(stepIndex()).toBe(0)
  })
})
