import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../../src/presentation-kit/constants'
import { computeFitScale, stageBox } from '../../src/presentation-kit/useFitScale'

const canvas = { width: DESIGN_W, height: DESIGN_H }

describe('fit scale', () => {
  it('default design canvas is 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it('is width-limited, height-limited, and uncapped when enlarging', () => {
    expect(computeFitScale({ width: 440, height: 1000 }, canvas)).toBeCloseTo(0.5)
    expect(computeFitScale({ width: 2000, height: 190 }, canvas)).toBeCloseTo(0.5)
    expect(computeFitScale({ width: 1760, height: 760 }, canvas)).toBeCloseTo(2)
    expect(computeFitScale({ width: 8800, height: 3800 }, canvas)).toBeCloseTo(10)
  })

  it('never drops below the minimum scale', () => {
    expect(computeFitScale({ width: 10, height: 10 }, canvas)).toBe(MIN_SCALE)
  })

  it('scales an overridden canvas by its own dimensions', () => {
    expect(computeFitScale({ width: 500, height: 500 }, { width: 1000, height: 1000 })).toBeCloseTo(0.5)
  })

  it('uses per-mode geometry for the available stage area', () => {
    const viewport = { width: 1280, height: 720 }
    const browse = stageBox('browse', viewport)
    const present = stageBox('present', viewport)
    expect(browse.height).toBe(720 - STAGE_LAYOUT.browse.insetTop - STAGE_LAYOUT.browse.insetBottom)
    expect(present.height).toBe(720 - STAGE_LAYOUT.present.insetTop - STAGE_LAYOUT.present.insetBottom)
    expect(present.height).toBeGreaterThan(browse.height)
    expect(browse.width).toBe(1280 - STAGE_LAYOUT.browse.insetX * 2)
  })
})
