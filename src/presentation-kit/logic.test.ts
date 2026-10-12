import { describe, expect, it } from 'vitest'
import { clampIndex, getStepNumber } from './utils'
import { computeFitScale } from './useFitScale'

describe('scene kit contracts', () => {
  it('clamps navigation at each end and derives numbers from position', () => {
    expect(clampIndex(-1, 3)).toBe(0)
    expect(clampIndex(9, 3)).toBe(2)
    expect(getStepNumber(1)).toBe(2)
  })
  it('fits the fixed canvas uniformly', () => {
    expect(computeFitScale(440, 190, 880, 380)).toBe(0.5)
    expect(computeFitScale(440, 380, 880, 380)).toBe(0.5)
  })
})
