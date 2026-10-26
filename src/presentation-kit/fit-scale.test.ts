import { describe, expect, test } from 'vitest'
import { DESIGN_H, DESIGN_W, fitScale } from './constants'

describe('fitScale', () => {
  test('uses the default 880 by 380 canvas and uniform fitting', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(fitScale({ width: 440, height: 380 })).toBe(0.5)
    expect(fitScale({ width: 880, height: 190 })).toBe(0.5)
  })
})
