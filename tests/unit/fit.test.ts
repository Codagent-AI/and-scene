import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../../src/presentation-kit/constants'
import { computeFitScale } from '../../src/presentation-kit/useFitScale'

describe('fixed canvas', () => {
  it('defaults to 880 x 380 with per-mode fit geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('scales uniformly by the limiting axis', () => {
    const { insetX, insetY } = STAGE_LAYOUT.browse
    const wide = computeFitScale(DESIGN_W + insetX * 2, 5000, 'browse')
    const tall = computeFitScale(5000, DESIGN_H + insetY * 2, 'browse')
    expect(wide).toBeCloseTo(1)
    expect(tall).toBeCloseTo(1)
  })

  it('scales down when the viewport shrinks and respects the floor and ceiling', () => {
    expect(computeFitScale(440 + 32, 5000, 'browse')).toBeLessThan(0.6)
    expect(computeFitScale(1, 1, 'browse')).toBe(MIN_SCALE)
    expect(computeFitScale(9999, 9999, 'browse')).toBe(STAGE_LAYOUT.browse.maxScale)
    expect(computeFitScale(9999, 9999, 'present')).toBe(STAGE_LAYOUT.present.maxScale)
  })

  it('honours an overridden design canvas', () => {
    const { insetX, insetY } = STAGE_LAYOUT.browse
    expect(computeFitScale(400 + insetX * 2, 200 + insetY * 2, 'browse', { width: 400, height: 200 })).toBeCloseTo(1)
  })
})
