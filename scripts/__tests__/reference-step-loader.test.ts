import { describe, expect, it } from 'vitest'
import { loadReferenceSteps } from '../load-reference-steps.mjs'
import { validateReferenceOutline } from '../verification-contract.mjs'

describe('reference step loading', () => {
  it('loads the actual exported steps through the project module pipeline', async () => {
    const steps = await loadReferenceSteps()
    expect(validateReferenceOutline(steps)).toEqual([])
    const altered = steps.map((step, index) => index === 0 ? { ...step, era: 'unexpected era' } : step)
    expect(validateReferenceOutline(altered)).toContain('step 1 era must be "the ask"')
  }, 15000)
})
