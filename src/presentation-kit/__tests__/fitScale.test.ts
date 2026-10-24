import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MAX_SCALE, MIN_SCALE, STAGE_LAYOUT } from '../constants'
import { fitScale } from '../fitScale'

describe('fitScale', () => {
  it('uses the default 880 x 380 design canvas', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    const { padX } = STAGE_LAYOUT.browse
    expect(fitScale({ width: 880 + padX * 2, height: 10_000 }, 'browse')).toBeCloseTo(1)
  })

  it('scales uniformly by the tighter axis', () => {
    const { padX, padY } = STAGE_LAYOUT.present
    const wide = fitScale({ width: 5000, height: 190 + padY * 2 }, 'present')
    expect(wide).toBeCloseTo(0.5)
    const tall = fitScale({ width: 440 + padX * 2, height: 5000 }, 'present')
    expect(tall).toBeCloseTo(0.5)
  })

  it('uses per-mode geometry', () => {
    const region = { width: 700, height: 300 }
    expect(fitScale(region, 'browse')).not.toBe(fitScale(region, 'present'))
  })

  it('stays within [MIN_SCALE, MAX_SCALE]', () => {
    expect(fitScale({ width: 0, height: 0 }, 'browse')).toBe(MIN_SCALE)
    expect(fitScale({ width: 99999, height: 99999 }, 'browse')).toBe(MAX_SCALE)
  })
})
