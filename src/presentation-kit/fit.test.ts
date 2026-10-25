import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MAX_SCALE, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import { computeFitScale, DEFAULT_CANVAS } from './fit.ts'

describe('fixed canvas', () => {
  it('defaults to 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(DEFAULT_CANVAS).toEqual({ width: 880, height: 380 })
  })

  it('declares fit geometry for both modes', () => {
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })
})

describe('computeFitScale', () => {
  const { padX, padY } = STAGE_LAYOUT.browse

  it('is limited by width when the area is wide-short ratio narrow', () => {
    const scale = computeFitScale({ width: 440 + padX * 2, height: 2000 }, 'browse')
    expect(scale).toBeCloseTo(0.5)
  })

  it('is limited by height when the area is short', () => {
    const scale = computeFitScale({ width: 5000, height: 190 + padY * 2 }, 'browse')
    expect(scale).toBeCloseTo(0.5)
  })

  it('scales uniformly, so aspect ratio is preserved at any size', () => {
    const s = computeFitScale({ width: 700, height: 500 }, 'browse')
    expect(DESIGN_W * s).toBeLessThanOrEqual(700)
    expect(DESIGN_H * s).toBeLessThanOrEqual(500)
  })

  it('clamps to the minimum and maximum scale', () => {
    expect(computeFitScale({ width: 1, height: 1 }, 'present')).toBe(MIN_SCALE)
    expect(computeFitScale({ width: 99999, height: 99999 }, 'present')).toBe(MAX_SCALE)
  })

  it('uses the active mode geometry', () => {
    const area = { width: 900, height: 400 }
    expect(computeFitScale(area, 'browse')).toBeGreaterThan(computeFitScale(area, 'present'))
  })

  it('honours a custom canvas', () => {
    const s = computeFitScale({ width: 1000 + padX * 2, height: 5000 }, 'browse', { width: 1000, height: 500 })
    expect(s).toBeCloseTo(1)
  })
})
