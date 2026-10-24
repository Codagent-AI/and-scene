import { describe, expect, it } from 'vitest'
import { attributionIssues, findOverlaps, isActiveDistinct, rectsOverlap } from './inspect-lib.mjs'

const item = (name, x, y, w, h, extra = {}) => ({ name, rect: { x, y, w, h }, allowOverlap: false, ancestors: [], ...extra })

describe('overlap detection', () => {
  it('detects intersecting rectangles and ignores touching or distant ones', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true)
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false)
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 50, y: 50, w: 10, h: 10 })).toBe(false)
  })

  it('reports an unmarked collision naming both elements', () => {
    expect(findOverlaps([item('a', 0, 0, 50, 20), item('b', 20, 5, 50, 20), item('c', 200, 200, 5, 5)])).toEqual([['a', 'b']])
  })

  it('exempts pairs inside an allow-overlap subtree', () => {
    const items = [item('a', 0, 0, 50, 20, { allowOverlap: true }), item('b', 20, 5, 50, 20, { allowOverlap: true })]
    expect(findOverlaps(items)).toEqual([])
    expect(findOverlaps([item('a', 0, 0, 50, 20, { allowOverlap: true }), item('b', 20, 5, 50, 20)])).toEqual([])
  })

  it('does not flag a container against its own descendant', () => {
    expect(findOverlaps([item('p', 0, 0, 50, 20), item('k', 5, 5, 20, 10, { ancestors: ['p'] })])).toEqual([])
  })
})

describe('active chrome distinctness', () => {
  const inactive = { backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(1, 1, 1)', width: '10px', opacity: '1' }
  it('flags an active item that matches its inactive siblings', () => {
    expect(isActiveDistinct({ ...inactive }, inactive)).toBe(false)
  })
  it('accepts any visible difference', () => {
    expect(isActiveDistinct({ ...inactive, width: '24px' }, inactive)).toBe(true)
    expect(isActiveDistinct({ ...inactive, backgroundColor: 'rgb(200, 80, 30)' }, inactive)).toBe(true)
  })
})

describe('attribution polish', () => {
  const good = { fontSize: '12px', color: 'rgb(200, 80, 30)', fontFamily: 'ui-sans-serif, system-ui' }
  it('accepts a styled, legible attribution', () => {
    expect(attributionIssues(good)).toEqual([])
  })
  it('flags tiny, default-blue, and default-serif attribution', () => {
    expect(attributionIssues({ ...good, fontSize: '8px' })).toHaveLength(1)
    expect(attributionIssues({ ...good, color: 'rgb(0, 0, 238)' })).toHaveLength(1)
    expect(attributionIssues({ ...good, fontFamily: '"Times New Roman"' })).toHaveLength(1)
    expect(attributionIssues({ fontSize: '10px', color: 'rgb(0, 0, 238)', fontFamily: 'Times' })).toHaveLength(3)
  })
})
