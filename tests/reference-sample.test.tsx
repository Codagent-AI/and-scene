import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'

afterEach(cleanup)

function renderStep(index: number) {
  const step = steps[index]
  const { container } = render(<step.Scene payload={step.payload} step={step} index={index} total={steps.length} />)
  return container
}

describe('reference sample scene transitions', () => {
  it('introduces every entrant through the kit enter/exit wrapper', () => {
    const opening = new Set([...renderStep(0).querySelectorAll('[data-entity-id]')].map((node) => node.getAttribute('data-entity-id')))
    cleanup()
    for (let index = 1; index < steps.length; index++) {
      const container = renderStep(index)
      for (const node of container.querySelectorAll('[data-entity-id]')) {
        if (opening.has(node.getAttribute('data-entity-id'))) continue
        expect(node.closest('[data-presentation-appear]'), `step ${index + 1}: ${node.getAttribute('data-entity-id')}`).not.toBeNull()
      }
      cleanup()
    }
  })
})
