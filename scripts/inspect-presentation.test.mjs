import { describe, expect, it } from 'vitest'
import {
  analyzeStep,
  findAttributionIssues,
  findIndistinctActive,
  findOverlaps,
  formatWarning,
  parseArgs,
  parseRegistrySlugs,
  parseViewport,
  stepFileName,
} from './inspect-presentation.mjs'

const el = (id, x, y, w, h, extra = {}) => ({ id, ancestors: [], tag: 'p', text: `t${id}`, rects: [{ x, y, w, h }], allowOverlap: false, ...extra })

describe('args', () => {
  it('parses defaults and options', () => {
    const a = parseArgs(['talk', '--settle', '50', '--viewport=390x844', '--no-build', '--out', 'o'])
    expect(a).toMatchObject({ slug: 'talk', settle: 50, viewport: { width: 390, height: 844 }, build: 'never', out: 'o', errors: [] })
    expect(parseArgs(['talk']).viewport).toEqual({ width: 1280, height: 800 })
  })
  it('reports bad input', () => {
    expect(parseArgs([]).errors).toContain('missing <slug>')
    expect(parseArgs(['t', '--viewport', 'big']).errors[0]).toMatch(/invalid --viewport/)
    expect(parseArgs(['t', '--nope']).errors[0]).toMatch(/unknown option/)
    expect(parseViewport('1280x800')).toEqual({ width: 1280, height: 800 })
  })
  it('names files one-based and zero-padded', () => {
    expect(stepFileName(0)).toBe('step-01.png')
    expect(stepFileName(11)).toBe('step-12.png')
  })
  it('reads slugs from the registry source', () => {
    expect(parseRegistrySlugs("// { slug: 'old' }\n{ slug: 'a-b', title: 'x' }")).toEqual(['a-b'])
  })
})

describe('findOverlaps', () => {
  it('reports intersecting unrelated elements', () => {
    const w = findOverlaps([el(1, 0, 0, 100, 20), el(2, 50, 5, 100, 20)])
    expect(w).toHaveLength(1)
    expect(w[0].kind).toBe('overlap')
  })
  it('ignores separated, touching, and tolerance-level overlaps', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 20), el(2, 0, 30, 100, 20)])).toEqual([])
    expect(findOverlaps([el(1, 0, 0, 100, 20), el(2, 100, 0, 100, 20)])).toEqual([])
    expect(findOverlaps([el(1, 0, 0, 100, 20), el(2, 99, 19, 100, 20)])).toEqual([])
  })
  it('ignores ancestor/descendant pairs', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 20), el(2, 10, 0, 50, 20, { ancestors: [1] })])).toEqual([])
  })
  it('exempts elements inside an allow-overlap subtree', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 20, { allowOverlap: true }), el(2, 50, 5, 100, 20)])).toEqual([])
  })
  it('compares per-line rects, not the union box', () => {
    const wrapped = el(1, 0, 0, 0, 0, { rects: [{ x: 0, y: 0, w: 200, h: 10 }, { x: 0, y: 40, w: 20, h: 10 }] })
    expect(findOverlaps([wrapped, el(2, 100, 15, 50, 10)])).toEqual([])
  })
})

describe('findIndistinctActive', () => {
  const s = { color: 'red', backgroundColor: 'none', width: '10px', height: '10px' }
  it('warns when active equals inactive', () => {
    const w = findIndistinctActive([{ kind: 'progress', items: [{ active: true, style: s }, { active: false, style: { ...s } }] }])
    expect(w).toHaveLength(1)
    expect(w[0].kind).toBe('active-chrome')
  })
  it('accepts any meaningful difference', () => {
    for (const patch of [{ color: 'blue' }, { backgroundColor: 'black' }, { width: '14px' }, { opacity: '0.5' }]) {
      expect(findIndistinctActive([{ kind: 'toc', items: [{ active: true, style: { ...s, ...patch } }, { active: false, style: s }] }])).toEqual([])
    }
  })
  it('skips groups with no active or no inactive items', () => {
    expect(findIndistinctActive([{ kind: 'toc', items: [{ active: true, style: s }] }])).toEqual([])
  })
})

describe('findAttributionIssues', () => {
  const defaults = { color: 'rgb(0, 0, 238)', fontFamily: 'Times' }
  const good = { rect: { w: 120, h: 20 }, style: { fontSize: '13px', color: 'gray', textDecoration: 'none', fontFamily: 'Inter' }, defaults }
  it('accepts styled attribution', () => expect(findAttributionIssues(good)).toEqual([]))
  it('flags missing, tiny, and default-styled attribution with the hook name', () => {
    expect(findAttributionIssues(null)[0].message).toContain('[data-presentation-attribution]')
    expect(findAttributionIssues({ ...good, style: { ...good.style, fontSize: '8px' } })[0].message).toMatch(/font size/)
    expect(findAttributionIssues({ ...good, rect: { w: 10, h: 8 } })[0].message).toMatch(/hit area/)
    const def = { ...good, style: { fontSize: '16px', color: defaults.color, textDecoration: 'underline', fontFamily: 'Times' } }
    expect(findAttributionIssues(def)[0].message).toMatch(/browser-default/)
  })
})

describe('analyzeStep / formatWarning', () => {
  it('combines analyses and formats with step number and kind', () => {
    const w = analyzeStep({ elements: [el(1, 0, 0, 10, 10), el(2, 0, 0, 10, 10)], groups: [], attribution: null })
    expect(w.map((x) => x.kind)).toEqual(['overlap', 'attribution'])
    expect(formatWarning(3, w[0])).toMatch(/^warn step 03 \[overlap\] /)
  })
})
