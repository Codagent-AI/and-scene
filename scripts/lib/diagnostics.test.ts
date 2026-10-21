import { describe, expect, it } from 'vitest'
import {
  ACTIVE_STYLE_PROPS, analyzeSnapshot, attributionProblem, findOverlaps, intersects, isIndistinct,
} from './diagnostics.mjs'

const el = (label: string, x: number, y: number, w: number, h: number, extra: Partial<{ id: number; ancestors: number[]; allow: number[] }> = {}) => ({
  label, rect: { x, y, w, h }, id: extra.id ?? 0, ancestors: extra.ancestors ?? [extra.id ?? 0], allow: extra.allow ?? [],
})

describe('findOverlaps', () => {
  it('reports intersecting text and chrome pairs', () => {
    const pairs = findOverlaps([el('title', 0, 0, 100, 20, { id: 1 }), el('next', 50, 10, 100, 20, { id: 2 }), el('far', 500, 500, 10, 10, { id: 3 })])
    expect(pairs).toEqual([['title', 'next']])
  })

  it('ignores touching edges and sub-pixel contact', () => {
    expect(findOverlaps([el('a', 0, 0, 10, 10, { id: 1 }), el('b', 10, 0, 10, 10, { id: 2 })])).toEqual([])
    expect(findOverlaps([el('a', 0, 0, 10, 10, { id: 1 }), el('c', 9.5, 0, 10, 10, { id: 3 })])).toEqual([])
    expect(intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false)
  })

  it('excludes ancestor and descendant pairs', () => {
    expect(findOverlaps([el('parent', 0, 0, 100, 100, { id: 1 }), el('child', 10, 10, 20, 20, { id: 2, ancestors: [2, 1] })])).toEqual([])
  })

  it('exempts pairs inside one allow-overlap subtree only', () => {
    const marked = [el('a', 0, 0, 50, 50, { id: 1, allow: [9] }), el('b', 10, 10, 50, 50, { id: 2, allow: [9] })]
    expect(findOverlaps(marked)).toEqual([])
    const sameWithoutMarker = marked.map((m) => ({ ...m, allow: [] }))
    expect(findOverlaps(sameWithoutMarker)).toHaveLength(1)
    // A marked element colliding with unmarked chrome, or with a different marked subtree, still warns.
    expect(findOverlaps([marked[0], el('chrome', 20, 20, 50, 50, { id: 3 })])).toHaveLength(1)
    expect(findOverlaps([marked[0], el('other', 20, 20, 50, 50, { id: 4, allow: [8] })])).toHaveLength(1)
  })
})

describe('isIndistinct', () => {
  const base = Object.fromEntries(ACTIVE_STYLE_PROPS.map((p) => [p, 'same']))
  it('flags identical computed treatments', () => {
    expect(isIndistinct({ ...base }, { ...base })).toBe(true)
  })
  it.each(ACTIVE_STYLE_PROPS)('treats a difference in %s as distinct', (prop) => {
    expect(isIndistinct({ ...base, [prop]: 'other' }, { ...base })).toBe(false)
  })
})

describe('attributionProblem', () => {
  const authored = { fontSize: 13, color: 'rgb(1, 2, 3)', textDecorationLine: 'none', defaultColor: 'rgb(0, 0, 238)' }
  it('accepts authored, legible attribution', () => expect(attributionProblem(authored)).toBeNull())
  it('flags a missing link', () => expect(attributionProblem(null)).toBe('is missing'))
  it('flags tiny text', () => expect(attributionProblem({ ...authored, fontSize: 9 })).toMatch(/too small \(9px/))
  it('flags the browser-default link style', () => {
    expect(attributionProblem({ ...authored, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline' })).toMatch(/browser-default/)
  })
  it('does not flag a recolored or non-underlined link', () => {
    expect(attributionProblem({ ...authored, textDecorationLine: 'underline' })).toBeNull()
    expect(attributionProblem({ ...authored, color: 'rgb(0, 0, 238)' })).toBeNull()
  })
})

describe('analyzeSnapshot', () => {
  const styles = Object.fromEntries(ACTIVE_STYLE_PROPS.map((p) => [p, 'x']))
  it('names the step, elements, chrome and hook in each warning', () => {
    const warnings = analyzeSnapshot(3, {
      elements: [el('h2 "Title"', 0, 0, 10, 10, { id: 1 }), el('button[data-presentation-next]', 5, 5, 10, 10, { id: 2 })],
      active: [{ group: 'progress', active: styles, inactive: { ...styles } }],
      attribution: null,
    })
    expect(warnings).toHaveLength(3)
    expect(warnings[0]).toMatch(/^step 3: overlap between h2 "Title" and button\[data-presentation-next\]/)
    expect(warnings[1]).toMatch(/^step 3: active progress item looks identical/)
    expect(warnings[2]).toMatch(/^step 3: attribution is missing .*\[data-presentation-attribution\]/)
  })

  it('is silent for a clean snapshot', () => {
    expect(analyzeSnapshot(1, { elements: [], active: [{ group: 'progress', active: styles, inactive: { ...styles, color: 'y' } }], attribution: { fontSize: 14, color: 'a', textDecorationLine: 'none', defaultColor: 'b' } })).toEqual([])
  })
})
