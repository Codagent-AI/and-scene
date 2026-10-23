import { describe, expect, it } from 'vitest'
import { attributionProblems, findIndistinctChrome, findOverlaps, isDistinct } from '../../scripts/inspect-presentation.mjs'
import { OUTLINES, outlineMismatch } from '../../scripts/verify.mjs'

const item = (id: number, x: number, extra: Record<string, unknown> = {}) => ({
  id,
  label: `item${id}`,
  rect: { x, y: 0, width: 100, height: 20 },
  allowed: false,
  ancestors: [] as number[],
  ...extra,
})

describe('overlap diagnostics', () => {
  it('reports overlapping text and ignores separate or contained ones', () => {
    expect(findOverlaps([item(1, 0), item(2, 50)])).toEqual([['item1', 'item2']])
    expect(findOverlaps([item(1, 0), item(2, 200)])).toEqual([])
    expect(findOverlaps([item(1, 0), item(2, 50, { ancestors: [1] })])).toEqual([])
  })

  it('reports text, control and chrome collisions alike, including chrome against chrome', () => {
    expect(findOverlaps([item(1, 20), item(3, 0)])).toHaveLength(1)
    expect(findOverlaps([item(3, 0, { label: 'footer' }), item(4, 20, { label: 'prev button' })])).toEqual([['footer', 'prev button']])
  })

  it('exempts allow-overlap subtrees', () => {
    expect(findOverlaps([item(1, 0, { allowed: true }), item(2, 50, { allowed: true })])).toEqual([])
    expect(findOverlaps([item(1, 0, { allowed: true }), item(2, 50)])).toEqual([])
  })
})

describe('active chrome and attribution diagnostics', () => {
  const base = { backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(200, 200, 200)', borderColor: 'rgb(9, 9, 9)', opacity: '1', fontWeight: '400', transform: 'none', textDecorationLine: 'none' }

  it('flags identical active and inactive styles only', () => {
    expect(isDistinct(base, { ...base })).toBe(false)
    expect(isDistinct({ ...base, backgroundColor: 'rgb(240, 180, 60)' }, base)).toBe(true)
    expect(isDistinct({ ...base, fontWeight: '700' }, base)).toBe(true)
    // Unstyled entries differ in size only because their labels differ; that is not a current-state treatment.
    expect(isDistinct({ ...base, width: '80px', height: '20px' } as typeof base, { ...base, width: '40px', height: '20px' } as typeof base)).toBe(false)
    expect(findIndistinctChrome([{ name: 'progress indicator', active: base, inactive: { ...base } }])).toEqual(['progress indicator'])
    expect(findIndistinctChrome([{ name: 'toc', active: base, inactive: null }])).toEqual([])
  })

  it('flags missing, browser-default and undersized attribution', () => {
    expect(attributionProblems(null)).toEqual(['attribution link is missing'])
    expect(attributionProblems({ color: 'rgb(0, 0, 238)', fontSize: 16, height: 18 })).toEqual(['attribution uses the browser-default link color'])
    expect(attributionProblems({ color: 'rgb(240, 240, 240)', fontSize: 9, height: 12 })).toEqual(['attribution is undersized'])
    expect(attributionProblems({ color: 'rgb(240, 240, 240)', fontSize: 14, height: 26 })).toEqual([])
  })
})

describe('outline check', () => {
  const slug = 'how-to-make-a-presentation'
  it('accepts the normative step and names the mismatching field', () => {
    const [first] = OUTLINES[slug]
    expect(outlineMismatch(slug, 0, first)).toBeNull()
    expect(outlineMismatch(slug, 0, { ...first, title: 'x' })).toMatch(/step 1 title/)
    expect(outlineMismatch(slug, 1, first)).toMatch(/step 2 title/)
    expect(outlineMismatch(slug, 99, first)).toMatch(/no step 100/)
  })
})
