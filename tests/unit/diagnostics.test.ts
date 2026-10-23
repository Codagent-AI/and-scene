import { describe, expect, it } from 'vitest'
import { analyze, attributionIssues, findOverlaps, isDistinct, settle } from '../../scripts/lib/diagnostics.mjs'

interface Item {
  idx: number
  label: string
  rect: { x: number; y: number; w: number; h: number }
  allowOverlap: boolean
  ancestors: number[]
}
const item = (idx: number, x: number, y: number, w = 100, h = 20, extra: Partial<Item> = {}): Item => ({ idx, label: `item${idx}`, rect: { x, y, w, h }, allowOverlap: false, ancestors: [], ...extra })

describe('settle', () => {
  it('waits for animations and then the configured interval, in that order', async () => {
    const log: string[] = []
    const page = { evaluate: async () => void log.push('animations') }
    await settle(page, 1234, async (ms: number) => void log.push(`sleep ${ms}`))
    expect(log).toEqual(['animations', 'sleep 1234'])
  })

  it('does not resolve before the sleep does', async () => {
    let release: () => void = () => {}
    let done = false
    const pending = settle({ evaluate: async () => {} }, 10, () => new Promise<void>((r) => (release = r))).then(() => (done = true))
    await Promise.resolve()
    await Promise.resolve()
    expect(done).toBe(false)
    release()
    await pending
    expect(done).toBe(true)
  })
})

describe('findOverlaps', () => {
  it('reports colliding items with their size', () => {
    expect(findOverlaps([item(0, 0, 0), item(1, 50, 5)])).toEqual([{ a: 'item0', b: 'item1', width: 50, height: 15 }])
  })
  it('ignores disjoint, touching and hidden-sized items', () => {
    expect(findOverlaps([item(0, 0, 0), item(1, 200, 0), item(2, 100, 0), item(3, 0, 20), item(4, 0, 0, 100, 0)])).toEqual([])
  })
  it('ignores nested text containment in either direction', () => {
    expect(findOverlaps([item(0, 0, 0, 100, 40), item(1, 10, 10, 50, 10, { ancestors: [0] })])).toEqual([])
    expect(findOverlaps([item(0, 10, 10, 50, 10, { ancestors: [1] }), item(1, 0, 0, 100, 40)])).toEqual([])
  })
  it('exempts items inside an allow-overlap subtree but still reports unrelated collisions', () => {
    const items = [item(0, 0, 0, 100, 20, { allowOverlap: true }), item(1, 10, 0, 100, 20, { allowOverlap: true }), item(2, 300, 0), item(3, 320, 5), item(4, 5, 0)]
    const found = findOverlaps(items)
    expect(found.map((f) => [f.a, f.b])).toEqual([['item2', 'item3']])
  })
})

describe('isDistinct', () => {
  const base = { color: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', fontWeight: '400', width: '12px' }
  it('is false for identical styles and near-identical colors', () => {
    expect(isDistinct(base, { ...base })).toBe(false)
    expect(isDistinct(base, { ...base, color: 'rgb(10, 10, 10)' })).toBe(false)
  })
  it('is true for a clearly different color, background, weight or size', () => {
    expect(isDistinct({ ...base, color: 'rgb(200, 0, 0)' }, base)).toBe(true)
    expect(isDistinct({ ...base, backgroundColor: 'rgb(224, 184, 79)' }, base)).toBe(true)
    expect(isDistinct({ ...base, fontWeight: '700' }, base)).toBe(true)
    expect(isDistinct({ ...base, width: '32px' }, base)).toBe(true)
  })
})

describe('attributionIssues', () => {
  const ok = { fontSize: 13, color: 'rgb(224, 184, 79)', rect: { x: 0, y: 0, w: 120, h: 18 } }
  it('is quiet for a legible styled attribution', () => {
    expect(attributionIssues(ok)).toEqual([])
  })
  it('reports missing, undersized and browser-default attributions', () => {
    expect(attributionIssues(null)).toEqual(['attribution link is missing'])
    expect(attributionIssues({ ...ok, fontSize: 9 })[0]).toMatch(/undersized/)
    expect(attributionIssues({ ...ok, rect: { x: 0, y: 0, w: 120, h: 8 } })[0]).toMatch(/undersized/)
    expect(attributionIssues({ ...ok, color: 'rgb(0, 0, 238)' })).toEqual(['attribution uses the browser-default link color'])
    expect(attributionIssues({ ...ok, fontSize: 10, color: 'rgb(0, 0, 238)' })).toHaveLength(2)
  })
})

describe('analyze', () => {
  const style = { color: 'rgb(0, 0, 0)', fontWeight: '400' }
  const clean = { items: [], dots: { active: { ...style, fontWeight: '700' }, inactive: style }, toc: null, attribution: { fontSize: 14, color: 'rgb(10, 10, 200)', rect: { x: 0, y: 0, w: 90, h: 18 } } }

  it('returns no warnings for polished chrome', () => {
    expect(analyze(1, clean)).toEqual([])
  })

  it('names the step and the affected chrome for each kind of finding', () => {
    const data = { ...clean, items: [item(0, 0, 0), item(1, 10, 0)], dots: { active: style, inactive: style }, toc: { active: style, inactive: style }, attribution: null }
    const warnings = analyze(3, data)
    expect(warnings.map((w) => w.kind)).toEqual(['overlap', 'active-progress', 'active-toc', 'attribution'])
    expect(warnings.every((w) => w.step === 3)).toBe(true)
    expect(warnings[0].message).toContain('item0')
    expect(warnings[0].message).toContain('item1')
    expect(warnings[1].message).toContain('data-presentation-dot')
    expect(warnings[2].message).toContain('data-presentation-toc-entry')
    expect(warnings[3].message).toContain('data-presentation-attribution')
  })

  it('reports page-wide chrome findings once but overlaps on every step they occur', () => {
    const reported = new Set<string>()
    const data = { ...clean, items: [item(0, 0, 0), item(1, 10, 0)], attribution: null }
    const first = analyze(1, data, reported)
    const second = analyze(2, data, reported)
    expect(first.map((w) => w.kind)).toEqual(['overlap', 'attribution'])
    expect(second.map((w) => w.kind)).toEqual(['overlap'])
    expect(second[0].step).toBe(2)
  })
})
