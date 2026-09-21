import { describe, expect, it } from 'vitest'
import { clampStepIndex, isNavigationKey, shouldHandleNavigationKey } from './usePresentationNav'

describe('presentation navigation helpers', () => {
  it('clamps movement at both ends without wrapping', () => {
    expect(clampStepIndex(-1, 4)).toBe(0)
    expect(clampStepIndex(2, 4)).toBe(2)
    expect(clampStepIndex(9, 4)).toBe(3)
    expect(clampStepIndex(4, 2)).toBe(1)
  })

  it('recognizes navigation keys while leaving controls alone', () => {
    expect(isNavigationKey('ArrowRight')).toBe('next')
    expect(isNavigationKey(' ')).toBe('next')
    expect(isNavigationKey('PageUp')).toBe('previous')
    expect(isNavigationKey('p')).toBe('toggle-mode')
    expect(isNavigationKey('Enter')).toBe(false)
  })

  it('does not claim modified or already-handled browser events', () => {
    expect(shouldHandleNavigationKey({ key: 'p', defaultPrevented: false, ctrlKey: true, metaKey: false, altKey: false })).toBe(false)
    expect(shouldHandleNavigationKey({ key: 'ArrowRight', defaultPrevented: false, ctrlKey: false, metaKey: false, altKey: false })).toBe(true)
    expect(shouldHandleNavigationKey({ key: 'ArrowRight', defaultPrevented: true, ctrlKey: false, metaKey: false, altKey: false })).toBe(false)
  })
})
