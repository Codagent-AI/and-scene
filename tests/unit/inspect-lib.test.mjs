import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTLE_MS,
  analyze,
  attributionIssues,
  findOverlaps,
  intersects,
  isDistinct,
  normalizeSignature,
  parseArgs,
} from '../../scripts/inspect-presentation.mjs'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants.ts'

const item = (uid, desc, x, y, w = 100, h = 20, extra = {}) => ({
  uid,
  desc,
  rect: { x, y, width: w, height: h },
  allowed: false,
  lineage: [],
  ...extra,
})

describe('overlap detection', () => {
  it('intersects only on a real overlap, not on touching edges', () => {
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true)
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false)
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 0, y: 30, width: 10, height: 10 })).toBe(false)
  })

  it('reports unmarked collisions and ignores disjoint items', () => {
    const found = findOverlaps([item(1, 'A', 0, 0), item(2, 'B', 50, 10), item(3, 'C', 0, 100)])
    expect(found).toEqual([['A', 'B']])
  })

  it('exempts anything inside an allow-overlap subtree but still reports unrelated collisions', () => {
    const items = [
      item(1, 'inside-1', 0, 0, 100, 20, { allowed: true }),
      item(2, 'inside-2', 10, 5, 100, 20, { allowed: true, lineage: [9, 8, 7] }),
      item(3, 'chrome', 20, 5),
      item(4, 'x', 400, 400),
      item(5, 'y', 410, 405),
    ]
    expect(findOverlaps(items)).toEqual([['x', 'y']])
  })

  it('skips ancestor/descendant pairs', () => {
    expect(findOverlaps([item(1, 'parent', 0, 0), item(2, 'child', 5, 5, 50, 10, { lineage: [1] })])).toEqual([])
  })
})

describe('chrome and attribution diagnostics', () => {
  const sig = { color: 'rgb(0,0,0)', backgroundColor: 'rgba(0,0,0,0)', borderColor: 'rgb(0,0,0)', borderWidth: '1px', fontWeight: '400', opacity: '1', width: '12px', height: '12px', textDecorationLine: 'none', boxShadow: 'none', outlineStyle: 'none', transform: 'none' }

  it('flags identical active/inactive looks and accepts any visible difference', () => {
    expect(isDistinct(sig, { ...sig })).toBe(false)
    expect(isDistinct({ ...sig, backgroundColor: 'rgb(1,2,3)' }, sig)).toBe(true)
    expect(isDistinct({ ...sig, width: '32px' }, sig)).toBe(true)
    expect(isDistinct({ ...sig, fontWeight: '700' }, sig)).toBe(true)
  })

  it('ignores differences that cannot be seen (undrawn borders, absent outlines)', () => {
    const hidden = { ...sig, borderTopStyle: 'solid', borderTopWidth: '0px', outlineStyle: 'none', outlineWidth: '0px' }
    expect(isDistinct({ ...hidden, borderTopColor: 'red', outlineColor: 'red' }, { ...hidden, borderTopColor: 'blue', outlineColor: 'blue' })).toBe(false)
    const drawn = { ...sig, borderTopStyle: 'solid', borderTopWidth: '2px' }
    expect(isDistinct({ ...drawn, borderTopColor: 'red' }, { ...drawn, borderTopColor: 'blue' })).toBe(true)
    expect(normalizeSignature({ ...hidden, borderTopColor: 'red' }).borderTopColor).toBe('')
  })

  it('flags missing, undersized and browser-default attribution but not a polished one', () => {
    const polished = { fontSizePx: 13, color: 'rgb(11,110,102)', textDecorationLine: 'none', authorStyled: true }
    expect(attributionIssues(polished)).toEqual([])
    expect(attributionIssues({ ...polished, fontSizePx: 12 })).toEqual([])
    expect(attributionIssues({ ...polished, fontSizePx: 11.9 })[0]).toMatch(/below 12px/)
    expect(attributionIssues({ ...polished, color: 'rgb(0, 0, 238)' })[0]).toMatch(/browser-default/)
    expect(attributionIssues({ ...polished, textDecorationLine: 'underline', authorStyled: false })[0]).toMatch(/underlined/)
    expect(attributionIssues({ ...polished, textDecorationLine: 'underline' })).toEqual([])
    expect(attributionIssues(null)[0]).toMatch(/missing/)
  })

  it('analyze names the step, the elements and the styling hook', () => {
    const diag = {
      items: [item(1, 'A', 0, 0), item(2, 'B', 10, 5)],
      progress: { active: sig, inactive: { ...sig }, desc: '<button progress>' },
      toc: null,
      attribution: { fontSizePx: 10, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline', authorStyled: false },
    }
    const out = analyze(4, diag).join('\n')
    expect(out).toMatch(/step 4: overlap between A and B/)
    expect(out).toMatch(/step 4: active progress indicator <button progress>/)
    expect(out).toMatch(/step 4: attribution .*data-presentation-attribution/)
  })
})

describe('options', () => {
  it('settles for longer than the kit enter delay plus layout transition by default', () => {
    expect(DEFAULT_SETTLE_MS).toBeGreaterThan((ENTER_DELAY + ENTER_T + LAYOUT_T) * 1000)
  })

  it('parses slug, settle, viewport, out and no-build', () => {
    expect(parseArgs(['talk', '--settle', '50', '--viewport', '390x844', '--out', 'x', '--no-build'])).toEqual({
      slug: 'talk',
      settle: 50,
      viewport: { width: 390, height: 844 },
      out: 'x',
      build: false,
    })
    expect(parseArgs(['talk']).settle).toBe(DEFAULT_SETTLE_MS)
  })

  it('rejects malformed option values with a clear error', () => {
    expect(() => parseArgs(['t', '--settle', 'abc'])).toThrow(/--settle must be/)
    expect(() => parseArgs(['t', '--settle'])).toThrow(/needs a value/)
    expect(() => parseArgs(['t', '--viewport', '10x'])).toThrow(/--viewport must look like/)
    expect(() => parseArgs(['t', '--viewport', '--no-build'])).toThrow(/needs a value/)
  })
})
