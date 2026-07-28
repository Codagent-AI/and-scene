import { describe, expect, it } from 'vitest'
import { CANONICAL_STEPS, validateCanonicalSteps } from './validate-canonical-steps.mjs'

function goodSteps() {
  return CANONICAL_STEPS.map((step) => ({ ...step }))
}

describe('validateCanonicalSteps', () => {
  it('passes when steps match the canonical outline exactly, in order', () => {
    expect(validateCanonicalSteps(goodSteps())).toEqual({ ok: true })
  })

  it('fails and names the step when a title does not match', () => {
    const steps = goodSteps()
    steps[0].title = 'Wrong title'
    const result = validateCanonicalSteps(steps)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('step 1')
    expect(result.message).toContain('title')
  })

  it('fails and names the step when a caption does not match', () => {
    const steps = goodSteps()
    steps[2].caption = 'wrong caption'
    const result = validateCanonicalSteps(steps)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('step 3')
    expect(result.message).toContain('caption')
  })

  it('fails and names the step when a section does not match', () => {
    const steps = goodSteps()
    steps[5].section = 'wrong section'
    const result = validateCanonicalSteps(steps)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('step 6')
    expect(result.message).toContain('section')
  })

  it('fails when steps are out of order', () => {
    const steps = goodSteps()
    ;[steps[0], steps[1]] = [steps[1], steps[0]]
    const result = validateCanonicalSteps(steps)
    expect(result.ok).toBe(false)
  })

  it('fails when the step count does not match', () => {
    const result = validateCanonicalSteps(goodSteps().slice(0, 5))
    expect(result.ok).toBe(false)
    expect(result.message).toContain('9')
  })

  it('fails when steps are missing entirely', () => {
    expect(validateCanonicalSteps(undefined).ok).toBe(false)
    expect(validateCanonicalSteps(null).ok).toBe(false)
  })
})
