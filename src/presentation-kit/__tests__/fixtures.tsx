import { expect } from 'vitest'
import type { Step } from '../types'

/** Asserts an element's inline style carries no palette, border, shadow, or font — only layout. */
export function expectNoVisualStyle(element: Element | null | undefined) {
  expect(element?.getAttribute('style') ?? '').not.toMatch(/color|background|border|box-shadow|font/i)
}

export function makeStep(step: Step): Step {
  return step
}

export function buildFixtureSteps(count = 3): Step[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `step-${index}`
    return makeStep({
      id,
      era: index === 0 ? 'Intro' : 'Body',
      title: `Title ${index}`,
      caption: `Caption ${index}`,
      payload: undefined,
      Scene: () => <div data-testid={`scene-${id}`}>{id}</div>,
    })
  })
}
