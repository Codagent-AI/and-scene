import { describe, expect, it } from 'vitest'
import {
  ACTIVE_STYLE_PROPS,
  ATTRIBUTION_MIN_FONT_PX,
  analyzeSnapshot,
  attributionIssues,
  findOverlaps,
  indistinctActive,
} from '../../scripts/lib/diagnostics.mjs'
import { DEFAULT_SETTLE_MS, captureSteps, stepFile } from '../../scripts/lib/capture.mjs'

type Item = { id: number; label: string; rect: { x: number; y: number; w: number; h: number }; allowed: boolean; ancestors: number[] }
const item = (id: number, x: number, y: number, w: number, h: number, extra: Partial<Item> = {}): Item => ({
  id, label: `item${id}`, rect: { x, y, w, h }, allowed: false, ancestors: [], ...extra,
})

describe('findOverlaps', () => {
  it('reports an unmarked collision with both labels', () => {
    expect(findOverlaps([item(0, 0, 0, 100, 20), item(1, 50, 5, 100, 20)])).toEqual([['item0', 'item1']])
  })
  it('reports nothing for separated or edge-touching elements', () => {
    expect(findOverlaps([item(0, 0, 0, 100, 20), item(1, 100, 0, 50, 20), item(2, 0, 20, 100, 20)])).toEqual([])
  })
  it('ignores sub-pixel intersections', () => {
    expect(findOverlaps([item(0, 0, 0, 100, 20), item(1, 99.5, 0, 50, 20)])).toEqual([])
  })
  it('skips elements nested in each other, in either direction', () => {
    expect(findOverlaps([item(0, 0, 0, 200, 200), item(1, 10, 10, 50, 20, { ancestors: [0] })])).toEqual([])
    expect(findOverlaps([item(0, 10, 10, 50, 20, { ancestors: [1] }), item(1, 0, 0, 200, 200)])).toEqual([])
  })
  it('exempts a pair when either element is inside an allow-overlap subtree', () => {
    expect(findOverlaps([item(0, 0, 0, 100, 20, { allowed: true }), item(1, 50, 5, 100, 20)])).toEqual([])
    expect(findOverlaps([item(0, 0, 0, 100, 20), item(1, 50, 5, 100, 20, { allowed: true })])).toEqual([])
  })
  it('still reports an unrelated unmarked collision next to an allowed one', () => {
    const items = [item(0, 0, 0, 100, 20, { allowed: true }), item(1, 50, 5, 100, 20, { allowed: true }), item(2, 300, 0, 50, 20), item(3, 310, 5, 50, 20)]
    expect(findOverlaps(items)).toEqual([['item2', 'item3']])
  })
})

const style = (over: Record<string, string> = {}) =>
  Object.fromEntries(ACTIVE_STYLE_PROPS.map((p: string) => [p, over[p] ?? 'same']))
const dots = (activeOver: Record<string, string> = {}) => [
  { label: 'a', active: true, style: style(activeOver) },
  { label: 'b', active: false, style: style() },
  { label: 'c', active: false, style: style() },
]

describe('indistinctActive', () => {
  it('flags an active item identical to its inactive siblings', () => {
    expect(indistinctActive(dots())).toBe(true)
  })
  it.each(ACTIVE_STYLE_PROPS)('does not flag an active item that differs only in %s', (prop: string) => {
    expect(indistinctActive(dots({ [prop]: 'different' }))).toBe(false)
  })
  it('is safe without inactive siblings or without an active item', () => {
    expect(indistinctActive([])).toBe(false)
    expect(indistinctActive([{ label: 'a', active: true, style: style() }])).toBe(false)
    expect(indistinctActive([{ label: 'a', active: false, style: style() }])).toBe(false)
  })
})

describe('attributionIssues', () => {
  const link = (over: Record<string, string>) => ({ label: '<a>', style: { fontSize: '14px', color: 'rgb(120, 130, 150)', textDecorationLine: 'none', ...over } })
  it('flags a missing attribution link', () => {
    expect(attributionIssues(null)[0]).toMatch(/no attribution link/)
  })
  it('flags sizes below the minimum, but not at or above it', () => {
    expect(ATTRIBUTION_MIN_FONT_PX).toBe(11)
    expect(attributionIssues(link({ fontSize: '10.9px' }))).toHaveLength(1)
    expect(attributionIssues(link({ fontSize: '11px' }))).toEqual([])
    expect(attributionIssues(link({ fontSize: '16px' }))).toEqual([])
  })
  it.each(['rgb(0, 0, 238)', 'rgb(85, 26, 139)'])('flags the browser-default link look (%s with underline)', (color) => {
    expect(attributionIssues(link({ color, textDecorationLine: 'underline' }))[0]).toMatch(/browser-default/)
  })
  it('accepts an authored link, even an underlined one with its own color', () => {
    expect(attributionIssues(link({ textDecorationLine: 'underline' }))).toEqual([])
    expect(attributionIssues(link({ color: 'rgb(0, 0, 238)' }))).toEqual([])
  })
})

describe('analyzeSnapshot', () => {
  const snapshot = (over = {}) => ({
    items: [], progress: dots({ color: 'x' }), toc: dots({ color: 'x' }),
    attribution: { label: '<a>', style: { fontSize: '14px', color: 'rgb(1, 2, 3)', textDecorationLine: 'none' } },
    ...over,
  })
  it('is quiet for a polished step', () => expect(analyzeSnapshot(1, snapshot())).toEqual([]))
  it('reports each defect kind with the step number and the affected chrome', () => {
    const w = analyzeSnapshot(4, snapshot({ items: [item(0, 0, 0, 100, 20), item(1, 10, 5, 100, 20)], progress: dots(), toc: dots(), attribution: null }))
    expect(w.map((x: { kind: string }) => x.kind)).toEqual(['overlap', 'active-chrome', 'active-chrome', 'attribution'])
    expect(w.every((x: { step: number }) => x.step === 4)).toBe(true)
    expect(w[0].message).toMatch(/item0 overlaps item1.*data-presentation-allow-overlap/)
    expect(w[1].message).toContain('progress indicator')
    expect(w[2].message).toContain('table-of-contents')
    expect(w[3].message).toContain('data-presentation-attribution')
  })
})

describe('captureSteps', () => {
  function rig() {
    const events: string[] = []
    let clock = 0
    let index = 0
    const page = {
      keyboard: { press: async () => void (events.push('press'), (index += 1)) },
      evaluate: async () => ({ count: 3, index }),
    }
    const sleep = async (ms: number) => void (events.push(`sleep:${ms}`), (clock += ms))
    const now = () => clock
    const shoot = async (file: string) => void events.push(`shoot:${file.split('/').pop()}`)
    const snapshot = async () => (events.push('snapshot'), { at: index })
    return { events, page, sleep, now, shoot, snapshot }
  }

  it('waits the settle interval after each step change and before each capture', async () => {
    const r = rig()
    const records = await captureSteps({ ...r, count: 3, outDir: '/out', settleMs: 700 })
    expect(r.events).toEqual([
      'sleep:700', 'shoot:step-01.png', 'snapshot',
      'press', 'sleep:700', 'shoot:step-02.png', 'snapshot',
      'press', 'sleep:700', 'shoot:step-03.png', 'snapshot',
    ])
    expect(records.map((x: { waitedMs: number }) => x.waitedMs)).toEqual([700, 700, 700])
    expect(records.map((x: { snapshot: { at: number } }) => x.snapshot.at)).toEqual([0, 1, 2])
  })

  it('has a documented non-zero default settle and zero-padded predictable file names', () => {
    expect(DEFAULT_SETTLE_MS).toBeGreaterThan(0)
    expect([0, 8, 9, 99].map(stepFile)).toEqual(['step-01.png', 'step-09.png', 'step-10.png', 'step-100.png'])
  })

  it('fails instead of capturing when the step index never advances', async () => {
    const r = rig()
    r.page.keyboard.press = async () => void r.events.push('press')
    r.page.evaluate = async () => ({ count: 3, index: 0 })
    await expect(captureSteps({ ...r, count: 2, outDir: '/out', settleMs: 1, indexTimeoutMs: 10, sleep: async () => {} })).rejects.toThrow(/did not reach 1/)
    expect(r.events).not.toContain('shoot:step-02.png')
  })
})
