import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants.ts'
import { computeFit, eraStarts, isWide, stepNumber } from './geometry.ts'

describe('fixed canvas', () => {
  it('defaults to 880 x 380 with per-mode fit geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    expect(STAGE_LAYOUT.browse.bottom).toBeGreaterThan(STAGE_LAYOUT.present.bottom)
  })

  it('fits width-limited viewports uniformly', () => {
    // 440 wide: 440 / 880 = 0.5, available height is plentiful.
    expect(computeFit(440, 1000, 'present').scale).toBeCloseTo(0.5)
  })

  it('fits height-limited viewports uniformly', () => {
    const { top, bottom } = STAGE_LAYOUT.browse
    const scale = computeFit(4000, top + bottom + 190, 'browse').scale
    expect(scale).toBeCloseTo(190 / DESIGN_H)
  })

  it('uses each mode\'s own stage geometry', () => {
    const browse = computeFit(1440, 900, 'browse')
    const present = computeFit(1440, 900, 'present')
    expect(browse.top).toBe(STAGE_LAYOUT.browse.top)
    expect(present.bottom).toBe(STAGE_LAYOUT.present.bottom)
    expect(present.scale).toBeGreaterThan(browse.scale)
  })

  it('never drops below the minimum scale', () => {
    expect(computeFit(10, 10, 'browse').scale).toBe(MIN_SCALE)
    expect(computeFit(1000, 0, 'present').scale).toBe(MIN_SCALE)
  })

  it('shows the table of contents only on wide viewports', () => {
    expect(isWide(1440)).toBe(true)
    expect(isWide(390)).toBe(false)
  })
})

describe('step helpers', () => {
  it('derives distinct eras in order of first appearance', () => {
    const steps = ['a', 'a', 'b', 'b', 'b', 'c'].map((era, i) => ({ id: `s${i}`, era, title: '', caption: '' }))
    expect(eraStarts(steps)).toEqual([
      { era: 'a', firstIndex: 0 },
      { era: 'b', firstIndex: 2 },
      { era: 'c', firstIndex: 5 },
    ])
  })

  it('pads step numbers from position', () => {
    expect(stepNumber(0)).toBe('01')
    expect(stepNumber(11)).toBe('12')
  })
})
