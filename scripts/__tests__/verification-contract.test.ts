import { describe, expect, it } from 'vitest'
import { referenceOutline, validateReferenceOutline } from '../verification-contract.mjs'

const steps = referenceOutline.map(([era, title, caption]) => ({ era, title, caption }))

describe('reference outline contract', () => {
  it('accepts the canonical nine-step order', () => {
    expect(validateReferenceOutline(steps)).toEqual([])
  })

  it('reports missing and out-of-order reference content', () => {
    expect(validateReferenceOutline(steps.slice(0, 8))).toContain('expected 9 steps, found 8')
    expect(validateReferenceOutline([steps[1], steps[0], ...steps.slice(2)])).toContain('step 1 title must be "You have a topic"')
  })
})
