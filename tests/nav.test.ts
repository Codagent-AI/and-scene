import { describe, expect, it } from 'vitest'
import { DESIGN_H, DESIGN_W, MIN_SCALE } from '../src/presentation-kit/constants'
import { clamp, eraStarts, isInteractive, swipeDirection } from '../src/presentation-kit/nav'
import { fitScale } from '../src/presentation-kit/useFitScale'

describe('navigation helpers', () => {
  it('clamps at both ends without wrapping', () => {
    expect(clamp(-1, 5)).toBe(0)
    expect(clamp(5, 5)).toBe(4)
    expect(clamp(2, 5)).toBe(2)
    expect(clamp(3, 0)).toBe(0)
  })

  it('maps horizontal swipes: left advances, right goes back, vertical is ignored', () => {
    expect(swipeDirection(-120, 10)).toBe(1)
    expect(swipeDirection(120, -10)).toBe(-1)
    expect(swipeDirection(-20, 0)).toBe(0)
    expect(swipeDirection(-60, 200)).toBe(0)
  })

  it('finds the first step of each era', () => {
    expect(eraStarts(['a', 'a', 'b', 'c', 'c'])).toEqual([
      { era: 'a', index: 0 },
      { era: 'b', index: 2 },
      { era: 'c', index: 3 },
    ])
  })

  it('treats buttons, links and inputs as interactive', () => {
    const b = document.createElement('button')
    const d = document.createElement('div')
    document.body.append(b, d)
    expect(isInteractive(b)).toBe(true)
    expect(isInteractive(d)).toBe(false)
    expect(isInteractive(null)).toBe(false)
  })
})

describe('fit scaling', () => {
  it('scales the 880x380 canvas uniformly by the limiting axis', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    const wide = fitScale(1760 + 16, 760 + 16, 'browse')
    expect(wide).toBeCloseTo(2, 5)
    const tall = fitScale(1760 + 16, 380 + 16, 'browse')
    expect(tall).toBeCloseTo(1, 5)
  })

  it('never drops below the minimum scale', () => {
    expect(fitScale(0, 0, 'present')).toBe(MIN_SCALE)
  })
})
