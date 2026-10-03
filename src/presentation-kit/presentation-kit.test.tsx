import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
import { fitScale } from './useFitScale'
import { resolvePresentation } from '../presentations/resolvePresentation'

type Payload = { count: number }

function CounterScene({ payload }: SceneProps<Payload>) {
  return <output aria-label="count">{payload.count}</output>
}

const steps: Step<Payload>[] = [
  { id: 'one', era: 'start', title: 'One', caption: 'First beat', groupKey: 'counter', Scene: CounterScene, payload: { count: 1 } },
  { id: 'two', era: 'start', title: 'Two', caption: 'Second beat', groupKey: 'counter', Scene: CounterScene, payload: { count: 2 } },
]

describe('Presentation scene contract', () => {
  it('updates a grouped scene in place and exposes step indices', () => {
    let mounts = 0
    function PersistentScene({ payload }: SceneProps<Payload>) {
      useState(() => { mounts += 1 })
      return <output aria-label="count">{payload.count}</output>
    }
    const groupedSteps: Step<Payload>[] = steps.map((step) => ({ ...step, Scene: PersistentScene }))
    const { container } = render(<Presentation steps={groupedSteps} title="Counter" />)

    expect(screen.getByLabelText('count')).toHaveTextContent('1')
    expect(container.querySelector('[data-step-count]')).toHaveAttribute('data-step-count', '2')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByLabelText('count')).toHaveTextContent('2')
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')
    expect(mounts).toBe(1)
  })

  it('clamps navigation, toggles modes without losing position, and preserves focused control keys', () => {
    const { container } = render(<Presentation steps={steps} title="Counter" />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '0')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'p' })
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')
    expect(container.querySelector('[data-presentation-mode]')).toHaveAttribute('data-presentation-mode', 'present')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')
    fireEvent.keyDown(window, { key: 'p' })
    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowLeft' })
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')
  })

  it('provides accessible active navigation and default attribution without visual styles', () => {
    const { container } = render(<Presentation steps={steps} title="Counter" />)
    expect(screen.getByRole('link', { name: 'made by and-scene' })).toHaveAttribute('href', 'https://github.com/Codagent-AI/and-scene')
    expect(container.querySelector('[data-presentation-attribution]')).toBeTruthy()
    expect(container.querySelector('[data-presentation-brand]')).toBeNull()
    expect(screen.getByRole('button', { name: /step 1/i })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: /step 1/i })).toHaveAttribute('data-presentation-active', 'true')
    expect(container.querySelector('[style*="color"]')).toBeNull()
  })

  it('supports direct step and section jumps with semantic active state', () => {
    const manySteps: Step<Payload>[] = [
      ...steps,
      { ...steps[0], id: 'three', era: 'end', title: 'Three' },
    ]
    render(<Presentation steps={manySteps} title="Counter" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 3: Three' }))
    expect(screen.getByRole('button', { name: 'Step 3: Three' })).toHaveAttribute('aria-current', 'step')
    fireEvent.click(screen.getByRole('button', { name: 'start' }))
    expect(screen.getByRole('button', { name: 'Step 1: One' })).toHaveAttribute('aria-current', 'step')
  })

  it('fits the fixed design canvas uniformly without enlarging it', () => {
    expect(fitScale(1200, 900, 'present')).toBe(1)
    expect(fitScale(600, 600, 'present')).toBeCloseTo(536 / 880)
    expect(fitScale(400, 500, 'present')).toBeLessThan(1)
    expect(fitScale(700, 450, 'browse')).toBeCloseTo(206 / 380)
  })

  it('keeps the last available step visible when the step list shrinks', () => {
    const fiveSteps: Step<Payload>[] = Array.from({ length: 5 }, (_, index) => ({
      ...steps[0], id: `step-${index + 1}`, title: `Step ${index + 1}`, payload: { count: index + 1 },
    }))
    const { container, rerender } = render(<Presentation steps={fiveSteps} title="Counter" />)
    fireEvent.click(screen.getByRole('button', { name: 'Step 5: Step 5' }))
    rerender(<Presentation steps={fiveSteps.slice(0, 2)} title="Counter" />)
    expect(container.querySelector('[data-step-index]')).toHaveAttribute('data-step-index', '1')
    expect(screen.getByLabelText('count')).toHaveTextContent('2')
  })

  it('does not treat a horizontal drag on an interactive control as a step swipe', () => {
    function SliderScene({ payload }: SceneProps<Payload>) {
      return <><input type="range" aria-label="slider" /><output aria-label="count">{payload.count}</output></>
    }
    const sliderSteps: Step<Payload>[] = steps.map((step) => ({ ...step, Scene: SliderScene }))
    render(<Presentation steps={sliderSteps} title="Counter" />)
    const slider = screen.getByRole('slider', { name: 'slider' })
    fireEvent.touchStart(slider, { touches: [{ clientX: 200, clientY: 30 }] })
    fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 120, clientY: 32 }] })
    expect(screen.getByLabelText('count')).toHaveTextContent('1')
  })

  it('resolves only registered pathname slugs and returns the landing route otherwise', () => {
    const entries = [{ slug: 'a-talk', title: 'A Talk', load: async () => ({ default: () => <div /> }) }]
    expect(resolvePresentation('/a-talk/', entries)).toBe(entries[0])
    expect(resolvePresentation('/', entries)).toBeUndefined()
    expect(resolvePresentation('/unknown', entries)).toBeUndefined()
  })
})

afterEach(cleanup)
