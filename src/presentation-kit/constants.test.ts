import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W } from './constants'

describe('design canvas constants', () => {
  it('defaults to the reference presentation dimensions of 880 x 380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
  })
})
