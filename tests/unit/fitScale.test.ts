import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, computeFitScale } from '../../src/presentation-kit'

const canvas = { width: DESIGN_W, height: DESIGN_H }

describe('design canvas', () => {
  it('defaults to 880 × 380 with browse and present geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })
})

describe('computeFitScale', () => {
  it('scales uniformly by the limiting axis', () => {
    expect(computeFitScale({ width: 1760, height: 2000 }, canvas, 0, MIN_SCALE, 3)).toBeCloseTo(2)
    expect(computeFitScale({ width: 4000, height: 190 }, canvas, 0, MIN_SCALE, 3)).toBeCloseTo(0.5)
  })
  it('subtracts the inset from both sides', () => {
    expect(computeFitScale({ width: 920, height: 1000 }, canvas, 20, MIN_SCALE, 3)).toBeCloseTo(1)
  })
  it('recomputes for a new size and never goes below the minimum or above the maximum', () => {
    expect(computeFitScale({ width: 10, height: 10 }, canvas, 0, MIN_SCALE, 3)).toBe(MIN_SCALE)
    expect(computeFitScale({ width: 99999, height: 99999 }, canvas, 0, MIN_SCALE, 3)).toBe(3)
    expect(computeFitScale({ width: 0, height: 0 }, canvas, 8, MIN_SCALE, 3)).toBe(MIN_SCALE)
  })
})
