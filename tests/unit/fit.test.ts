import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../../src/presentation-kit/constants.ts'
import { availableStageSize, computeFitScale, isWide } from '../../src/presentation-kit/fit.ts'

describe('fit scale', () => {
  it('uses the 880 x 380 default canvas', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('returns min(availableW/designW, availableH/designH) so the canvas fits', () => {
    for (const [w, h] of [[1760, 760], [880, 1000], [2000, 190], [440, 380], [10, 10], [1, 500]]) {
      const s = computeFitScale({ width: w, height: h })
      expect(s).toBe(Math.min(w / DESIGN_W, h / DESIGN_H))
      expect(DESIGN_W * s).toBeLessThanOrEqual(w + 1e-9)
      expect(DESIGN_H * s).toBeLessThanOrEqual(h + 1e-9)
    }
  })

  it('still fits a tiny valid area (no floor above the fit ratio)', () => {
    const s = computeFitScale({ width: 10, height: 10 })
    expect(s).toBeLessThan(MIN_SCALE)
    expect(DESIGN_W * s).toBeLessThanOrEqual(10)
  })

  it('falls back to MIN_SCALE only for unmeasurable areas', () => {
    for (const [w, h] of [[0, 400], [400, 0], [-1, 400], [Number.NaN, 400], [400, Number.POSITIVE_INFINITY]]) {
      expect(computeFitScale({ width: w, height: h })).toBe(MIN_SCALE)
    }
  })

  it('honours a design canvas override', () => {
    expect(computeFitScale({ width: 1000, height: 1000 }, { width: 500, height: 250 })).toBe(2)
    expect(computeFitScale({ width: 1000, height: 100 }, { width: 500, height: 250 })).toBe(0.4)
  })

  it('derives the available area from each mode geometry', () => {
    const vp = { width: 1500, height: 900 }
    const b = STAGE_LAYOUT.browse
    const p = STAGE_LAYOUT.present
    expect(availableStageSize('browse', vp)).toEqual({ width: 1500 - 2 * b.side - b.tocWidth, height: 900 - b.top - b.bottom })
    expect(availableStageSize('present', vp)).toEqual({ width: 1500 - 2 * p.side, height: 900 - p.top - p.bottom })
  })

  it('reserves the table-of-contents column only on wide viewports', () => {
    expect(isWide(1024)).toBe(true)
    expect(isWide(1023)).toBe(false)
    expect(availableStageSize('browse', { width: 1023, height: 900 }).width).toBe(1023 - 2 * STAGE_LAYOUT.browse.side)
  })
})
