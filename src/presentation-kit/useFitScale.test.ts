import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from './constants'
import { computeFitScale, stageInsets } from './useFitScale'

describe('fit scale', () => {
  it('defaults the canvas to 880x380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(STAGE_LAYOUT.browse).toBeDefined()
    expect(STAGE_LAYOUT.present).toBeDefined()
  })

  it('scales uniformly by the limiting axis', () => {
    const insets = { top: 0, bottom: 0, left: 0, right: 0 }
    expect(computeFitScale(1760, 1000, insets)).toBe(2)
    expect(computeFitScale(2000, 380, insets)).toBe(1)
  })

  it('never goes below the minimum scale', () => {
    expect(computeFitScale(10, 10, { top: 0, bottom: 0, left: 0, right: 0 })).toBe(MIN_SCALE)
  })

  it('reserves the ToC rail only in browse mode on wide viewports', () => {
    expect(stageInsets('browse', true).left).toBeGreaterThan(0)
    expect(stageInsets('browse', false).left).toBe(0)
    expect(stageInsets('present', true).left).toBe(0)
  })
})
