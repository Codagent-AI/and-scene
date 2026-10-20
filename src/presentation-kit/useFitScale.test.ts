import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT } from './constants.ts'
import { fitScale, isWide, stageRegion } from './useFitScale.ts'

const design = { width: DESIGN_W, height: DESIGN_H }

describe('design canvas', () => {
  it('defaults to 880 × 380 with per-mode fit geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    expect(STAGE_LAYOUT.browse).not.toEqual(STAGE_LAYOUT.present)
  })
})

describe('fitScale', () => {
  it('uses the width limit when the viewport is narrow', () => {
    const region = stageRegion('present', false)
    const width = 600
    const expected = (width - region.left - region.right) / DESIGN_W
    expect(fitScale({ width, height: 2000 }, 'present', design, false)).toBeCloseTo(expected)
  })

  it('uses the height limit when the viewport is short', () => {
    const region = stageRegion('browse', false)
    const height = 500
    const expected = (height - region.top - region.bottom) / DESIGN_H
    expect(fitScale({ width: 3000, height }, 'browse', design, false)).toBeCloseTo(expected)
  })

  it('reserves room for the table of contents', () => {
    const wide = { width: 1100, height: 2000 }
    expect(fitScale(wide, 'browse', design, true)).toBeLessThan(fitScale(wide, 'browse', design, false))
  })

  it('never drops below the minimum scale', () => {
    expect(fitScale({ width: 50, height: 50 }, 'browse', design, false)).toBe(MIN_SCALE)
  })

  it('scales an overridden design canvas', () => {
    const big = fitScale({ width: 1600, height: 1000 }, 'present', { width: 1600, height: 760 }, false)
    const dflt = fitScale({ width: 1600, height: 1000 }, 'present', design, false)
    expect(big).toBeLessThan(dflt)
  })

  it('treats 1024px and above as wide', () => {
    expect(isWide({ width: WIDE_VIEWPORT - 1, height: 800 })).toBe(false)
    expect(isWide({ width: WIDE_VIEWPORT, height: 800 })).toBe(true)
  })
})
