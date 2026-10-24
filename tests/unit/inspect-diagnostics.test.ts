import { describe, expect, it } from 'vitest'
import { ENTER_DELAY, ENTER_T, LAYOUT_T } from '../../src/presentation-kit/constants'
import {
  attributionIssues, DEFAULT_SETTLE_MS, DISTINCTION_PROPS, findOverlaps, isIndistinct, rectsOverlap, VIEWPORT, warningsForStep,
} from '../../scripts/lib/inspect-diagnostics.mjs'

const rect = (x: number, y: number, width = 100, height = 20) => ({ x, y, width, height })
const item = (desc: string, r: ReturnType<typeof rect>, extra: object = {}) => ({ desc, rect: r, allowed: false, ancestors: [] as number[], ...extra })

describe('settle interval and viewport defaults', () => {
  it('settle interval outlasts the kit’s longest transition', () => {
    expect(DEFAULT_SETTLE_MS / 1000).toBeGreaterThan(LAYOUT_T + ENTER_DELAY + ENTER_T)
    expect(VIEWPORT).toEqual({ width: 1280, height: 720 })
  })
})

describe('overlap detection', () => {
  it('detects visible overlaps and ignores touching or tiny intersections', () => {
    expect(rectsOverlap(rect(0, 0), rect(50, 10))).toBe(true)
    expect(rectsOverlap(rect(0, 0), rect(100, 0))).toBe(false)
    expect(rectsOverlap(rect(0, 0), rect(98, 10))).toBe(false)
    expect(rectsOverlap(rect(0, 0), rect(0, 100))).toBe(false)
  })

  it('reports unmarked collisions between unrelated elements', () => {
    expect(findOverlaps([item('A', rect(0, 0)), item('B', rect(50, 5)), item('C', rect(500, 500))])).toEqual([['A', 'B']])
  })

  it('exempts ancestor/descendant pairs', () => {
    expect(findOverlaps([item('parent', rect(0, 0)), item('child', rect(10, 5), { ancestors: [0] })])).toEqual([])
  })

  it('exempts only elements inside an allow-overlap subtree, not the rest of the page', () => {
    const items = [
      item('inside', rect(0, 0), { allowed: true }),
      item('inside-2', rect(40, 5), { allowed: true }),
      item('outside-1', rect(300, 0)),
      item('outside-2', rect(340, 5)),
    ]
    expect(findOverlaps(items)).toEqual([['outside-1', 'outside-2']])
  })
})

describe('active chrome distinction', () => {
  const base = Object.fromEntries(DISTINCTION_PROPS.map((p) => [p, 'same']))

  it('flags identical styles', () => {
    expect(isIndistinct({ ...base }, { ...base })).toBe(true)
  })

  it('ignores size differences between text-labelled controls but not between unlabelled ones', () => {
    expect(isIndistinct({ ...base, width: '40px', _hasText: true }, { ...base, width: '60px', _hasText: true })).toBe(true)
    expect(isIndistinct({ ...base, width: '10px' }, { ...base, width: '26px' })).toBe(false)
  })

  it.each(DISTINCTION_PROPS)('treats a difference in %s as distinct', (prop) => {
    expect(isIndistinct({ ...base, [prop]: 'other' }, { ...base })).toBe(false)
  })
})

describe('attribution polish', () => {
  const good = { present: true, fontSize: 13, color: 'rgb(224, 185, 79)', fontFamily: 'Inter', defaultFontFamily: 'Times' }

  it('accepts a deliberately styled, legible link', () => {
    expect(attributionIssues(good)).toEqual([])
  })

  it('reports a missing link, undersized text, default link colors and the default font', () => {
    expect(attributionIssues({ ...good, present: false })).toHaveLength(1)
    expect(attributionIssues({ ...good, fontSize: 10 })[0]).toMatch(/under 11px/)
    expect(attributionIssues({ ...good, color: 'rgb(0, 0, 238)' })[0]).toMatch(/default link color/)
    expect(attributionIssues({ ...good, fontFamily: 'Times' })[0]).toMatch(/default font/)
    expect(attributionIssues({ ...good, fontSize: 9, color: 'rgb(0, 0, 238)', fontFamily: 'Times' })).toHaveLength(3)
  })
})

describe('warningsForStep', () => {
  const snapshot = (over: object = {}) => ({
    items: [],
    nav: [],
    attribution: { present: true, fontSize: 14, color: 'red-ish', fontFamily: 'Inter', defaultFontFamily: 'Times' },
    ...over,
  })

  it('is empty for a clean step', () => {
    expect(warningsForStep(1, snapshot())).toEqual([])
  })

  it('names the step, both overlapping elements, the chrome and the attribution hook', () => {
    const same = Object.fromEntries(DISTINCTION_PROPS.map((p) => [p, 'x']))
    const lines = warningsForStep(
      4,
      snapshot({
        items: [item('title "A"', rect(0, 0)), item('caption "B"', rect(20, 5))],
        nav: [{ name: 'progress indicator', active: same, inactive: { ...same } }, { name: 'table-of-contents entry', active: null, inactive: null }],
        attribution: { present: true, fontSize: 8, color: 'rgb(0, 0, 238)', fontFamily: 'Times', defaultFontFamily: 'Times' },
      }),
    )
    expect(lines).toHaveLength(3)
    expect(lines.every((l) => l.startsWith('WARN step 4 '))).toBe(true)
    expect(lines[0]).toContain('title "A"')
    expect(lines[0]).toContain('caption "B"')
    expect(lines[1]).toContain('progress indicator')
    expect(lines[2]).toContain('data-presentation-attribution')
  })
})
