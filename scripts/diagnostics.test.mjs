import { describe, expect, it } from 'vitest'
import {
  evaluateActiveChrome,
  evaluateAttribution,
  evaluateOverlaps,
  warningsForSnapshot,
} from './lib/diagnostics.mjs'
import { parseArgs, stepFileName } from './inspect-presentation.mjs'

const el = (uid, x, y, extra = {}) => ({
  uid,
  label: `el${uid}`,
  rect: { x, y, w: 100, h: 20 },
  allowed: false,
  ancestors: [],
  ...extra,
})

describe('evaluateOverlaps', () => {
  it('flags unmarked overlap', () => {
    expect(evaluateOverlaps([el(1, 0, 0), el(2, 10, 5)])).toEqual([{ a: 'el1', b: 'el2' }])
  })
  it('ignores disjoint, allowed, and nested elements', () => {
    expect(evaluateOverlaps([el(1, 0, 0), el(2, 0, 40)])).toEqual([])
    expect(evaluateOverlaps([el(1, 0, 0), el(2, 10, 5, { allowed: true })])).toEqual([])
    expect(evaluateOverlaps([el(1, 0, 0), el(2, 10, 5, { ancestors: [1] })])).toEqual([])
  })
})

const style = (over = {}) => ({
  backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)', borderTopColor: 'rgb(0, 0, 0)',
  borderLeftColor: 'rgb(0, 0, 0)', outlineColor: 'rgb(0, 0, 0)', width: '12px', height: '12px',
  fontWeight: '400', opacity: '1', boxShadow: 'none', textDecorationLine: 'none', transform: 'none',
  borderTopWidth: '1px', borderLeftWidth: '1px', ...over,
})

describe('evaluateActiveChrome', () => {
  const group = (activeStyle) => [{
    name: 'progress',
    items: [
      { label: 'a', active: true, style: activeStyle },
      { label: 'b', active: false, style: style() },
    ],
  }]
  it('flags identical active/inactive styles', () => {
    expect(evaluateActiveChrome(group(style()))).toHaveLength(1)
  })
  it('accepts a distinct active style', () => {
    expect(evaluateActiveChrome(group(style({ backgroundColor: 'rgb(224, 185, 79)' })))).toEqual([])
    expect(evaluateActiveChrome(group(style({ width: '28px' })))).toEqual([])
  })
})

describe('evaluateAttribution', () => {
  const attr = (s, h = 16) => ({ label: 'a', style: { fontSize: '13px', color: 'rgb(224, 185, 79)', textDecorationLine: 'none', ...s }, rect: { w: 100, h } })
  it('passes a polished link and ignores a missing one', () => {
    expect(evaluateAttribution(attr({}))).toEqual([])
    expect(evaluateAttribution(null)).toEqual([])
  })
  it('flags tiny and browser-default links', () => {
    expect(evaluateAttribution(attr({ fontSize: '9px' }, 11))).toHaveLength(1)
    expect(evaluateAttribution(attr({ color: 'rgb(0, 0, 238)', textDecorationLine: 'underline' }))).toHaveLength(1)
  })
  it('points to the styling hook in warnings', () => {
    const lines = warningsForSnapshot(2, { elements: [], chromeGroups: [], attribution: attr({ fontSize: '8px' }, 10) })
    expect(lines[0]).toMatch(/^WARN step 2: .*\[data-presentation-attribution\]/)
  })
})

describe('inspect args', () => {
  it('parses options and file names', () => {
    expect(parseArgs(['demo', '--settle', '50', '--viewport', '390x844', '--skip-build'])).toMatchObject({
      slug: 'demo', settle: 50, viewport: { width: 390, height: 844 }, build: false,
    })
    expect(stepFileName(0)).toBe('step-01.png')
    expect(() => parseArgs([])).toThrow(/usage/)
  })
})
