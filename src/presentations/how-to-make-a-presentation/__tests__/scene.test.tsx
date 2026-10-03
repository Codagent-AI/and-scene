// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { steps } from '../steps'

afterEach(cleanup)

const entityIds = (container: HTMLElement) => new Set([...container.querySelectorAll('[data-entity-id]')].map((node) => node.getAttribute('data-entity-id')))

describe('reference scene entity continuity', () => {
  it('sequences every newly introduced entity through Appear', () => {
    let previous = new Set<string | null>()
    steps.forEach((step, index) => {
      const { container } = render(<step.Scene payload={step.payload} step={{ id: step.id, era: step.era, title: step.title, caption: step.caption, number: index + 1 }} />)
      for (const id of entityIds(container)) {
        if (index === 0 || previous.has(id)) continue
        const node = container.querySelector(`[data-entity-id="${id}"]`)
        expect(node?.closest('[data-presentation-appear]'), `${id} entering at step ${index + 1}`).toBeTruthy()
      }
      previous = entityIds(container)
      cleanup()
    })
  })
})
