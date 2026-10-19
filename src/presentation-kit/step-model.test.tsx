import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Presentation } from './Presentation'
import { stepNumber } from './eras'
import type { SceneProps, Step } from './types'

// Required StepMeta fields are checked by the type fixtures (tests/unit/type-fixtures); this file
// covers the runtime contract: what a Scene receives and how on-screen numbers follow position.

afterEach(() => cleanup())

function Plain({ payload, step, index }: SceneProps<string>) {
  return <p data-testid="scene">{`${payload}|${step.id}|${index}`}</p>
}

const step = (id: string, title = id.toUpperCase()): Step<string> => ({
  id,
  era: 'Only',
  title,
  caption: `${title} caption.`,
  Scene: Plain,
  payload: `payload-${id}`,
})

function deck(steps: Step<string>[]) {
  return <Presentation steps={steps} title="Deck" />
}

function sceneTexts(): string[] {
  return screen.queryAllByTestId('scene').map((el) => el.textContent ?? '')
}

function markerText(): string | null {
  return document.querySelector('[data-presentation-marker]')?.textContent ?? null
}

function progressLabels(): string[] {
  const nav = document.querySelector('[data-presentation-progress]') as HTMLElement
  return within(nav)
    .getAllByRole('button')
    .map((b) => b.getAttribute('aria-label') ?? '')
}

function activeStepId(): string | null {
  return document.querySelector('[data-presentation-root]')?.getAttribute('data-step-id') ?? null
}

describe('Scene step model', () => {
  it('hands a Scene its payload, its StepMeta fields, and the zero-based index', async () => {
    render(deck([step('a'), step('b')]))
    expect(sceneTexts()).toEqual(['payload-a|a|0'])
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    // The outgoing scene stays mounted until its exit animation completes.
    await waitFor(() => expect(sceneTexts()).toEqual(['payload-b|b|1']))
  })

  it('gives the Scene step metadata without the Scene or payload', () => {
    let received: SceneProps<string>['step'] | undefined
    function Capture({ step: meta }: SceneProps<string>) {
      received = meta
      return null
    }
    render(deck([{ ...step('solo'), Scene: Capture }]))
    expect(received).toEqual({ id: 'solo', era: 'Only', title: 'SOLO', caption: 'SOLO caption.' })
    expect(Object.keys(received ?? {}).sort()).toEqual(['caption', 'era', 'id', 'title'])
  })
})

describe('Order-derived numbering', () => {
  it('derives on-screen numbers from position (index + 1)', () => {
    expect([0, 1, 2].map(stepNumber)).toEqual([1, 2, 3])
  })

  it('numbers marker and progress items from position after reordering, keeping step ids', () => {
    const a = step('a')
    const b = step('b')
    const c = step('c')
    const { rerender } = render(deck([a, b, c]))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(markerText()).toBe('3 / 3')
    expect(activeStepId()).toBe('c')
    expect(progressLabels()).toEqual(['Step 1: A', 'Step 2: B', 'Step 3: C'])

    rerender(deck([c, a, b]))
    expect(markerText()).toBe('3 / 3')
    expect(activeStepId()).toBe('b')
    expect(progressLabels()).toEqual(['Step 1: C', 'Step 2: A', 'Step 3: B'])

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(markerText()).toBe('1 / 3')
    expect(activeStepId()).toBe('c')
  })

  it('renumbers the active step and total when a step is inserted and then removed', () => {
    const a = step('a')
    const b = step('b')
    const c = step('c')
    const x = step('x')
    const { rerender } = render(deck([a, b, c]))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(markerText()).toBe('2 / 3')
    expect(activeStepId()).toBe('b')

    rerender(deck([a, x, b, c]))
    expect(markerText()).toBe('2 / 4')
    expect(activeStepId()).toBe('x')
    expect(progressLabels()).toEqual(['Step 1: A', 'Step 2: X', 'Step 3: B', 'Step 4: C'])

    rerender(deck([a, b, c]))
    expect(markerText()).toBe('2 / 3')
    expect(activeStepId()).toBe('b')
    expect(progressLabels()).toEqual(['Step 1: A', 'Step 2: B', 'Step 3: C'])
  })
})
