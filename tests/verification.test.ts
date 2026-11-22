import { describe, expect, it } from 'vitest'
import { REFERENCE_STEPS, validateReference } from '../scripts/reference.mjs'

describe('reference validation', () => {
  it('accepts exactly the normative metadata in order', () => expect(() => validateReference(REFERENCE_STEPS)).not.toThrow())
  it.each([[], REFERENCE_STEPS.slice(1), [...REFERENCE_STEPS].reverse(), REFERENCE_STEPS.map((row, index) => index ? row : [row[0], 'wrong', row[2]])].map(steps => [steps]))('rejects missing, incomplete, reordered or malformed reference metadata %#', (steps) => expect(() => validateReference(steps)).toThrow(/sample:/))
})
