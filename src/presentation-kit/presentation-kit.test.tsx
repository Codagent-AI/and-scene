// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W } from './constants.ts'
import { calculateFitScale } from './useFitScale.ts'
import { Presentation } from './Presentation.tsx'
import { Box } from './nodes/Box.tsx'
import type { SceneProps, Step } from './types.ts'

type DemoPayload = {
  entities: Array<{ id: string; label: string; x: number }>
}

function DemoScene({ payload }: SceneProps<DemoPayload>) {
  return (
    <div data-testid="scene" data-scene-version={payload.entities[0]?.label}>
      {payload.entities.map((entity) => (
        <div key={entity.id} data-entity-id={entity.id} style={{ left: entity.x }}>
          {entity.label}
        </div>
      ))}
    </div>
  )
}

function makeSteps(): Step<DemoPayload>[] {
  return [
    {
      id: 'first',
      era: 'Beginning',
      title: 'First state',
      caption: 'The first state introduces the scene.',
      groupKey: 'demo',
      Scene: DemoScene,
      payload: { entities: [{ id: 'shared', label: 'one', x: 10 }] },
    },
    {
      id: 'second',
      era: 'Beginning',
      title: 'Second state',
      caption: 'The second state moves the shared entity.',
      groupKey: 'demo',
      Scene: DemoScene,
      payload: { entities: [{ id: 'shared', label: 'two', x: 42 }, { id: 'new', label: 'new', x: 100 }] },
    },
    {
      id: 'third',
      era: 'Reveal',
      title: 'Third state',
      caption: 'The final state is presented.',
      Scene: DemoScene,
      payload: { entities: [{ id: 'new', label: 'new', x: 110 }] },
    },
  ]
}

describe('presentation kit contract', () => {
  afterEach(() => cleanup())

  it('uses the reference fixed canvas dimensions', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('fits the canvas uniformly while reserving mode chrome geometry', () => {
    const scale = calculateFitScale({ availableWidth: 880, availableHeight: 600, mode: 'browse' })
    expect(scale).toBeCloseTo(314 / DESIGN_H)
    expect(calculateFitScale({ availableWidth: 220, availableHeight: 220, mode: 'present' })).toBeGreaterThanOrEqual(0.35)
  })

  it('accepts a strongly typed grouped scene at the Presentation boundary', () => {
    const steps: Step<DemoPayload>[] = makeSteps()
    render(<Presentation steps={steps} title="Typed demo" initialMode="browse" />)

    expect(screen.getByTestId('scene')).toHaveAttribute('data-scene-version', 'one')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('scene')).toHaveAttribute('data-scene-version', 'two')
  })

  it('preserves grouped scene instances while updating their payload', () => {
    function PersistentScene({ payload }: SceneProps<DemoPayload>) {
      return <div data-testid="persistent-scene">{payload.entities[0]?.label}</div>
    }

    const steps = makeSteps().map((step) => ({ ...step, Scene: PersistentScene }))
    render(<Presentation steps={steps} title="Persistence" />)
    const sceneBefore = screen.getByTestId('persistent-scene')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('persistent-scene')).toBe(sceneBefore)
    expect(screen.getByTestId('persistent-scene')).toHaveTextContent('two')
  })

  it('exposes active progress semantics and clamps keyboard navigation', () => {
    render(<Presentation steps={makeSteps()} title="Navigation" />)
    const progress = screen.getAllByRole('button', { name: /step/i })
    expect(progress[0]).toHaveAttribute('aria-current', 'step')
    expect(progress[0]).toHaveClass('is-active')

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '2')
  })

  it('switches chrome between browse and present without changing the step', () => {
    render(<Presentation steps={makeSteps()} title="Modes" initialMode="browse" />)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'p' })

    expect(screen.getByTestId('presentation')).toHaveAttribute('data-mode', 'present')
    expect(screen.getByText('Second state')).toBeVisible()
    expect(screen.queryByText('The second state moves the shared entity.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')
  })

  it('renders unstyled primitives with stable hooks and default attribution', () => {
    render(<Presentation steps={[makeSteps()[0]]} title="Hooks" />)
    render(<Box id="box-1" label="A box" className="custom-box" />)

    const box = screen.getByText('A box')
    expect(box).toHaveAttribute('data-scene-node', 'box')
    expect(box).toHaveClass('custom-box')
    expect(box).not.toHaveAttribute('style')
    expect(screen.getByRole('link', { name: 'made by and-scene' })).toHaveAttribute(
      'href',
      'https://github.com/openai/and-scene',
    )
    expect(screen.queryByRole('link', { name: /^and-scene$/i })).not.toBeInTheDocument()
  })

  it('jumps with progress controls and preserves focused control keys', () => {
    render(<Presentation steps={makeSteps()} title="Controls" />)
    const next = screen.getByRole('button', { name: /next/i })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')

    fireEvent.click(screen.getByRole('button', { name: /step 3/i }))
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '2')
  })

  it('advances and reverses on horizontal touch swipes', () => {
    render(<Presentation steps={makeSteps()} title="Touch" />)
    const presentation = screen.getByTestId('presentation')

    fireEvent.touchStart(presentation, { changedTouches: [{ clientX: 200 }] })
    fireEvent.touchEnd(presentation, { changedTouches: [{ clientX: 100 }] })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '1')

    fireEvent.touchStart(presentation, { changedTouches: [{ clientX: 100 }] })
    fireEvent.touchEnd(presentation, { changedTouches: [{ clientX: 200 }] })
    expect(screen.getByTestId('presentation-chrome')).toHaveAttribute('data-step-index', '0')
  })
})
