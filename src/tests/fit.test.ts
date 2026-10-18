import { describe, expect, it } from 'vitest'
import { computeFitScale, DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../presentation-kit'

describe('fixed canvas fit scale', () => {
  it('defaults to an 880 x 380 design canvas with per-mode geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('fits the limiting axis uniformly (browse insets 24 x 12)', () => {
    // width-limited: (1000 - 48) / 880
    expect(computeFitScale(1000, 800, 'browse')).toBeCloseTo(952 / 880, 6)
    // height-limited: (300 - 24) / 380
    expect(computeFitScale(2000, 300, 'browse')).toBeCloseTo(276 / 380, 6)
  })

  it('uses the present-mode geometry (insets 16 x 8, larger cap)', () => {
    expect(computeFitScale(1000, 800, 'present')).toBeCloseTo(968 / 880, 6)
    expect(computeFitScale(5000, 5000, 'present')).toBe(2.5)
    expect(computeFitScale(5000, 5000, 'browse')).toBe(1.5)
  })

  it('never drops below the minimum scale', () => {
    expect(computeFitScale(10, 10, 'browse')).toBe(MIN_SCALE)
    expect(computeFitScale(0, 0, 'present')).toBe(MIN_SCALE)
  })
})
