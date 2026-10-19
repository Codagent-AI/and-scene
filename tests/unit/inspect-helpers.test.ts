import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error plain ESM helper without type declarations
import * as h from '../../scripts/lib/inspect-helpers.mjs'

const item = (selector: string, path: string, x: number, y: number, w: number, hgt: number, extra: object = {}) => ({
  selector,
  path,
  rect: { x, y, width: w, height: hgt },
  ...extra,
})

describe('settle', () => {
  it('defaults to a named constant of at least 1000ms and waits before resolving', async () => {
    expect(h.SETTLE_MS).toBeGreaterThanOrEqual(1000)
    vi.useFakeTimers()
    try {
      let done = false
      const p = h.settle(h.SETTLE_MS).then(() => (done = true))
      await vi.advanceTimersByTimeAsync(h.SETTLE_MS - 1)
      expect(done).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      await p
      expect(done).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
  it('honors an explicit interval', async () => {
    const sleep = vi.fn(async () => {})
    await h.settle(250, sleep)
    expect(sleep).toHaveBeenCalledWith(250)
  })
})

describe('parseArgs / stepFileName', () => {
  it('parses slug and options', () => {
    expect(h.parseArgs(['talk', '--narrow', '--settle', '1500', '--out', '/tmp/x'])).toEqual({
      slug: 'talk', narrow: true, settle: 1500, out: '/tmp/x',
    })
  })
  it('rejects a missing slug and unknown options', () => {
    expect(() => h.parseArgs([])).toThrow(/usage/)
    expect(() => h.parseArgs(['a', '--bogus'])).toThrow(/unknown/)
    expect(() => h.parseArgs(['a', '--settle', 'x'])).toThrow(/settle/)
  })
  it('names screenshots with one-based zero-padded indexes', () => {
    expect(h.stepFileName(0)).toBe('step-01.png')
    expect(h.stepFileName(11)).toBe('step-12.png')
  })
})

describe('findOverlaps', () => {
  it('reports positive-area intersections', () => {
    const r = h.findOverlaps([item('a', '0', 0, 0, 100, 50), item('b', '1', 90, 40, 100, 50)])
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ a: 'a', b: 'b', area: 100 })
  })
  it('ignores disjoint and edge-touching rects', () => {
    expect(h.findOverlaps([item('a', '0', 0, 0, 100, 50), item('b', '1', 200, 0, 10, 10)])).toEqual([])
    expect(h.findOverlaps([item('a', '0', 0, 0, 100, 50), item('b', '1', 100, 0, 10, 50)])).toEqual([])
  })
  it('ignores hidden and zero-size elements', () => {
    expect(h.findOverlaps([item('a', '0', 0, 0, 100, 50), item('b', '1', 0, 0, 100, 50, { visible: false })])).toEqual([])
    expect(h.findOverlaps([item('a', '0', 0, 0, 100, 50), item('b', '1', 10, 10, 0, 0)])).toEqual([])
  })
  it('ignores ancestor/descendant pairs but not siblings with similar path prefixes', () => {
    expect(h.findOverlaps([item('p', '0.1', 0, 0, 100, 50), item('c', '0.1.3', 10, 10, 20, 20)])).toEqual([])
    expect(h.findOverlaps([item('p', '0.1', 0, 0, 100, 50), item('s', '0.10', 10, 10, 20, 20)])).toHaveLength(1)
  })
  it('exempts allow-overlap items without suppressing unrelated collisions', () => {
    const items = [
      item('marked1', '0.0', 0, 0, 100, 50, { allowOverlap: true }),
      item('marked2', '0.1', 10, 10, 100, 50, { allowOverlap: true }),
      item('x', '1', 0, 200, 100, 50),
      item('y', '2', 20, 210, 100, 50),
      item('z', '3', 30, 15, 40, 20),
    ]
    const r = h.findOverlaps(items)
    expect(r.map((p: { a: string; b: string }) => [p.a, p.b])).toEqual([['x', 'y']])
  })
})

describe('active distinctness', () => {
  const base = { color: 'rgb(0,0,0)', backgroundColor: 'rgba(0,0,0,0)', border: 'none', opacity: '1', fontWeight: '400', textDecoration: 'none' }
  it('flags identical styles as indistinct (progress and ToC alike)', () => {
    expect(h.isIndistinctActive({ ...base }, { ...base })).toBe(true)
    const w = h.stepWarnings(2, { overlapItems: [], attribution: polished, active: [
      { chrome: '[data-presentation-progress-item]', active: base, inactive: base },
      { chrome: '[data-presentation-toc-item]', active: base, inactive: base },
    ] })
    expect(w).toHaveLength(2)
    expect(w[0]).toContain('step=2 indistinct-active: [data-presentation-progress-item]')
    expect(w[1]).toContain('[data-presentation-toc-item]')
  })
  it.each(h.DISTINCTNESS_PROPS as string[])('a difference in %s alone counts as distinct', (prop: string) => {
    const active = { ...base, [prop]: 'different' }
    expect(h.differingStyleProps(active, base)).toEqual([prop])
    expect(h.isIndistinctActive(active, base)).toBe(false)
  })
})

const defaults = { color: 'rgb(0, 0, 238)', fontFamily: 'Times', textDecoration: 'underline' }
const polished = { fontSize: 14, color: 'rgb(10,10,10)', fontFamily: 'Georgia', textDecoration: 'none', defaults }

describe('attributionProblems', () => {
  it('reports missing attribution', () => {
    expect(h.attributionProblems(null)).toEqual(['missing'])
  })
  it('reports sizes under 12px and accepts the 12px boundary', () => {
    expect(h.attributionProblems({ ...polished, fontSize: 11.9 })[0]).toMatch(/font-size/)
    expect(h.attributionProblems({ ...polished, fontSize: 12 })).toEqual([])
  })
  it('reports browser-default link styling only when color, font and decoration are all default', () => {
    expect(h.attributionProblems({ ...polished, ...defaults })).toEqual(['browser-default link styling'])
    expect(h.attributionProblems({ ...polished, ...defaults, color: 'red' })).toEqual([])
    expect(h.attributionProblems({ ...polished, ...defaults, textDecoration: 'none' })).toEqual([])
  })
  it('accepts a deliberately styled legible link', () => {
    expect(h.attributionProblems(polished)).toEqual([])
  })
})

describe('stepWarnings', () => {
  it('formats step-specific warnings and points at the attribution styling hook', () => {
    const w = h.stepWarnings(3, {
      overlapItems: [item('a', '0', 0, 0, 10, 10), item('b', '1', 5, 5, 10, 10)],
      active: [],
      attribution: null,
    })
    expect(w[0]).toBe('[inspect] WARN step=3 overlap: a <-> b')
    expect(w[1]).toContain('step=3 attribution: missing')
    expect(w[1]).toContain('[data-presentation-attribution]')
  })
  it('is silent for a clean step', () => {
    expect(h.stepWarnings(1, { overlapItems: [], active: [], attribution: polished })).toEqual([])
  })
})
