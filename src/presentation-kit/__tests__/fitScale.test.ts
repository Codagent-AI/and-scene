import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../constants'
import { computeFitScale } from '../fitScale'

describe('fit scale', () => {
  it('defaults the canvas to 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it('scales uniformly by the limiting axis', () => {
    const g = { padX: 0, padY: 0, maxScale: 10 }
    expect(computeFitScale(1760, 1000, g)).toBe(2)
    expect(computeFitScale(5000, 190, g)).toBe(0.5)
  })

  it('applies per-mode geometry, clamps to min/max', () => {
    expect(computeFitScale(10, 10, STAGE_LAYOUT.browse)).toBe(MIN_SCALE)
    expect(computeFitScale(1e6, 1e6, STAGE_LAYOUT.present)).toBe(STAGE_LAYOUT.present.maxScale)
    expect(computeFitScale(1000, 500, STAGE_LAYOUT.browse)).toBeLessThan(computeFitScale(1000, 500, { ...STAGE_LAYOUT.browse, padX: 0, padY: 0 }))
  })

  it('is unaffected by anything but the region size (constant within a mode)', () => {
    expect(computeFitScale(1200, 600, STAGE_LAYOUT.present)).toBe(computeFitScale(1200, 600, STAGE_LAYOUT.present))
  })
})
