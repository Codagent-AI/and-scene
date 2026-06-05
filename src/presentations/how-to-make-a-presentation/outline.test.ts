import { describe, expect, it } from 'vitest'
import { REFERENCE_STEP_OUTLINE } from './outline'
import { STEPS } from './Talk'

describe('reference sample outline', () => {
  it('Scenario: Sample exists and matches the outline — eight normative steps', () => {
    expect(REFERENCE_STEP_OUTLINE).toHaveLength(8)
    expect(STEPS).toHaveLength(8)
  })

  it('implements steps in order with normative era, title, and caption', () => {
    for (let i = 0; i < REFERENCE_STEP_OUTLINE.length; i++) {
      const expected = REFERENCE_STEP_OUTLINE[i]
      const actual = STEPS[i]
      expect(actual.era).toBe(expected.era)
      expect(actual.title).toBe(expected.title)
      expect(actual.caption).toBe(expected.caption)
    }
  })

  it('each step has a stable id and Scene component', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(8)
    for (const step of STEPS) {
      expect(step.Scene).toBeTypeOf('function')
    }
  })
})
