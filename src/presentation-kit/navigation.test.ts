import { describe, expect, it } from 'vitest'
import { clampStepIndex } from './navigation.js'

describe('step navigation', () => {
  it('clamps requested indices at both ends', () => {
    expect(clampStepIndex(-1, 4)).toBe(0)
    expect(clampStepIndex(8, 4)).toBe(3)
    expect(clampStepIndex(2, 4)).toBe(2)
  })
})
