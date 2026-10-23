import { describe, expect, it } from 'vitest'
import { DEFAULT_CANVAS, DESIGN_H, DESIGN_W, ENTER_DELAY, LAYOUT_T, MIN_SCALE, STAGE_LAYOUT } from '../../src/presentation-kit/constants'
import { computeFitScale } from '../../src/presentation-kit/useFitScale'

describe('fixed canvas fit scaling', () => {
  it('defaults to an 880 x 380 design canvas', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(DEFAULT_CANVAS).toEqual({ width: 880, height: 380 })
  })

  it('scales uniformly by the limiting axis', () => {
    const wide = computeFitScale({ width: 1760 + 32, height: 2000 }, DEFAULT_CANVAS, 16)
    expect(wide).toBeCloseTo(2)
    const tall = computeFitScale({ width: 5000, height: 760 + 32 }, DEFAULT_CANVAS, 16)
    expect(tall).toBeCloseTo(2)
  })

  it('shrinks with the viewport and never goes below the minimum', () => {
    expect(computeFitScale({ width: 440 + 32, height: 900 }, DEFAULT_CANVAS, 16)).toBeCloseTo(0.5)
    expect(computeFitScale({ width: 10, height: 10 }, DEFAULT_CANVAS, 16)).toBe(MIN_SCALE)
    expect(computeFitScale({ width: 0, height: 0 }, DEFAULT_CANVAS, 16)).toBe(MIN_SCALE)
  })

  it('has per-mode geometry and honours a canvas override', () => {
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    const small = computeFitScale({ width: 400, height: 400 }, { width: 200, height: 100 }, 0)
    expect(small).toBe(2)
  })
})

describe('motion timing', () => {
  it('starts newcomers only after persisting entities have finished moving', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })
})
