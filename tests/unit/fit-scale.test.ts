import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  LAYOUT_T,
  MIN_SCALE,
  STAGE_LAYOUT,
  TOC_MIN_WIDTH,
  TOC_WIDTH,
  computeFitScale,
  isTocVisible,
} from '../../src/presentation-kit'

describe('fixed canvas', () => {
  it('defaults to 880 x 380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('newcomers wait at least as long as the layout morph', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
  })
})

describe('computeFitScale', () => {
  it('is one uniform factor limited by the tighter of width and height', () => {
    const { top, bottom, side } = STAGE_LAYOUT.present
    const wide = computeFitScale(3000, top + bottom + DESIGN_H * 2, 'present')
    expect(wide).toBeCloseTo(2) // height-limited
    const tall = computeFitScale(DESIGN_W * 1.5 + side * 2, 4000, 'present')
    expect(tall).toBeCloseTo(1.5) // width-limited
  })

  it('subtracts the table of contents only in wide browse viewports', () => {
    const w = 1400
    const { top, bottom, side } = STAGE_LAYOUT.browse
    expect(isTocVisible('browse', TOC_MIN_WIDTH)).toBe(true)
    expect(isTocVisible('browse', TOC_MIN_WIDTH - 1)).toBe(false)
    expect(isTocVisible('present', 2000)).toBe(false)
    expect(computeFitScale(w, 5000, 'browse')).toBeCloseTo((w - TOC_WIDTH - side * 2) / DESIGN_W)
    expect(computeFitScale(1000, 5000, 'browse')).toBeCloseTo((1000 - side * 2) / DESIGN_W)
    expect(computeFitScale(w, top + bottom + 190, 'browse')).toBeCloseTo(0.5)
  })

  it('differs per mode, recomputes on resize and floors at MIN_SCALE', () => {
    expect(computeFitScale(1280, 800, 'browse')).not.toBe(computeFitScale(1280, 800, 'present'))
    expect(computeFitScale(1280, 800, 'present')).not.toBe(computeFitScale(800, 600, 'present'))
    expect(computeFitScale(100, 100, 'present')).toBe(MIN_SCALE)
  })

  it('honours custom design canvas dimensions', () => {
    expect(computeFitScale(1280, 800, 'present', DESIGN_W * 2, DESIGN_H * 2)).toBeCloseTo(
      computeFitScale(1280, 800, 'present') / 2,
    )
  })
})
