// @vitest-environment jsdom
import { act, fireEvent, render, screen, cleanup, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Presentation } from './Presentation'
import type { SceneProps, Step } from './types'
import { Box } from './nodes/Box'
import { Presence } from './nodes/Presence'

afterEach(cleanup)

type Payload = { label: string }
function Diagram({ payload }: SceneProps<Payload>) {
  return <div data-testid="diagram"><span data-presentation-node="label">{payload.label}</span></div>
}
const steps: Step<Payload>[] = [
  { id: 'one', era: 'Start', title: 'First', caption: 'First caption', scene: Diagram, groupKey: 'story', payload: { label: 'A' } },
  { id: 'two', era: 'Continue', title: 'Second', caption: 'Second caption', scene: Diagram, groupKey: 'story', payload: { label: 'B' } },
]

type Departure = { showSkill: boolean }
function DepartureScene({ payload }: SceneProps<Departure>) {
  return <Presence>{payload.showSkill && <Box id="skill">skill</Box>}</Presence>
}
const departureSteps: Step<Departure>[] = [
  { id: 'with', era: 'Start', title: 'With', caption: 'With skill', scene: DepartureScene, groupKey: 'story', payload: { showSkill: true } },
  { id: 'without', era: 'Start', title: 'Without', caption: 'Without skill', scene: DepartureScene, groupKey: 'story', payload: { showSkill: false } },
]

describe('Presentation', () => {
  it('animates a departing entity out of a persistent grouped scene before removing it', async () => {
    // Motion captures requestAnimationFrame at import but reads time from performance.now, so faking
    // only the clock keeps real frames running while the exit cannot finish until time is advanced.
    vi.useFakeTimers({ toFake: ['performance', 'Date'] })
    try {
      const { container } = render(<Presentation<Departure> title="Example" steps={departureSteps} />)
      const skill = () => container.querySelector('[data-entity-id="skill"]')
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      vi.advanceTimersByTime(150)
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(screen.getByRole('main').getAttribute('data-step-index')).toBe('1')
      expect(skill()).toBeTruthy()
      vi.advanceTimersByTime(1000)
      await waitFor(() => expect(skill()).toBeNull(), { timeout: 5000 })
    } finally {
      vi.useRealTimers()
    }
  }, 15000)

  it('accepts a strongly typed grouped payload and updates the persistent scene', async () => {
    const { getByTestId } = render(<Presentation<Payload> title="Example" steps={steps} />)
    const before = getByTestId('diagram')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    await waitFor(() => expect(screen.getByText('B')).toBeTruthy())
    expect(getByTestId('diagram')).toBe(before)
    expect(screen.getByRole('main').getAttribute('data-step-index')).toBe('1')
  })

  it('clamps at both ends and exposes active progress and table-of-contents semantics', () => {
    render(<Presentation title="Example" steps={steps} />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByRole('main').getAttribute('data-step-index')).toBe('0')
    expect(screen.getByRole('button', { name: 'Go to step 1' }).getAttribute('aria-current')).toBe('step')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByRole('main').getAttribute('data-step-index')).toBe('1')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByRole('main').getAttribute('data-step-index')).toBe('1')
  })

  it('toggles modes without changing position and renders default attribution hooks', () => {
    render(<Presentation title="Example" steps={steps} initialMode="present" />)
    expect(screen.queryByText('First caption')).toBeNull()
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('href')).toBe('https://github.com/and-scene/and-scene')
    fireEvent.keyDown(window, { key: 'p' })
    expect(screen.getByRole('main').getAttribute('data-mode')).toBe('browse')
    expect(screen.getByText('First caption')).toBeTruthy()
    expect(document.querySelector('[data-presentation-brand]')).toBeNull()
  })

  it('keeps navigation keys available to focused controls and exposes style-neutral hooks', () => {
    render(<Presentation title="Example" steps={steps} />)
    const next = screen.getByRole('button', { name: 'Next step' })
    next.focus()
    fireEvent.keyDown(next, { key: 'ArrowRight' })
    expect(screen.getByRole('main').getAttribute('data-step-index')).toBe('0')
    expect(screen.getByRole('link', { name: 'made by and-scene' }).getAttribute('data-presentation-attribution')).not.toBeNull()
    expect(document.querySelector('[data-presentation-title]')).not.toBeNull()
    expect(document.querySelector('[data-presentation-toc-item][data-presentation-active="true"]')).not.toBeNull()
  })

  it('shows the browse table of contents only on wide viewports', () => {
    const wide = window.innerWidth
    try {
      window.innerWidth = 390
      render(<Presentation title="Example" steps={steps} />)
      expect(screen.getByText('First caption')).toBeTruthy()
      expect(screen.queryByRole('navigation', { name: 'Table of contents' })).toBeNull()
      act(() => { window.innerWidth = wide; window.dispatchEvent(new Event('resize')) })
      expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeTruthy()
    } finally {
      window.innerWidth = wide
    }
  })

  it('keeps the TOC era active while moving within that era', () => {
    const sameEra: Step<Payload>[] = [
      steps[0],
      steps[1],
      { ...steps[1], id: 'three', title: 'Third', payload: { label: 'C' } },
    ]
    render(<Presentation title="Example" steps={sameEra} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 3' }))
    const tocItems = document.querySelectorAll('[data-presentation-toc-item]')
    expect(tocItems[1].getAttribute('aria-current')).toBe('step')
    expect(tocItems[1].getAttribute('data-presentation-active')).toBe('true')
  })

  it('keeps a valid step and chrome when the steps list shrinks', () => {
    const { rerender } = render(<Presentation title="Example" steps={steps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Go to step 2' }))
    rerender(<Presentation title="Example" steps={[steps[0]]} />)
    expect(screen.getByRole('main').getAttribute('data-step-index')).toBe('0')
    expect(screen.getByText('First caption')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next step' })).toBeTruthy()
  })
})
