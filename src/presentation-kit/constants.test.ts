import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, ENTER_DELAY, LAYOUT_T, STAGE_LAYOUT } from './constants.ts'

describe('constants', () => {
  it('uses an 880 x 380 canvas with browse and present stage geometry', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
    expect(STAGE_LAYOUT.browse.bottom).toBeGreaterThan(STAGE_LAYOUT.present.bottom)
  })

  it('makes newcomers wait for the complete layout morph', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T.duration)
  })
})
