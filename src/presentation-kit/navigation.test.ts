import { describe, expect, it } from 'vitest'
import { clampIndex, groupEras, stepMarker, swipeDirection } from './navigation'

describe('navigation helpers', () => {
  it('clamps at both ends without wrapping', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(5, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
  })

  it('maps swipes: left advances, right goes back, small or vertical swipes are ignored', () => {
    expect(swipeDirection(-120, 5)).toBe(1)
    expect(swipeDirection(120, 5)).toBe(-1)
    expect(swipeDirection(-20, 0)).toBe(0)
    expect(swipeDirection(-80, 90)).toBe(0)
  })

  it('groups consecutive steps by era and derives markers from position', () => {
    const steps = ['a', 'a', 'b', 'a'].map((era, i) => ({ id: `s${i}`, era, title: '', caption: '' }))
    expect(groupEras(steps)).toEqual([
      { era: 'a', start: 0, end: 1 },
      { era: 'b', start: 2, end: 2 },
      { era: 'a', start: 3, end: 3 },
    ])
    expect(stepMarker(0)).toBe('01')
    expect(stepMarker(9)).toBe('10')
  })
})
