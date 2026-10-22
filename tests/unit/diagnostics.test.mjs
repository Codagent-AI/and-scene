// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  ACTIVE_STYLE_PROPS,
  ATTRIBUTION_HOOK,
  MIN_ATTRIBUTION_FONT_PX,
  classifyAttribution,
  differingProps,
  findOverlaps,
  isIndistinct,
  screenshotName,
  warningsForStep,
} from '../../scripts/lib/diagnostics.mjs'

const el = (id, x, y, w, h, extra = {}) => ({ id, label: `el${id}`, rect: { x, y, w, h }, visible: true, allowed: false, ancestors: [], ...extra })

describe('findOverlaps', () => {
  it('reports truly intersecting visible elements with both identities', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 20), el(2, 50, 10, 100, 20)])).toEqual([['el1', 'el2']])
  })

  it('ignores separated and merely touching rectangles', () => {
    expect(findOverlaps([el(1, 0, 0, 10, 10), el(2, 20, 0, 10, 10)])).toEqual([])
    expect(findOverlaps([el(1, 0, 0, 10, 10), el(2, 10, 0, 10, 10)])).toEqual([])
  })

  it('ignores invisible and zero-area elements', () => {
    expect(findOverlaps([el(1, 0, 0, 10, 10), el(2, 0, 0, 10, 10, { visible: false })])).toEqual([])
    expect(findOverlaps([el(1, 0, 0, 10, 10), el(2, 0, 0, 0, 10)])).toEqual([])
  })

  it('does not treat a container and its own content as a collision', () => {
    expect(findOverlaps([el(1, 0, 0, 100, 100), el(2, 10, 10, 20, 20, { ancestors: [1] })])).toEqual([])
  })

  it('suppresses overlaps involving an element inside an allow-overlap subtree only', () => {
    const elements = [el(1, 0, 0, 50, 50, { allowed: true }), el(2, 25, 25, 50, 50), el(3, 30, 30, 50, 50)]
    expect(findOverlaps(elements)).toEqual([['el2', 'el3']])
  })
})

const style = (over = {}) => ({
  backgroundColor: 'rgb(10, 10, 10)',
  color: 'rgb(200, 200, 200)',
  borderColor: 'rgb(60, 60, 60)',
  opacity: '1',
  fontWeight: '400',
  outline: 'none 0px rgb(0, 0, 0)',
  boxShadow: 'none',
  transform: 'none',
  width: '12px',
  height: '12px',
  ...over,
})

describe('active chrome comparison', () => {
  it('is indistinct when computed styles are equal or within tolerance', () => {
    expect(isIndistinct(style(), style())).toBe(true)
    expect(isIndistinct(style(), style({ backgroundColor: 'rgb(14, 12, 10)', opacity: '0.98', width: '12.3px' }))).toBe(true)
  })

  it.each([
    ['backgroundColor', 'rgb(242, 184, 75)'],
    ['color', 'rgb(255, 255, 255)'],
    ['borderColor', 'rgb(242, 184, 75)'],
    ['opacity', '0.5'],
    ['fontWeight', '700'],
    ['outline', 'solid 2px rgb(255, 0, 0)'],
    ['boxShadow', 'rgb(0, 0, 0) 0px 0px 4px'],
    ['transform', 'matrix(1.5, 0, 0, 1.5, 0, 0)'],
    ['width', '20px'],
    ['height', '20px'],
  ])('is distinct when only %s differs', (prop, value) => {
    expect(isIndistinct(style(), style({ [prop]: value }))).toBe(false)
    expect(differingProps(style(), style({ [prop]: value }))).toEqual([prop])
  })

  it('covers every property the lead ruling lists', () => {
    expect(ACTIVE_STYLE_PROPS).toHaveLength(10)
  })
})

describe('classifyAttribution', () => {
  const polished = { fontSizePx: 12, color: 'rgb(201, 194, 176)', textDecorationLine: 'none', fontFamily: 'Inter', parentFontFamily: 'Georgia' }

  it('accepts a legible, deliberately styled attribution', () => {
    expect(classifyAttribution(polished)).toBeNull()
  })

  it('flags text below the size threshold but not at it', () => {
    expect(classifyAttribution({ ...polished, fontSizePx: MIN_ATTRIBUTION_FONT_PX - 0.5 })).toBe('small')
    expect(classifyAttribution({ ...polished, fontSizePx: MIN_ATTRIBUTION_FONT_PX })).toBeNull()
  })

  it('flags the browser-default link treatment (blue, underlined, inherited font)', () => {
    const base = { fontSizePx: 16, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline', fontFamily: 'Inter', parentFontFamily: 'Inter' }
    expect(classifyAttribution(base)).toBe('browser-default')
  })

  it('does not call it browser-default when any author choice is present', () => {
    const base = { fontSizePx: 16, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline', fontFamily: 'Inter', parentFontFamily: 'Inter' }
    expect(classifyAttribution({ ...base, color: 'rgb(242, 184, 75)' })).toBeNull()
    expect(classifyAttribution({ ...base, textDecorationLine: 'none' })).toBeNull()
    expect(classifyAttribution({ ...base, fontFamily: 'Georgia' })).toBeNull()
  })

  it('reports a missing attribution', () => {
    expect(classifyAttribution(null)).toBe('missing')
  })
})

describe('warningsForStep', () => {
  const base = { elements: [], activeChrome: [], attribution: { fontSizePx: 12, color: 'rgb(1, 2, 3)', textDecorationLine: 'none', fontFamily: 'a', parentFontFamily: 'b' } }

  it('is silent for a clean step', () => {
    expect(warningsForStep(3, base)).toEqual([])
  })

  it('names the step and both elements for an overlap', () => {
    const [line] = warningsForStep(4, { ...base, elements: [el(1, 0, 0, 20, 20), el(2, 5, 5, 20, 20)] })
    expect(line).toMatch(/^WARN step 4 overlap: el1 overlaps el2/)
  })

  it('names the chrome for indistinct active state, skipping chrome with no inactive sibling', () => {
    const lines = warningsForStep(1, {
      ...base,
      activeChrome: [
        { name: 'progress indicator', active: style(), inactive: style() },
        { name: 'table-of-contents entry', active: style(), inactive: null },
      ],
    })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^WARN step 1 active-chrome: active progress indicator/)
  })

  it('points authors to the attribution hook for small, default and missing attribution', () => {
    for (const attribution of [
      { ...base.attribution, fontSizePx: 9 },
      { fontSizePx: 16, color: 'rgb(0, 0, 238)', textDecorationLine: 'underline', fontFamily: 'a', parentFontFamily: 'a' },
      null,
    ]) {
      const [line] = warningsForStep(2, { ...base, attribution })
      expect(line).toMatch(/^WARN step 2 attribution:/)
      expect(line).toContain(`[${ATTRIBUTION_HOOK}]`)
    }
  })

  it('names screenshots by zero-padded step index', () => {
    expect(screenshotName(0)).toBe('step-00.png')
    expect(screenshotName(12)).toBe('step-12.png')
  })
})
