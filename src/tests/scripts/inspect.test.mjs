import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTLE_MS,
  DEFAULT_VIEWPORT,
  attributionProblems,
  captureSteps,
  findOverlaps,
  isIndistinct,
  parseArgs,
  screenshotDir,
  screenshotName,
  stepWarnings,
} from '../../../scripts/inspect-lib.mjs'

const item = (key, x, y, w, h, extra = {}) => ({ key, label: `el${key}`, rect: { x, y, width: w, height: h }, ...extra })

describe('screenshot paths and options', () => {
  it('writes predictable per-step names under a project-local directory', () => {
    expect(screenshotName(0)).toBe('step-01.png')
    expect(screenshotName(11)).toBe('step-12.png')
    expect(screenshotDir('deck')).toBe('.inspection/deck')
    expect(screenshotDir('deck', { width: 390, height: 844 })).toBe('.inspection/deck/390x844')
  })

  it('parses the slug, settle interval, and viewport options', () => {
    expect(parseArgs(['deck'])).toMatchObject({ slug: 'deck', settleMs: DEFAULT_SETTLE_MS, build: true })
    expect(DEFAULT_VIEWPORT).toEqual({ width: 1440, height: 900 })
    expect(parseArgs(['deck', '--settle', '50', '--skip-build'])).toMatchObject({ settleMs: 50, build: false })
    expect(parseArgs(['deck', '--viewport', '800x600']).viewport).toEqual({ width: 800, height: 600 })
    expect(parseArgs(['deck', '--narrow']).viewport).toEqual({ width: 390, height: 844 })
    expect(() => parseArgs([])).toThrow(/usage/)
    expect(() => parseArgs(['deck', '--bogus'])).toThrow(/unknown option/)
    expect(() => parseArgs(['deck', '--viewport', 'wide'])).toThrow(/invalid viewport/)
    expect(() => parseArgs(['deck', '--settle', '-1'])).toThrow(/non-negative/)
  })

  it('has a default settle interval longer than layout, delay, and entrance combined', () => {
    expect(DEFAULT_SETTLE_MS).toBeGreaterThan((0.5 + 0.1 + 0.35) * 1000)
  })
})

describe('captureSteps', () => {
  it('moves to each step, waits the settle interval, then captures, in that order', async () => {
    const log = []
    await captureSteps({
      count: 3,
      settleMs: 700,
      goTo: async (i) => log.push(`go ${i}`),
      wait: async (ms) => log.push(`wait ${ms}`),
      capture: async (i) => log.push(`shot ${i}`),
    })
    expect(log).toEqual(['go 0', 'wait 700', 'shot 0', 'go 1', 'wait 700', 'shot 1', 'go 2', 'wait 700', 'shot 2'])
  })

  it('awaits an asynchronous wait before capturing', async () => {
    let waited = false
    await captureSteps({
      count: 1,
      settleMs: 1,
      goTo: async () => {},
      wait: () => new Promise((resolve) => setTimeout(() => ((waited = true), resolve()), 20)),
      capture: async () => expect(waited).toBe(true),
    })
  })
})

describe('overlap detection', () => {
  it('reports intersecting boxes only', () => {
    expect(findOverlaps([item(1, 0, 0, 10, 10), item(2, 5, 5, 10, 10)])).toHaveLength(1)
    expect(findOverlaps([item(1, 0, 0, 10, 10), item(2, 20, 20, 10, 10)])).toHaveLength(0)
  })

  it('does not count edge-touching boxes', () => {
    expect(findOverlaps([item(1, 0, 0, 10, 10), item(2, 10, 0, 10, 10)])).toHaveLength(0)
    expect(findOverlaps([item(1, 0, 0, 10, 10), item(2, 0, 10, 10, 10)])).toHaveLength(0)
  })

  it('ignores hidden and zero-size elements', () => {
    expect(findOverlaps([item(1, 0, 0, 10, 10), item(2, 0, 0, 10, 10, { visible: false })])).toHaveLength(0)
    expect(findOverlaps([item(1, 0, 0, 10, 10), item(2, 5, 5, 0, 10)])).toHaveLength(0)
  })

  it('exempts allow-overlap subtrees on either side but still reports other pairs', () => {
    const allowed = item(1, 0, 0, 10, 10, { allowOverlap: true })
    expect(findOverlaps([allowed, item(2, 5, 5, 10, 10)])).toHaveLength(0)
    expect(findOverlaps([item(2, 5, 5, 10, 10), allowed])).toHaveLength(0)
    const pairs = findOverlaps([allowed, item(2, 5, 5, 10, 10), item(3, 8, 8, 10, 10)])
    expect(pairs.map(([a, b]) => [a.key, b.key])).toEqual([[2, 3]])
  })

  it('ignores an element nested in the other', () => {
    expect(findOverlaps([item(1, 0, 0, 50, 50), item(2, 5, 5, 10, 10, { containedBy: [1] })])).toHaveLength(0)
  })
})

describe('active chrome and attribution diagnostics', () => {
  const base = { color: 'rgb(1, 1, 1)', backgroundColor: 'rgba(0, 0, 0, 0)', fontWeight: '400', opacity: '1', borderColor: 'rgb(0, 0, 0)', boxShadow: 'none' }

  it('flags an active item identical to an inactive one', () => {
    expect(isIndistinct(base, { ...base })).toBe(true)
  })

  it.each(['color', 'backgroundColor', 'fontWeight', 'opacity', 'borderColor', 'boxShadow'])('treats a %s difference as distinct', (property) => {
    expect(isIndistinct({ ...base, [property]: 'different' }, base)).toBe(false)
  })

  it('flags small and browser-default attribution, and accepts a styled one', () => {
    const ok = { fontSize: 13, color: 'rgb(170, 170, 170)', fontFamily: 'ui-monospace, monospace' }
    expect(attributionProblems(ok)).toEqual([])
    expect(attributionProblems({ ...ok, fontSize: 10.9 })).toHaveLength(1)
    expect(attributionProblems({ ...ok, fontSize: 11 })).toEqual([])
    const ua = { fontSize: 16, color: 'rgb(0, 0, 238)', fontFamily: '"Times New Roman"' }
    expect(attributionProblems(ua)[0]).toMatch(/browser-default/)
    expect(attributionProblems({ ...ua, fontFamily: 'Times' })).toHaveLength(1)
    expect(attributionProblems({ ...ua, fontFamily: 'Inter, serif' })).toEqual([])
    expect(attributionProblems({ ...ua, color: 'rgb(200, 0, 0)' })).toEqual([])
  })

  it('reports a missing attribution link, naming the hook', () => {
    const warnings = stepWarnings(2, { items: [], progress: null, toc: null, attribution: null })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/step 2: attribution no attribution link/)
    expect(warnings[0]).toMatch(/data-presentation-attribution/)
  })
})

describe('stepWarnings', () => {
  const styled = { fontSize: 13, color: 'rgb(9, 9, 9)', fontFamily: 'monospace' }
  const same = { color: 'a', backgroundColor: 'b', fontWeight: '400', opacity: '1', borderColor: 'c', boxShadow: 'none' }

  it('is silent for a clean step', () => {
    expect(stepWarnings(1, { items: [item(1, 0, 0, 5, 5)], progress: { active: { ...same, color: 'x' }, inactive: same }, toc: null, attribution: styled })).toEqual([])
  })

  it('names the step and both overlapping elements, and the allow-overlap marker', () => {
    const warnings = stepWarnings(3, {
      items: [item(1, 0, 0, 10, 10, { text: 'Hello' }), item(2, 5, 5, 10, 10, { text: 'World' })],
      progress: null,
      toc: null,
      attribution: styled,
    })
    expect(warnings).toEqual([expect.stringMatching(/^warning: step 3: el1 "Hello" overlaps el2 "World".*data-presentation-allow-overlap/)])
  })

  it('reports indistinct progress and ToC chrome separately', () => {
    const warnings = stepWarnings(4, { items: [], progress: { active: same, inactive: same }, toc: { active: same, inactive: same }, attribution: styled })
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toMatch(/step 4: active progress/)
    expect(warnings[1]).toMatch(/step 4: active table-of-contents/)
  })
})
