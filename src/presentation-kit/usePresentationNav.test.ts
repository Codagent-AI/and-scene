import { describe, expect, it } from 'vitest'
import { clampStepIndex, isNavigationKey } from './usePresentationNav'

describe('presentation navigation helpers', () => {
  it('clamps movement at both ends without wrapping', () => {
    expect(clampStepIndex(-1, 4)).toBe(0)
    expect(clampStepIndex(2, 4)).toBe(2)
    expect(clampStepIndex(9, 4)).toBe(3)
  })

  it('recognizes navigation keys while leaving controls alone', () => {
    expect(isNavigationKey('ArrowRight')).toBe('next')
    expect(isNavigationKey(' ')).toBe('next')
    expect(isNavigationKey('PageUp')).toBe('previous')
    expect(isNavigationKey('p')).toBe('toggle-mode')
    expect(isNavigationKey('Enter')).toBe(false)
  })
})
