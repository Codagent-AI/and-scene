import { describe, expect, it } from 'vitest'
import { attributionIssues, findOverlaps, intersection, isActiveDistinct } from './inspection-checks.mjs'

const item = (label, x, y, w, h, extra = {}) => ({ label, rect: { x, y, w, h }, allowed: false, ancestors: [], ...extra })

describe('findOverlaps', () => {
  it('reports unmarked overlapping text boxes', () => {
    expect(findOverlaps([item('a', 0, 0, 50, 20), item('b', 40, 5, 50, 20)])).toEqual([['a', 'b']])
  })

  it('ignores boxes that only touch or are apart', () => {
    expect(findOverlaps([item('a', 0, 0, 50, 20), item('b', 50, 0, 50, 20), item('c', 0, 100, 5, 5)])).toEqual([])
  })

  it('ignores overlaps involving an item inside an allow-overlap subtree', () => {
    expect(findOverlaps([item('a', 0, 0, 50, 20, { allowed: true }), item('b', 40, 5, 50, 20)])).toEqual([])
    expect(findOverlaps([item('a', 0, 0, 50, 20), item('b', 40, 5, 50, 20, { allowed: true })])).toEqual([])
  })

  it('does not treat a contained element as a collision with its ancestor', () => {
    expect(findOverlaps([item('parent', 0, 0, 100, 100), item('child', 10, 10, 20, 20, { ancestors: [0] })])).toEqual([])
  })

  it('ignores slivers smaller than the threshold', () => {
    expect(findOverlaps([item('a', 0, 0, 50, 20), item('b', 49, 0, 50, 20)])).toEqual([])
  })
})

describe('intersection', () => {
  it('returns null for disjoint rects', () => {
    expect(intersection({ x: 0, y: 0, w: 1, h: 1 }, { x: 5, y: 5, w: 1, h: 1 })).toBeNull()
  })
})

describe('isActiveDistinct', () => {
  const base = { backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(1, 1, 1)', width: '10px', opacity: '1' }
  it('is false when active and inactive look identical', () => {
    expect(isActiveDistinct({ ...base }, { ...base })).toBe(false)
  })
  it('is true when any visual property differs', () => {
    expect(isActiveDistinct({ ...base, backgroundColor: 'rgb(9, 9, 9)' }, base)).toBe(true)
    expect(isActiveDistinct({ ...base, width: '14px' }, base)).toBe(true)
  })
})

describe('attributionIssues', () => {
  const good = { fontSize: 13, color: 'rgb(180, 170, 150)', fontFamily: 'Inter, sans-serif', rect: { x: 0, y: 0, w: 100, h: 16 } }
  it('is empty for a polished link', () => {
    expect(attributionIssues(good)).toEqual([])
  })
  it('flags a missing link', () => {
    expect(attributionIssues(null)).toEqual(['attribution link is missing'])
  })
  it('flags a small font, default link color, and default font', () => {
    expect(attributionIssues({ ...good, fontSize: 9 })).toHaveLength(1)
    expect(attributionIssues({ ...good, color: 'rgb(0, 0, 238)' })).toEqual(['uses the browser-default link color'])
    expect(attributionIssues({ ...good, fontFamily: '"Times New Roman"' })).toEqual(['uses the browser-default font'])
  })
  it('flags a tiny rendered size', () => {
    expect(attributionIssues({ ...good, rect: { x: 0, y: 0, w: 10, h: 4 } })).toEqual(['rendered size is too small'])
  })
})
