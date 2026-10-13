import { describe, expect, it } from 'vitest'
import { getFitScale } from './useFitScale'

describe('fit scaling', () => {
  it('scales uniformly to the tighter available dimension and respects the canvas size', () => {
    expect(getFitScale(700, 600, 'browse')).toBeCloseTo(628 / 880)
    expect(getFitScale(2000, 1200, 'present')).toBe(1)
    expect(getFitScale(300, 480, 'browse')).toBe(0.28)
  })
})
