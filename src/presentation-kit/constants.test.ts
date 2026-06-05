import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, STAGE_LAYOUT } from './constants'

describe('constants', () => {
  it('uses the reference design canvas dimensions of 880 × 380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })

  it('defines browse and present stage layout geometry', () => {
    expect(STAGE_LAYOUT.browse.fitW).toBe(DESIGN_W)
    expect(STAGE_LAYOUT.present.fitW).toBe(790)
    expect(STAGE_LAYOUT.browse.top).toBeGreaterThan(STAGE_LAYOUT.present.top)
  })
})
