import { DESIGN_H, DESIGN_W } from './constants'
import { fitScaleForSize } from './useFitScale'

describe('fitScaleForSize', () => {
  it('uniformly fits the fixed 880 by 380 canvas', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(fitScaleForSize(440, 380)).toBe(0.5)
    expect(fitScaleForSize(1760, 190)).toBe(0.5)
  })
})
