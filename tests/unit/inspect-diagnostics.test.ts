import { describe, expect, it } from 'vitest'
import {
  ALLOW_OVERLAP_ATTR, attributionIssue, diagnose, findOverlaps, isIndistinct, rectsOverlap, settle,
} from '../../scripts/lib/diagnostics.mjs'

const rect = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom })
const item = (key: number, r: ReturnType<typeof rect>, extra: object = {}) => ({
  key, label: `item${key}`, rect: r, allowed: false, ancestors: [] as number[], ...extra,
})

describe('rectsOverlap', () => {
  it('detects overlap and ignores touching, separated and zero-area rects', () => {
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(5, 5, 15, 15))).toBe(true)
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(10, 0, 20, 10))).toBe(false) // touching edges
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(20, 20, 30, 30))).toBe(false)
    expect(rectsOverlap(rect(0, 0, 10, 10), rect(5, 5, 5, 15))).toBe(false) // zero area
  })
})

describe('findOverlaps', () => {
  it('reports unmarked collisions, including with chrome', () => {
    const items = [item(0, rect(0, 0, 10, 10)), item(1, rect(5, 5, 20, 20)), item(2, rect(100, 100, 110, 110))]
    expect(findOverlaps(items).map(([a, b]) => [a.key, b.key])).toEqual([[0, 1]])
  })

  it('exempts items inside an allow-overlap subtree but still reports unrelated collisions', () => {
    const items = [
      item(0, rect(0, 0, 10, 10), { allowed: true }),
      item(1, rect(5, 5, 20, 20), { allowed: true }), // nested descendant of the marked subtree
      item(2, rect(8, 8, 30, 30)), // unmarked collider
      item(3, rect(200, 0, 210, 10)),
      item(4, rect(205, 5, 220, 20)),
    ]
    const pairs = findOverlaps(items).map(([a, b]) => [a.key, b.key])
    expect(pairs).toEqual([[3, 4]])
  })

  it('never collides ancestors with their own descendants', () => {
    const items = [item(0, rect(0, 0, 50, 50)), item(1, rect(10, 10, 20, 20), { ancestors: [0] })]
    expect(findOverlaps(items)).toEqual([])
  })
})

describe('active chrome', () => {
  const base = { color: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)', borderColor: 'rgb(0, 0, 0)', borderWidth: '1px', opacity: '1', fontWeight: '400', transform: 'none', width: '10px', height: '10px' }
  it('flags an active control identical to an inactive sibling', () => {
    expect(isIndistinct(base, { ...base })).toBe(true)
  })
  it.each(['color', 'backgroundColor', 'borderColor', 'borderWidth', 'opacity', 'fontWeight', 'transform', 'width', 'height'])('does not flag a difference in %s', (k) => {
    expect(isIndistinct({ ...base, [k]: 'different' }, base)).toBe(false)
  })
})

describe('attribution', () => {
  const ok = { fontSize: 12, color: 'rgb(150, 150, 150)', textDecorationLine: 'underline' }
  it('warns for missing, small and browser-default links, not for polished ones', () => {
    expect(attributionIssue(null)).toMatch(/missing/)
    expect(attributionIssue({ ...ok, fontSize: 10.9 })).toMatch(/under 11px/)
    expect(attributionIssue({ ...ok, fontSize: 11 })).toBeNull()
    expect(attributionIssue({ ...ok, color: 'rgb(0, 0, 238)' })).toMatch(/browser-default/)
    expect(attributionIssue({ ...ok, color: 'rgb(0, 0, 238)', textDecorationLine: 'none' })).toBeNull()
    expect(attributionIssue(ok)).toBeNull()
  })
})

describe('settle', () => {
  it('does not return before the interval and reports the elapsed time (default 900 ms and overrides)', async () => {
    let t = 0
    const slept: number[] = []
    const clock = { now: () => t, sleep: async (ms: number) => { slept.push(ms); t += ms } }
    expect(await settle(900, clock)).toBe(900)
    expect(await settle(150, clock)).toBe(150)
    expect(slept).toEqual([900, 150])
  })
})

describe('diagnose', () => {
  const clean = { index: 3, title: 'T', items: [], activeChrome: [], attribution: { fontSize: 12, color: 'red', textDecorationLine: 'none' } }
  it('names the step, elements and hooks', () => {
    expect(diagnose(clean)).toEqual([])
    const [overlap] = diagnose({ ...clean, items: [item(0, rect(0, 0, 10, 10)), item(1, rect(1, 1, 9, 9))] })
    expect(overlap).toContain('step 4')
    expect(overlap).toContain('item0')
    expect(overlap).toContain('item1')
    expect(overlap).toContain(ALLOW_OVERLAP_ATTR)
    const same = { color: 'a', backgroundColor: 'a', borderColor: 'a', borderWidth: 'a', opacity: 'a', fontWeight: 'a', transform: 'a', width: 'a', height: 'a' }
    const [chrome] = diagnose({ ...clean, activeChrome: [{ name: 'progress indicator', active: same, inactive: { ...same } }] })
    expect(chrome).toContain('active progress indicator')
    const [attr] = diagnose({ ...clean, attribution: null })
    expect(attr).toContain('data-presentation-attribution')
    expect(attr).toContain('step 4')
  })
})
