import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import { computeFitScale, tocVisible } from './useFitScale'

describe('canvas constants', () => {
  it('defaults the design canvas to 880 x 380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('defines fit geometry for both modes', () => {
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })
})

describe('computeFitScale', () => {
  it('scales uniformly: the tighter axis decides', () => {
    // Wide and short viewport: height limits the scale.
    const g = STAGE_LAYOUT.present
    const h = g.top + g.bottom + DESIGN_H * 0.5
    expect(computeFitScale(4000, h, 'present')).toBeCloseTo(0.5)
    // Tall and narrow viewport: width limits the scale.
    const w = g.side * 2 + DESIGN_W * 0.25
    expect(computeFitScale(w, 4000, 'present')).toBeCloseTo(0.25)
  })

  it('shrinks the width budget when the table of contents is shown', () => {
    const wide = 1400
    const withToc = computeFitScale(wide, 4000, 'browse')
    expect(tocVisible('browse', wide)).toBe(true)
    expect(withToc).toBeCloseTo((wide - STAGE_LAYOUT.browse.tocWidth - STAGE_LAYOUT.browse.side * 2) / DESIGN_W)
  })

  it('hides the table of contents on narrow viewports and in present mode', () => {
    expect(tocVisible('browse', 600)).toBe(false)
    expect(tocVisible('present', 2000)).toBe(false)
  })

  it('never goes below the minimum scale', () => {
    expect(computeFitScale(10, 10, 'browse')).toBe(MIN_SCALE)
  })

  it('honours a custom canvas size', () => {
    const g = STAGE_LAYOUT.present
    const scale = computeFitScale(g.side * 2 + 500, 4000, 'present', { width: 1000, height: 400 })
    expect(scale).toBeCloseTo(0.5)
  })
})
