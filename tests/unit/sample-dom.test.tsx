import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'

const entities = (c: HTMLElement) =>
  new Map(
    Array.from(c.querySelectorAll<HTMLElement>('[data-presentation-entity]')).map((el) => [
      el.getAttribute('data-presentation-entity')!,
      el,
    ]),
  )
const press = (key: string) => act(() => void fireEvent.keyDown(window, { key }))

describe('I-52 sample DOM continuity', () => {
  it('keeps the same DOM nodes for continuing entities and only ever adds entities', () => {
    const { container } = render(<Talk />)
    let prev = entities(container)
    expect(prev.size).toBeGreaterThan(0)
    for (let step = 1; step < STEPS.length; step++) {
      press('ArrowRight')
      const next = entities(container)
      for (const [id, node] of prev) {
        expect(next.get(id), `${id} survives step ${step}`).toBe(node)
      }
      expect(next.size).toBeGreaterThanOrEqual(prev.size)
      prev = next
    }
    const frame = Array.from(prev.keys()).find((id) => id.endsWith('frame'))
    expect(frame).toBeDefined()
  })

  it('renders one scene instance for the whole presentation', () => {
    const { container } = render(<Talk />)
    const scene = container.querySelector('[data-presentation-scene]')
    for (let i = 1; i < STEPS.length; i++) press('ArrowRight')
    expect(container.querySelectorAll('[data-presentation-scene]').length).toBe(1)
    expect(container.querySelector('[data-presentation-scene]')).toBe(scene)
  })
})

describe('I-46 sample navigation', () => {
  it('next and previous show the matching caption and step index at every step', () => {
    const { container } = render(<Talk />)
    const state = () => [
      container.querySelector('[data-presentation-root]')!.getAttribute('data-step-index'),
      container.querySelector('[data-presentation-caption]')!.textContent,
    ]
    for (let i = 0; i < STEPS.length; i++) {
      expect(state()).toEqual([String(i), STEPS[i]!.caption])
      if (i < STEPS.length - 1) press('ArrowRight')
    }
    for (let i = STEPS.length - 1; i >= 0; i--) {
      expect(state()).toEqual([String(i), STEPS[i]!.caption])
      if (i > 0) press('ArrowLeft')
    }
  })
})
