import type { ReactElement } from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Presentation, type SceneProps, type Step } from '../../src/presentation-kit'
import { setViewport, restoreViewport } from './kit-viewport'

interface Diagram {
  label: string
}

const received: Array<{ label: string; stepIndex: number }> = []

function LabelScene({ payload, stepIndex }: SceneProps<Diagram>): ReactElement {
  received.push({ label: payload.label, stepIndex })
  return <div data-testid="scene-label">{payload.label}</div>
}

function stepFor(id: string, era: string): Step<Diagram> {
  return {
    id,
    era,
    title: `Title ${id.toUpperCase()}`,
    caption: `Caption for ${id}`,
    Scene: LabelScene,
    payload: { label: `diagram-${id}` },
  }
}

function deck(ids: Array<[string, string]>): Step<Diagram>[] {
  return ids.map(([id, era]) => stepFor(id, era))
}

function marker(container: HTMLElement): string {
  const el = container.querySelector('[data-presentation-marker]')
  return el?.textContent ?? ''
}

function title(container: HTMLElement): string {
  return container.querySelector('[data-presentation-title]')?.textContent ?? ''
}

function activeScene(container: HTMLElement): HTMLElement {
  const scenes = container.querySelectorAll<HTMLElement>('[data-presentation-scene]')
  return scenes[scenes.length - 1] as HTMLElement
}

beforeEach(() => {
  setViewport(1280, 800)
  received.length = 0
})

afterEach(() => {
  restoreViewport()
})

describe('I-1 step model contract', () => {
  it('shows era, presenter title, browse caption and active marker for the active step', () => {
    const steps = deck([
      ['a', 'Intro'],
      ['b', 'Intro'],
      ['c', 'Middle'],
    ])
    const { container } = render(<Presentation steps={steps} title="Deck" />)
    expect(container.querySelector('[data-presentation-era]')?.textContent).toBe('Intro')
    expect(title(container)).toBe('Title A')
    expect(marker(container)).toBe('1')
    expect(container.querySelector('[data-presentation-caption]')?.textContent).toBe('Caption for a')
  })

  it('hands the active step payload and index to its Scene', async () => {
    const steps = deck([
      ['a', 'Intro'],
      ['b', 'Intro'],
    ])
    const { container, getByRole } = render(<Presentation steps={steps} title="Deck" />)
    expect(activeScene(container).textContent).toBe('diagram-a')
    fireEvent.click(getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(container.querySelectorAll('[data-presentation-scene]')).toHaveLength(1))
    expect(activeScene(container).textContent).toBe('diagram-b')
    expect(received.at(-1)).toEqual({ label: 'diagram-b', stepIndex: 1 })
  })
})

describe('I-2 order-derived numbering', () => {
  it('derives displayed numbers from position after insert, remove, and reorder with unchanged ids', async () => {
    const base: Array<[string, string]> = [
      ['a', 'Intro'],
      ['b', 'Intro'],
      ['c', 'Middle'],
      ['d', 'Middle'],
      ['e', 'End'],
    ]
    const { container, getByRole, rerender } = render(<Presentation steps={deck(base)} title="Deck" />)
    // Move to step c (position 3, index 2) using the on-screen Next control.
    fireEvent.click(getByRole('button', { name: 'Next' }))
    fireEvent.click(getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(title(container)).toBe('Title C'))
    expect(marker(container)).toBe('3')

    // Insert a new step at the front; c's id is unchanged but it now sits at a different position.
    const inserted = [['z', 'Intro'], ...base] as Array<[string, string]>
    rerender(<Presentation steps={deck(inserted)} title="Deck" />)
    const afterInsert = deck(inserted)
    expect(marker(container)).toBe(String(afterInsert.findIndex((s) => s.title === title(container)) + 1))
    expect(title(container)).toBe('Title B')
    expect(marker(container)).toBe('3')
    expect(container.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(6)

    // Remove the first step; the displayed number follows the new position.
    const removed = inserted.slice(2) // drops 'z' and 'a'
    rerender(<Presentation steps={deck(removed)} title="Deck" />)
    expect(container.querySelectorAll('[data-presentation-progress-item]')).toHaveLength(4)
    expect(marker(container)).toBe(String(deck(removed).findIndex((s) => s.title === title(container)) + 1))

    // Reorder: reverse the deck. Numbers still equal the displayed step's position in the new order.
    const reversed = [...removed].reverse()
    rerender(<Presentation steps={deck(reversed)} title="Deck" />)
    const shownIndex = deck(reversed).findIndex((s) => s.title === title(container))
    expect(shownIndex).toBeGreaterThanOrEqual(0)
    expect(marker(container)).toBe(String(shownIndex + 1))
  })
})

