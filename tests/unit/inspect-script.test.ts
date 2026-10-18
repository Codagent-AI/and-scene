import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit'
import * as inspect from '../../scripts/inspect-presentation.mjs'

type Item = { id: number; kind: 'text' | 'chrome'; desc: string; rect: { x: number; y: number; w: number; h: number }; allow: boolean; ancestors: number[] }
const item = (id: number, x: number, y: number, w: number, h: number, extra: Partial<Item> = {}): Item => ({
  id, kind: 'text', desc: `item${id}`, rect: { x, y, w, h }, allow: false, ancestors: [], ...extra,
})

describe('findOverlaps', () => {
  it('reports intersecting text and chrome boxes by description', () => {
    expect(inspect.findOverlaps([item(0, 0, 0, 100, 20), item(1, 50, 5, 100, 20)])).toEqual(['item0 overlaps item1'])
  })
  it('ignores disjoint, touching and barely grazing boxes', () => {
    expect(inspect.findOverlaps([item(0, 0, 0, 100, 20), item(1, 0, 40, 100, 20), item(2, 100, 0, 50, 20), item(3, -49, 0, 50, 20)])).toEqual([])
  })
  it('ignores a chrome box and the content inside it', () => {
    const parent = item(0, 0, 0, 200, 50, { kind: 'chrome' })
    const child = item(1, 10, 10, 50, 20, { ancestors: [0] })
    expect(inspect.findOverlaps([parent, child])).toEqual([])
  })
  it('reports separately painted text that overlaps text in an ancestor element', () => {
    const parent = item(0, 0, 0, 200, 20)
    const child = item(1, 10, 4, 80, 14, { ancestors: [0] })
    expect(inspect.findOverlaps([parent, child])).toEqual(['item0 overlaps item1'])
  })
  it('ignores hidden and zero-size boxes', () => {
    expect(inspect.findOverlaps([item(0, 0, 0, 100, 20), item(1, 10, 5, 0, 0), item(2, 10, 5, 50, 0)])).toEqual([])
  })
  it('exempts only pairs where both sides are inside an allow-overlap subtree', () => {
    const items = [
      item(0, 0, 0, 100, 20, { allow: true }),
      item(1, 50, 5, 100, 20, { allow: true }),
      item(2, 300, 0, 100, 20),
      item(3, 320, 5, 100, 20),
    ]
    expect(inspect.findOverlaps(items)).toEqual(['item2 overlaps item3'])
  })
  it('reports a marked element colliding with unmarked chrome', () => {
    const marked = item(0, 0, 0, 100, 20, { allow: true })
    const chrome = item(1, 10, 5, 80, 20, { kind: 'chrome' })
    expect(inspect.findOverlaps([marked, chrome])).toEqual(['item0 overlaps item1'])
    expect(inspect.findOverlaps([chrome, marked])).toHaveLength(1)
  })
})

describe('isIndistinct', () => {
  const base = { color: 'a', backgroundColor: 'b', borderTopColor: 'c', borderTopWidth: '1px', opacity: '1', fontWeight: '400', textDecorationLine: 'none', boxShadow: 'none', width: '10px', height: '10px', transform: 'none', outlineWidth: '0px' }
  it('is true only when every compared style matches', () => {
    expect(inspect.isIndistinct(base, { ...base })).toBe(true)
  })
  it.each(Object.keys(base).filter((k) => k !== 'borderTopColor'))('is false when %s differs', (key) => {
    expect(inspect.isIndistinct({ ...base, [key]: 'other' }, base)).toBe(false)
  })
  it('ignores a border colour that paints nothing because the border is zero-width', () => {
    const flat = { ...base, borderTopWidth: '0px' }
    expect(inspect.isIndistinct({ ...flat, borderTopColor: 'red' }, flat)).toBe(true)
  })
  it('counts a border colour that paints a visible border', () => {
    expect(inspect.isIndistinct({ ...base, borderTopColor: 'red' }, base)).toBe(false)
  })
})

describe('attributionWarning', () => {
  const good = { fontSizePx: 14, height: 20, color: 'rgb(232, 199, 106)' }
  it('accepts a styled, legible attribution', () => expect(inspect.attributionWarning(good)).toBeNull())
  it('flags a missing, tiny or browser-default attribution and points at the hook', () => {
    for (const info of [null, { ...good, fontSizePx: 8 }, { ...good, height: 9 }, { ...good, color: 'rgb(0, 0, 238)' }]) {
      expect(inspect.attributionWarning(info)).toContain('[data-presentation-attribution]')
    }
  })
  it('lets deliberate size and colour changes win over unrelated style changes', () => {
    expect(inspect.attributionWarning({ ...good, fontSizePx: 11 })).toBeNull()
  })
})

describe('analyseSnapshot', () => {
  const style = { color: 'x' }
  it('combines warning kinds and skips groups without an inactive sibling or active item', () => {
    const snapshot = {
      items: [item(0, 0, 0, 10, 10), item(1, 5, 5, 10, 10)],
      groups: [
        { name: 'progress', active: style, inactive: [{ ...style }] },
        { name: 'table-of-contents', active: style, inactive: [] },
        { name: 'other', active: null, inactive: [style] },
      ],
      attribution: null,
    }
    expect(inspect.analyseSnapshot(snapshot).map((w: { type: string }) => w.type)).toEqual(['overlap', 'active-chrome', 'attribution'])
  })
})

describe('options', () => {
  it('has a settle default longer than the full transition', () => {
    expect(inspect.DEFAULT_SETTLE_MS).toBeGreaterThan((LAYOUT_T + ENTER_DELAY + ENTER_T) * 1000)
  })
  it('lets a flag or the environment override the settle interval', () => {
    expect(inspect.parseArgs(['s']).settleMs).toBe(inspect.DEFAULT_SETTLE_MS)
    expect(inspect.parseArgs(['s', '--settle', '123']).settleMs).toBe(123)
    expect(inspect.parseArgs(['s'], { INSPECT_SETTLE_MS: '77' }).settleMs).toBe(77)
  })
  it('parses viewport, labels the output, and rejects bad input', () => {
    const o = inspect.parseArgs(['s', '--viewport', '390x844', '--no-build'])
    expect(o).toMatchObject({ viewport: { width: 390, height: 844 }, label: '390x844', build: 'never' })
    expect(() => inspect.parseArgs([])).toThrow('usage')
    expect(() => inspect.parseArgs(['s', '--viewport', 'wide'])).toThrow('--viewport')
    expect(() => inspect.parseArgs(['s', '--bogus'])).toThrow('unknown option')
    expect(() => inspect.parseArgs(['s', '--settle', '-1'])).toThrow('settle')
  })
  it('names screenshots predictably', () => {
    expect(inspect.stepFile(0)).toBe('step-01.png')
    expect(inspect.stepFile(11)).toBe('step-12.png')
  })
  it('the in-page collector is self-contained so it can be serialised into the browser', () => {
    const src = String(inspect.collectSnapshot)
    expect(src).not.toMatch(/\bSTYLE_KEYS\b|\bALLOW_OVERLAP_ATTR\b/)
    expect(readFileSync('scripts/inspect-presentation.mjs', 'utf8')).toContain('ALLOW_OVERLAP_ATTR')
  })
})
