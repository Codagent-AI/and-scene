import { describe, expect, it } from 'vitest'
import { buildToc, stepMarker } from '../../src/presentation-kit'

describe('order-derived helpers', () => {
  it('derives step markers from position', () => {
    expect(stepMarker(0, 9)).toBe('01')
    expect(stepMarker(8, 9)).toBe('09')
    expect(stepMarker(99, 120)).toBe('100')
  })

  it('groups consecutive steps of an era into one table-of-contents entry', () => {
    const steps = ['a', 'a', 'b', 'b', 'b', 'c'].map((era, i) => ({ id: `s${i}`, era, title: '', caption: '' }))
    expect(buildToc(steps)).toEqual([
      { era: 'a', firstIndex: 0 },
      { era: 'b', firstIndex: 2 },
      { era: 'c', firstIndex: 5 },
    ])
  })
})
