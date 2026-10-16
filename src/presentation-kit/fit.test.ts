import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import { computeFitScale } from './fit.ts'

describe('fixed canvas', () => {
  it('defaults to 880 x 380 with per-mode geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('scales uniformly: the limiting axis decides', () => {
    const { padX, padY } = STAGE_LAYOUT.present
    const byWidth = computeFitScale(440 + padX * 2, 4000, 'present')
    expect(byWidth).toBeCloseTo(0.5)
    const byHeight = computeFitScale(4000, 190 + padY * 2, 'present')
    expect(byHeight).toBeCloseTo(0.5)
  })

  it('is deterministic for a given size, so scale is constant within a mode', () => {
    expect(computeFitScale(1000, 500, 'browse')).toBe(computeFitScale(1000, 500, 'browse'))
  })

  it('clamps to the minimum and per-mode maximum', () => {
    expect(computeFitScale(10, 10, 'browse')).toBe(MIN_SCALE)
    expect(computeFitScale(9999, 9999, 'browse')).toBe(STAGE_LAYOUT.browse.maxScale)
    expect(computeFitScale(9999, 9999, 'present')).toBe(STAGE_LAYOUT.present.maxScale)
  })

  it('honours a design canvas override', () => {
    const scale = computeFitScale(1000, 1000, 'browse', { width: 100, height: 100 })
    expect(scale).toBe(STAGE_LAYOUT.browse.maxScale)
  })
})
