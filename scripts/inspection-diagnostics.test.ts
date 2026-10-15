import { describe, expect, it } from 'vitest'
import { attributionIssues, isOverlapAllowed, overlapArea, previewReadinessFailure, stylesDistinct } from './inspection-diagnostics.mjs'

describe('inspection diagnostics', () => {
  it('measures overlapping rectangles and treats touching edges as clear', () => {
    expect(overlapArea({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 5, top: 5, right: 15, bottom: 15 })).toBe(25)
    expect(overlapArea({ left: 0, top: 0, right: 10, bottom: 10 }, { left: 10, top: 0, right: 20, bottom: 10 })).toBe(0)
  })

  it('exempts a collision when either element has an intentional overlap marker', () => {
    expect(isOverlapAllowed(true, false)).toBe(true)
    expect(isOverlapAllowed(false, false)).toBe(false)
  })

  it('compares visible active and inactive style properties', () => {
    expect(stylesDistinct({ color: 'red', fontWeight: '700' }, { color: 'red', fontWeight: '400' })).toBe(true)
    expect(stylesDistinct({ color: 'red', fontWeight: '400' }, { color: 'red', fontWeight: '400' })).toBe(false)
  })

  it('includes the final fetch error and preview stderr in readiness diagnostics', () => {
    expect(previewReadinessFailure('ECONNREFUSED', 'vite bind failed')).toBe('preview readiness timed out; last fetch error: ECONNREFUSED; preview stderr: vite bind failed')
    expect(previewReadinessFailure('', '')).toBe('preview readiness timed out; last fetch error: none')
  })

  it('flags undersized and browser-default attribution', () => {
    expect(attributionIssues({ fontSize: '10px', color: 'rgb(0, 0, 238)', textDecorationLine: 'underline' }, { width: 30, height: 14 }, true)).toHaveLength(2)
    expect(attributionIssues({ fontSize: '14px', color: 'rgb(20, 20, 20)', textDecorationLine: 'none' }, { width: 80, height: 24 }, true)).toEqual([])
  })
})
