import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import { computeScale } from './useFitScale'

describe('fixed canvas', () => {
  it('defaults to 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it('scales uniformly to the limiting axis using per-mode geometry', () => {
    const { inset } = STAGE_LAYOUT.browse
    expect(computeScale(440 + inset * 2, 5000, 'browse')).toBeCloseTo(0.5)
    expect(computeScale(5000, 190 + inset * 2, 'browse')).toBeCloseTo(0.5)
  })

  it('caps growth, floors shrinkage, and differs per mode', () => {
    expect(computeScale(10000, 10000, 'browse')).toBe(STAGE_LAYOUT.browse.maxScale)
    expect(computeScale(10000, 10000, 'present')).toBe(STAGE_LAYOUT.present.maxScale)
    expect(computeScale(10, 10, 'browse')).toBe(MIN_SCALE)
  })

  it('honors a custom canvas', () => {
    const { inset } = STAGE_LAYOUT.present
    expect(computeScale(400 + inset * 2, 5000, 'present', { width: 800, height: 100 })).toBeCloseTo(0.5)
  })
})
