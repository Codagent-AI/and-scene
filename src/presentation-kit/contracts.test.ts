import { describe, expect, it } from 'vitest'
import { clampStepIndex, getFitScale } from './utils'
import { DEFAULT_ATTRIBUTION_URL, DESIGN_H, DESIGN_W } from './constants'

describe('scene kit contracts', () => {
  it('clamps navigation at both ends', () => {
    expect(clampStepIndex(-1, 4)).toBe(0)
    expect(clampStepIndex(8, 4)).toBe(3)
  })

  it('uses uniform fit scaling and the reference canvas dimensions', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(getFitScale(440, 190)).toBe(0.5)
    expect(getFitScale(1760, 190)).toBe(0.5)
  })

  it('links attribution to the project without toolkit theme defaults', () => {
    expect(DEFAULT_ATTRIBUTION_URL).toBe('https://github.com/and-scene/and-scene')
  })
})
