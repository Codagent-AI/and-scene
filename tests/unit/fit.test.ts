import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  MIN_SCALE,
  STAGE_LAYOUT,
  computeFitScale,
  DEFAULT_CANVAS,
} from '../../src/presentation-kit'

describe('fixed-canvas fit scaling', () => {
  it('defaults to an 880 x 380 canvas with per-mode geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(DEFAULT_CANVAS).toEqual({ width: 880, height: 380 })
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('scales uniformly: the tighter axis wins', () => {
    const { insetX, insetY } = STAGE_LAYOUT.browse
    const wide = computeFitScale(1760 + insetX * 2, 5000, 'browse', DEFAULT_CANVAS)
    expect(wide).toBeCloseTo(2)
    const tall = computeFitScale(5000, 190 + insetY * 2, 'browse', DEFAULT_CANVAS)
    expect(tall).toBeCloseTo(0.5)
  })

  it('never drops below the minimum scale', () => {
    expect(computeFitScale(0, 0, 'present', DEFAULT_CANVAS)).toBe(MIN_SCALE)
  })

  it('honors a custom canvas', () => {
    const scale = computeFitScale(1000 + 16, 500 + 16, 'present', { width: 500, height: 500 })
    expect(scale).toBeCloseTo(1)
  })
})
