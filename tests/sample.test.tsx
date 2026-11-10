// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { presentations } from '../src/presentations'
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  disconnect() {}
})
afterEach(cleanup)
it('registers the nine ordered narrative beats with a shared scene', () => {
  expect(presentations[0].slug).toBe('how-to-make-a-presentation')
  expect(STEPS).toHaveLength(9)
  expect(new Set(STEPS.map(step => step.Scene)).size).toBe(1)
  expect(new Set(STEPS.map(step => step.groupKey)).size).toBe(1)
  expect(STEPS.map(step => step.payload.beat)).toEqual([1,2,3,4,5,6,7,8,9])
})
it('accumulates entities without replacing continuing conversation or cards', () => {
  const { container } = render(<Talk />)
  const you = container.querySelector('[data-entity="you"]')
  expect(you).not.toBeNull()
  expect(container.querySelector('[data-entity="skill"]')).toBeNull()
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(container.querySelector('[data-entity="you"]')).toBe(you)
  expect(container.querySelector('[data-entity="skill"]')).not.toBeNull()
  fireEvent.click(screen.getByLabelText('Step 3: Answers become steps'))
  const card = container.querySelector('[data-entity="card-1"]')
  expect(card).not.toBeNull()
  fireEvent.click(screen.getByLabelText("Step 9: You're looking at one"))
  expect(container.querySelector('[data-entity="card-1"]')).toBe(card)
  for (const name of ['you', 'skill', 'card-1', 'card-2', 'card-3', 'ghost', 'kit', 'verify', 'modify', 'reveal']) {
    expect(container.querySelector(`[data-entity="${name}"]`)).not.toBeNull()
  }
})
