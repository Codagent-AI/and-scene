import { expect } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { ALL_ARROWS, ALL_RECTS, idsAtStep } from './entities'
import Talk from './Talk'

export const sel = (id: string) => `[data-presentation-entity="${id}"]`

export function mount(): HTMLElement {
  return render(<Talk />).container
}

export const renderedIds = (c: HTMLElement): string[] =>
  Array.from(c.querySelectorAll('[data-presentation-entity]')).map((n) => n.getAttribute('data-presentation-entity') as string)

export const entity = (c: HTMLElement, id: string): HTMLElement | null => c.querySelector<HTMLElement>(sel(id))

export function stepIndex(c: HTMLElement): number {
  return Number(c.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-step-index'))
}

function click(c: HTMLElement, hook: 'next' | 'prev') {
  const button = c.querySelector<HTMLButtonElement>(`[data-presentation-${hook}]`)
  if (!button) throw new Error(`missing ${hook} button`)
  fireEvent.click(button)
}

export const next = (c: HTMLElement) => click(c, 'next')
export const prev = (c: HTMLElement) => click(c, 'prev')

/** Wait until exactly the entities of 1-based `step` are rendered (exits finish asynchronously). */
export async function settleAt(c: HTMLElement, step: number) {
  await waitFor(() => expect([...renderedIds(c)].sort()).toEqual(idsAtStep(step).sort()), { timeout: 15000 })
}

export interface Geometry {
  left: string
  top: string
  width: string
  height: string
  transform: string
  line: string
}

/** Rendered geometry of an entity: inline box style, transform, and line endpoints for arrows. */
export function geometry(el: HTMLElement | SVGElement): Geometry {
  const s = (el as HTMLElement).style
  const line = el.querySelector('line')
  return {
    left: s.left,
    top: s.top,
    width: s.width,
    height: s.height,
    transform: s.transform,
    line: line ? ['x1', 'y1', 'x2', 'y2'].map((a) => line.getAttribute(a)).join(',') : '',
  }
}

export const ALL_SPECS = [...ALL_RECTS, ...ALL_ARROWS]
