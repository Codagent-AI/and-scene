import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../constants'
import { fitScale } from '../useFitScale'

describe('fitScale', () => {
  it('uses the smaller of the width and height ratios', () => {
    const { padX, padY } = STAGE_LAYOUT.browse
    const wide = fitScale({ width: 1440, height: 400 }, 'browse')
    expect(wide).toBeCloseTo((400 - 2 * padY) / DESIGN_H)
    const tall = fitScale({ width: 900, height: 900 }, 'browse')
    expect(tall).toBeCloseTo((900 - 2 * padX) / DESIGN_W)
  })

  it('applies each mode geometry separately', () => {
    const size = { width: 1000, height: 500 }
    expect(fitScale(size, 'present')).toBeGreaterThan(fitScale(size, 'browse'))
  })

  it('never returns less than MIN_SCALE', () => {
    expect(fitScale({ width: 0, height: 0 }, 'browse')).toBe(MIN_SCALE)
  })

  it('depends only on the container size and mode, not on content', () => {
    expect(fitScale({ width: 800, height: 420 }, 'browse')).toBe(fitScale({ width: 800, height: 420 }, 'browse'))
  })

  it('is constant for one size and mode across a canvas of the same design size', () => {
    const a = fitScale({ width: 1440, height: 900 }, 'browse', DESIGN_W, DESIGN_H)
    const b = fitScale({ width: 1440, height: 900 }, 'browse')
    expect(a).toBe(b)
  })
})
