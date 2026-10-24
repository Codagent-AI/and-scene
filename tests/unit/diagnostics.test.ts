import { describe, expect, it } from 'vitest'
import { ENTER_DELAY, ENTER_T } from '../../src/presentation-kit/index.ts'
import {
  DEFAULT_SETTLE_MS,
  attributionIssues,
  captureSequence,
  findOverlaps,
  isIndistinct,
  legibilityIssue,
  rectsOverlap,
  screenshotPath,
  stepWarnings,
} from '../../scripts/lib/inspect-diagnostics.mjs'

const el = (uid: number, name: string, x: number, y: number, w: number, h: number, extra: object = {}) => ({
  uid, name, rect: { x, y, w, h }, allow: false, ancestors: [] as number[], ...extra,
})

describe('screenshot paths (M-68)', () => {
  it('are predictable, one-based, zero-padded, per slug and per variant', () => {
    expect(screenshotPath('.inspection', 'deck', 0)).toBe('.inspection/deck/step-01.png')
    expect(screenshotPath('.inspection', 'deck', 11)).toBe('.inspection/deck/step-12.png')
    expect(screenshotPath('out', 'other', 2, 'narrow')).toBe('out/other/narrow/step-03.png')
    const paths = [0, 1, 2, 3].map((i) => screenshotPath('o', 'a', i))
    expect(new Set(paths).size).toBe(4)
    expect(screenshotPath('o', 'a', 0)).not.toBe(screenshotPath('o', 'b', 0))
  })
})

describe('settled capture sequencing (M-69)', () => {
  it('waits the settle interval after every advance, including the first step, before capturing', async () => {
    const events: string[] = []
    await captureSequence({
      count: 3,
      settleMs: 1234,
      advance: async (i: number) => void events.push(`advance:${i}`),
      sleep: async (ms: number) => void events.push(`sleep:${ms}`),
      capture: async (i: number) => void events.push(`capture:${i}`),
    })
    expect(events).toEqual([
      'advance:0', 'sleep:1234', 'capture:0',
      'advance:1', 'sleep:1234', 'capture:1',
      'advance:2', 'sleep:1234', 'capture:2',
    ])
  })

  it('never captures before the clock has advanced by the configured interval', async () => {
    let now = 0
    const captured: number[] = []
    await captureSequence({
      count: 2,
      settleMs: 500,
      advance: async () => void (now += 10), // a navigation takes 10ms
      sleep: async (ms: number) => void (now += ms),
      capture: async () => void captured.push(now),
    })
    expect(captured).toEqual([510, 1020])
  })

  it('defaults to longer than the kit morph plus enter animation', () => {
    expect(DEFAULT_SETTLE_MS).toBeGreaterThan((ENTER_DELAY + ENTER_T) * 1000)
  })
})

describe('overlap detection (M-70, M-71)', () => {
  it('reports only genuinely intersecting visible text and chrome, naming both', () => {
    const found = findOverlaps([
      el(0, 'caption', 0, 100, 300, 20),
      el(1, 'next-button', 280, 105, 20, 20), // overlaps the caption
      el(2, 'toc', 400, 0, 50, 300), // separate
      el(3, 'touching', 300, 100, 10, 20), // shares an edge only with caption
    ])
    expect(found).toEqual([['caption', 'next-button']])
  })

  it('treats edge contact and sub-pixel slivers as no collision', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false)
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9.5, y: 0, w: 10, h: 10 })).toBe(false)
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 8, y: 8, w: 10, h: 10 })).toBe(true)
  })

  it('ignores nesting pairs but still catches wrapped sibling text', () => {
    const found = findOverlaps([
      el(0, 'button', 0, 0, 100, 40),
      el(1, 'button-label', 10, 10, 50, 20, { ancestors: [0] }),
      el(2, 'sibling-line-1', 0, 100, 100, 18),
      el(3, 'sibling-line-2', 0, 110, 100, 18),
    ])
    expect(found).toEqual([['sibling-line-1', 'sibling-line-2']])
  })

  it('exempts allow-overlap descendants without a page-wide bypass', () => {
    const found = findOverlaps([
      el(0, 'allowed-a', 0, 0, 100, 40, { allow: true }),
      el(1, 'allowed-b', 20, 10, 100, 40, { allow: true }),
      el(2, 'unmarked-a', 300, 300, 100, 40),
      el(3, 'unmarked-b', 320, 310, 100, 40),
    ])
    expect(found).toEqual([['unmarked-a', 'unmarked-b']])
  })
})

const style = (overrides: object = {}) => ({
  color: 'rgb(255, 255, 255)', backgroundColor: 'rgba(0, 0, 0, 0)', borderColor: 'rgb(1, 1, 1)', borderWidth: '1px',
  width: '12px', height: '12px', transform: 'none', opacity: '1', fontWeight: '400', textDecorationLine: 'none',
  boxShadow: 'none', outlineStyle: 'none', ...overrides,
})

describe('indistinct active chrome (M-72)', () => {
  it('flags identical computed styles and accepts any real visual difference', () => {
    expect(isIndistinct(style(), style(), 'progress')).toBe(true)
    for (const diff of [{ backgroundColor: 'rgb(9, 9, 9)' }, { transform: 'scale(1.5)' }, { fontWeight: '700' }, { borderColor: 'rgb(2, 2, 2)' }, { opacity: '0.5' }]) {
      expect(isIndistinct(style(diff), style(), 'toc'), JSON.stringify(diff)).toBe(false)
      expect(isIndistinct(style(diff), style(), 'progress'), JSON.stringify(diff)).toBe(false)
    }
    // dots have identical content, so a size change is a cue; ToC entries differ in text length
    expect(isIndistinct(style({ width: '20px' }), style(), 'progress')).toBe(false)
    expect(isIndistinct(style({ width: '90px', height: '30px' }), style(), 'toc')).toBe(true)
  })

  it('reports progress and ToC separately with the step number and the hook to style', () => {
    const snapshot = { elements: [], attribution: { fontSize: 14, color: 'rgb(200, 200, 200)' }, active: { progress: { active: style(), inactive: style() }, toc: { active: style({ fontWeight: '700' }), inactive: style() } } }
    const warnings = stepWarnings(4, snapshot)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/^WARN step 4 \[active-progress\]/)
    expect(warnings[0]).toContain('data-presentation-active')
    expect(stepWarnings(2, { ...snapshot, active: { progress: null, toc: null } })).toEqual([])
  })
})

describe('attribution diagnostics (M-73, C-02)', () => {
  it('flags small text, the browser-default link color, and a missing link; accepts polished styling', () => {
    expect(attributionIssues({ fontSize: 14, color: 'rgb(200, 200, 200)' })).toEqual([])
    expect(attributionIssues({ fontSize: 10, color: 'rgb(200, 200, 200)' })).toEqual(['is too small (10px)'])
    expect(attributionIssues({ fontSize: 14, color: 'rgb(0, 0, 238)' })).toEqual(['uses the browser-default link color'])
    expect(attributionIssues({ fontSize: 8, color: 'rgb(0, 0, 238)' })).toHaveLength(2)
    expect(attributionIssues(null)).toEqual(['is missing'])
    expect(attributionIssues({ fontSize: 11, color: 'rgb(1, 2, 3)' })).toEqual([]) // boundary: 11px is enough
  })

  it('points authors to the attribution hook with the step number', () => {
    const warnings = stepWarnings(7, { elements: [], active: {}, attribution: null })
    expect(warnings).toEqual(['WARN step 7 [attribution] attribution link is missing; style [data-presentation-attribution]'])
  })
})

describe('step warnings combine all categories (M-70)', () => {
  it('names the step and both elements for an overlap', () => {
    const warnings = stepWarnings(3, { elements: [el(0, 'p "a"', 0, 0, 50, 50), el(1, 'h1 "b"', 10, 10, 50, 50)], active: {}, attribution: { fontSize: 13, color: 'rgb(9, 9, 9)' } })
    expect(warnings).toEqual(['WARN step 3 [overlap] p "a" overlaps h1 "b"'])
  })
})

describe('legibility diagnostics (F-001)', () => {
  const small = { scale: 0.39, smallest: { name: 'span "caption"', px: 4.3 }, count: 12 }

  it('flags scene text that the fit scale renders under 8px, naming the smallest element and scale', () => {
    const issue = legibilityIssue(small)!
    expect(issue).toContain('12 element(s)')
    expect(issue).toContain('span "caption"')
    expect(issue).toContain('4.3px')
    expect(issue).toContain('0.39')
  })

  it('accepts readable text, a missing snapshot field, and the 8px boundary', () => {
    expect(legibilityIssue({ scale: 1.1, smallest: { name: 'x', px: 11 }, count: 0 })).toBeNull()
    expect(legibilityIssue({ scale: 0.8, smallest: { name: 'x', px: 8 }, count: 0 })).toBeNull()
    expect(legibilityIssue(null)).toBeNull()
    expect(legibilityIssue(undefined)).toBeNull()
  })

  it('adds an advisory [legibility] warning with the step number, and nothing when text is readable', () => {
    const base = { elements: [], active: {}, attribution: { fontSize: 13, color: 'rgb(9, 9, 9)' } }
    const warnings = stepWarnings(9, { ...base, legibility: small })
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/^WARN step 9 \[legibility\] scene text is too small to read/)
    expect(stepWarnings(9, { ...base, legibility: { scale: 1, smallest: { name: 'x', px: 12 }, count: 0 } })).toEqual([])
  })
})
