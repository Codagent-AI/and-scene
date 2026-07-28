import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Footer } from './Footer'

describe('Footer', () => {
  it('present mode shows the one-line title and hides caption, dots, and prev/next', () => {
    render(
      <Footer
        mode="present"
        title="The spark"
        caption="A long browse caption explaining the step."
        stepIndex={0}
        stepCount={3}
        onPrev={() => {}}
        onNext={() => {}}
        onJump={() => {}}
      />,
    )
    expect(screen.getByText('The spark')).toBeInTheDocument()
    expect(screen.queryByText(/browse caption/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /prev/i })).not.toBeInTheDocument()
  })

  it('browse mode shows caption, progress dots, and prev/next controls', () => {
    render(
      <Footer
        mode="browse"
        title="The spark"
        caption="A long browse caption explaining the step."
        stepIndex={1}
        stepCount={3}
        onPrev={() => {}}
        onNext={() => {}}
        onJump={() => {}}
      />,
    )
    expect(screen.getByText(/browse caption/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument()
    expect(screen.getAllByTestId(/progress-dot-/)).toHaveLength(3)
  })

  it('marks the active progress dot with semantic current state and a stable active hook', () => {
    render(
      <Footer
        mode="browse"
        title="t"
        caption="c"
        stepIndex={1}
        stepCount={3}
        onPrev={() => {}}
        onNext={() => {}}
        onJump={() => {}}
      />,
    )
    const activeDot = screen.getByTestId('progress-dot-1')
    expect(activeDot).toHaveAttribute('data-presentation-active', 'true')
    expect(activeDot).toHaveAttribute('aria-current', 'step')
    expect(screen.getByTestId('progress-dot-0')).toHaveAttribute('data-presentation-active', 'false')
  })

  it('clicking a progress dot jumps to that step', async () => {
    const onJump = vi.fn()
    render(
      <Footer
        mode="browse"
        title="t"
        caption="c"
        stepIndex={0}
        stepCount={3}
        onPrev={() => {}}
        onNext={() => {}}
        onJump={onJump}
      />,
    )
    await userEvent.click(screen.getByTestId('progress-dot-2'))
    expect(onJump).toHaveBeenCalledWith(2)
  })

  it('disables prev at the first step and next at the last step', () => {
    const { rerender } = render(
      <Footer
        mode="browse"
        title="t"
        caption="c"
        stepIndex={0}
        stepCount={3}
        onPrev={() => {}}
        onNext={() => {}}
        onJump={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()

    rerender(
      <Footer
        mode="browse"
        title="t"
        caption="c"
        stepIndex={2}
        stepCount={3}
        onPrev={() => {}}
        onNext={() => {}}
        onJump={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /prev/i })).not.toBeDisabled()
  })
})
