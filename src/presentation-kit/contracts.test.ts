import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W } from './constants'
import { clampIndex } from './usePresentationNav'

describe('presentation kit contracts', () => {
  it('uses the fixed reference design canvas', () => {
    expect({ width: DESIGN_W, height: DESIGN_H }).toEqual({ width: 880, height: 380 })
  })

  it('clamps direct navigation to both ends without wrapping', () => {
    expect(clampIndex(-1, 3)).toBe(0)
    expect(clampIndex(1, 3)).toBe(1)
    expect(clampIndex(99, 3)).toBe(2)
    expect(clampIndex(1, 0)).toBe(0)
  })
})
