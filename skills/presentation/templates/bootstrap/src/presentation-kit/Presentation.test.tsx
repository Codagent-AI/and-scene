import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'

interface Payload {
  label: string
}

function makeSteps(): Step<Payload>[] {
  function Scene({ payload }: SceneProps<Payload>) {
    return <div data-testid="scene-payload">{payload.label}</div>
  }
  return [
    { id: 'a', era: 'Intro', title: 'First title', caption: 'First caption', payload: { label: 'one' }, Scene },
    { id: 'b', era: 'Intro', title: 'Second title', caption: 'Second caption', payload: { label: 'two' }, Scene },
    { id: 'c', era: 'Deep dive', title: 'Third title', caption: 'Third caption', payload: { label: 'three' }, Scene },
  ]
}

describe('Presentation', () => {
  it('accepts a strongly typed step array without casts and renders step 0 first', () => {
    const steps = makeSteps()
    render(<Presentation steps={steps} title="My talk" />)
    expect(screen.getByTestId('scene-payload')).toHaveTextContent('one')
  })

  it('renders an empty root instead of crashing when given no steps', () => {
    const { container } = render(<Presentation steps={[]} title="Empty talk" />)
    const root = container.querySelector('[data-presentation-root]')
    expect(root).toHaveAttribute('data-step-count', '0')
    expect(screen.queryByTestId('scene-payload')).toBeNull()
  })

  it('clamps to the last step when a non-empty steps prop shrinks below the active index', () => {
    const steps = makeSteps()
    const { container, rerender } = render(<Presentation steps={steps} title="My talk" />)

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(container.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '2')

    rerender(<Presentation steps={steps.slice(0, 2)} title="My talk" />)

    const root = container.querySelector('[data-presentation-root]')
    expect(root).toHaveAttribute('data-step-count', '2')
    expect(root).toHaveAttribute('data-step-index', '1')
    // Chrome reads straight off the active step, so this proves which step is live.
    expect(screen.getByText('Second caption')).toBeInTheDocument()
    expect(screen.queryByText('Third caption')).not.toBeInTheDocument()
  })

  it('keeps navigation responsive after the deck shrinks, without a swallowed first click', () => {
    const steps = makeSteps()
    const { container, rerender } = render(<Presentation steps={steps} title="My talk" />)

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    rerender(<Presentation steps={steps.slice(0, 2)} title="My talk" />)

    // Stored index is stale at 2 while step 1 renders; one Prev must reach step 0.
    fireEvent.click(screen.getByRole('button', { name: /prev/i }))

    expect(container.querySelector('[data-presentation-root]')).toHaveAttribute('data-step-index', '0')
    expect(screen.getByText('First caption')).toBeInTheDocument()
  })

  it('does not resurrect a stale index when the deck shrinks and then grows again', () => {
    const steps = makeSteps()
    const { container, rerender } = render(<Presentation steps={steps} title="My talk" />)
    const root = () => container.querySelector('[data-presentation-root]')

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    rerender(<Presentation steps={steps.slice(0, 2)} title="My talk" />)
    expect(root()).toHaveAttribute('data-step-index', '1')

    rerender(<Presentation steps={steps} title="My talk" />)

    // The viewer was moved to step 1 by the shrink; regrowing must not jump them.
    expect(root()).toHaveAttribute('data-step-index', '1')
    expect(screen.getByText('Second caption')).toBeInTheDocument()
  })

  it('exposes data-step-count and data-step-index so steps can be enumerated externally', () => {
    const steps = makeSteps()
    const { container } = render(<Presentation steps={steps} title="My talk" />)
    const root = container.querySelector('[data-step-count]')
    expect(root).toHaveAttribute('data-step-count', '3')
    expect(root).toHaveAttribute('data-step-index', '0')
  })

  it('defaults to browse mode and advances/retreats via prev/next controls, clamping at the ends', () => {
    const steps = makeSteps()
    const { container } = render(<Presentation steps={steps} title="My talk" />)

    fireEvent.click(screen.getByRole('button', { name: /prev/i }))
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '0')

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '2')

    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '2')
  })

  it('honors an explicit initialMode of present, hiding caption/toc/prev-next', () => {
    const steps = makeSteps()
    render(<Presentation steps={steps} title="My talk" initialMode="present" />)
    expect(screen.getByText('First title')).toBeInTheDocument()
    expect(screen.queryByText('First caption')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
  })

  it('P toggles between present and browse mode while staying on the current step', () => {
    const steps = makeSteps()
    const { container } = render(<Presentation steps={steps} title="My talk" />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')

    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')

    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')
  })

  it('ArrowRight/ArrowLeft keyboard navigation advances and retreats', () => {
    const steps = makeSteps()
    const { container } = render(<Presentation steps={steps} title="My talk" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '0')
  })

  it('jumping via a progress dot moves directly to that step', () => {
    const steps = makeSteps()
    const { container } = render(<Presentation steps={steps} title="My talk" />)
    const dots = screen.getAllByTestId('progress-dot')
    fireEvent.click(dots[2])
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '2')
  })

  it('jumping via a table-of-contents entry moves to the first step of that era', () => {
    const steps = makeSteps()
    const { container } = render(<Presentation steps={steps} title="My talk" />)
    const tocEntries = screen.getAllByTestId('toc-entry')
    const deepDive = tocEntries.find((entry) => entry.textContent === 'Deep dive')!
    fireEvent.click(deepDive)
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '2')
  })

  it('renders default bottom-right attribution and no default top-left and-scene brand', () => {
    const steps = makeSteps()
    render(<Presentation steps={steps} title="My talk" />)
    expect(screen.getByRole('link', { name: /made by and-scene/i })).toBeInTheDocument()
    const header = screen.getByRole('banner')
    expect(within(header).queryByText(/and-scene/i)).not.toBeInTheDocument()
  })

  it('does not advance the deck when navigation keys are pressed while a control is focused', () => {
    const steps = makeSteps()
    const { container } = render(<Presentation steps={steps} title="My talk" />)
    const nextButton = screen.getByRole('button', { name: /next/i })
    nextButton.focus()
    fireEvent.keyDown(nextButton, { key: 'ArrowLeft' })
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '0')
  })

  it('centers the scaled design canvas within its viewport so it cannot bleed off-screen at width-bound scale factors', () => {
    const steps = makeSteps()
    const { container } = render(<Presentation steps={steps} title="My talk" />)
    const canvasViewport = container.querySelector('[data-presentation-canvas-viewport]')
    expect(canvasViewport).toHaveStyle({ display: 'flex', alignItems: 'center', justifyContent: 'center' })
  })
})
