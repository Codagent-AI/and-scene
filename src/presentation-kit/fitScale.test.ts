import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, NARROW_MAX_WIDTH, NARROW_SIDE, STAGE_LAYOUT, TOC_MIN_WIDTH, TOC_WIDTH } from './constants.ts'
import { availableSpace, computeScale, stageSide } from './fitScale.ts'

describe('fit scale', () => {
  it('defaults the design canvas to 880 x 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it('scales uniformly to the limiting axis', () => {
    const { width, height } = availableSpace(1280, 720, 'browse')
    expect(computeScale(1280, 720, 'browse')).toBeCloseTo(Math.min(width / DESIGN_W, height / DESIGN_H))
  })

  it('uses per-mode geometry', () => {
    expect(STAGE_LAYOUT.present.bottom).not.toBe(STAGE_LAYOUT.browse.bottom)
    expect(computeScale(1280, 720, 'present')).toBeGreaterThan(computeScale(1280, 720, 'browse'))
  })

  it('reserves the table of contents only on wide browse viewports', () => {
    expect(availableSpace(TOC_MIN_WIDTH, 800, 'browse').width).toBe(TOC_MIN_WIDTH - STAGE_LAYOUT.browse.side * 2 - TOC_WIDTH)
    expect(availableSpace(TOC_MIN_WIDTH - 1, 800, 'browse').width).toBe(TOC_MIN_WIDTH - 1 - STAGE_LAYOUT.browse.side * 2)
    expect(availableSpace(TOC_MIN_WIDTH, 800, 'present').width).toBe(TOC_MIN_WIDTH - STAGE_LAYOUT.present.side * 2)
  })

  it('narrows the gutter on phone-width viewports so the canvas gets more width', () => {
    expect(stageSide(NARROW_MAX_WIDTH, 'browse')).toBe(STAGE_LAYOUT.browse.side)
    expect(stageSide(NARROW_MAX_WIDTH - 1, 'browse')).toBe(NARROW_SIDE)
    expect(stageSide(390, 'present')).toBe(NARROW_SIDE)
    expect(availableSpace(390, 844, 'browse').width).toBe(390 - NARROW_SIDE * 2)
    expect(computeScale(390, 844, 'browse')).toBeCloseTo((390 - NARROW_SIDE * 2) / DESIGN_W)
    expect(computeScale(390, 844, 'browse')).toBeGreaterThan((390 - STAGE_LAYOUT.browse.side * 2) / DESIGN_W)
  })

  it('never drops below the minimum scale and honours a custom canvas', () => {
    expect(computeScale(10, 10, 'browse')).toBe(MIN_SCALE)
    expect(computeScale(1280, 720, 'present', { width: 440, height: 190 })).toBeCloseTo(2 * computeScale(1280, 720, 'present'))
  })

  it('does not depend on anything but viewport and mode, so scale is constant across steps', () => {
    expect(computeScale(800, 600, 'browse')).toBe(computeScale(800, 600, 'browse'))
  })
})
