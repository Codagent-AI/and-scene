import { describe, expect, it } from 'vitest'
import { CANONICAL_STEPS, extractStepMeta, validateCanonicalOrder } from './canonical-steps.mjs'

describe('extractStepMeta', () => {
  it('extracts era, title, and caption from a step file source', () => {
    const source = `
export const step1: Step<Payload> = {
  id: 'step-1',
  era: 'the ask',
  title: 'You have a topic',
  caption: 'It starts with you, a topic, and mild overconfidence.',
  Scene,
  payload: { step: 1 },
}
`
    expect(extractStepMeta(source)).toEqual({
      era: 'the ask',
      title: 'You have a topic',
      caption: 'It starts with you, a topic, and mild overconfidence.',
    })
  })

  it('returns null when a step file has no era/title/caption literals', () => {
    expect(extractStepMeta('export const NOT_A_STEP = 42')).toBeNull()
  })

  it('extracts a title written with double quotes to hold an apostrophe', () => {
    const source = `
export const step9: Step<Payload> = {
  id: 'youre-looking-at-one',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  Scene,
  payload: { step: 9 },
}
`
    expect(extractStepMeta(source)).toEqual({
      era: 'the reveal',
      title: "You're looking at one",
      caption: 'This presentation was built exactly this way. Thanks for watching.',
    })
  })
})

describe('validateCanonicalOrder', () => {
  it('accepts step metadata that matches the canonical outline exactly', () => {
    expect(validateCanonicalOrder(CANONICAL_STEPS)).toEqual({ ok: true })
  })

  it('rejects a sample with fewer than nine steps', () => {
    const result = validateCanonicalOrder(CANONICAL_STEPS.slice(0, 3))
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/expected 9 steps, got 3/)
  })

  it('rejects a sample whose steps are out of canonical order', () => {
    const reordered = [CANONICAL_STEPS[1], CANONICAL_STEPS[0], ...CANONICAL_STEPS.slice(2)]
    const result = validateCanonicalOrder(reordered)
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/step 1: expected title "You have a topic"/)
  })

  it('rejects a sample with a mismatched caption', () => {
    const mutated = CANONICAL_STEPS.map((step, index) =>
      index === 4 ? { ...step, caption: 'wrong caption' } : step,
    )
    const result = validateCanonicalOrder(mutated)
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/step 5: expected caption/)
  })
})
