import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LINK_COLOR,
  MIN_ATTRIBUTION_FONT_PX,
  attributionWarning,
  chromeWarning,
  indistinctActive,
  overlapWarnings,
  rectsIntersect,
  stepWarnings,
} from '../../scripts/lib/diagnostics.mjs'

const item = (idx, label, rect, ancestors = []) => ({ idx, label, rect, ancestors })

describe('rectsIntersect', () => {
  it('detects real overlap and ignores touching edges and sub-pixel slivers', () => {
    expect(rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true)
    expect(rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false)
    expect(rectsIntersect({ x: 0, y: 0, width: 10, height: 10 }, { x: 9.5, y: 0, width: 10, height: 10 })).toBe(false)
    expect(rectsIntersect({ x: 0, y: 0, width: 0, height: 0 }, { x: 0, y: 0, width: 10, height: 10 })).toBe(false)
  })
})

describe('overlapWarnings', () => {
  it('reports an unmarked collision with the step and both elements', () => {
    const warnings = overlapWarnings(2, [
      item(0, 'alpha', { x: 0, y: 0, width: 50, height: 20 }),
      item(1, 'beta', { x: 20, y: 5, width: 50, height: 20 }),
    ])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({ step: 2, kind: 'overlap', elements: ['alpha', 'beta'] })
    expect(warnings[0].message).toContain('step 2')
  })

  it('does not report a container with its child', () => {
    const warnings = overlapWarnings(1, [
      item(0, 'card', { x: 0, y: 0, width: 100, height: 100 }),
      item(1, 'title', { x: 10, y: 10, width: 60, height: 20 }, [0]),
    ])
    expect(warnings).toEqual([])
  })

  it('reports nothing for separated items', () => {
    expect(
      overlapWarnings(1, [item(0, 'a', { x: 0, y: 0, width: 10, height: 10 }), item(1, 'b', { x: 50, y: 50, width: 10, height: 10 })]),
    ).toEqual([])
  })
})

describe('indistinctActive', () => {
  const plain = { color: 'rgb(1, 1, 1)', backgroundColor: 'rgba(0, 0, 0, 0)', borderColor: 'rgb(9, 9, 9)', borderWidth: '1px', fontWeight: '400', transform: 'none', textDecorationLine: 'none', boxShadow: 'none' }

  it('is true when only the semantic attribute differs', () => {
    expect(indistinctActive({ ...plain }, { ...plain })).toBe(true)
  })

  it('is false when the active item has a visible difference', () => {
    expect(indistinctActive({ ...plain, backgroundColor: 'rgb(200, 160, 80)' }, plain)).toBe(false)
    expect(indistinctActive({ ...plain, transform: 'matrix(1.4, 0, 0, 1.4, 0, 0)' }, plain)).toBe(false)
  })
})

describe('attributionWarning', () => {
  it('reports a missing attribution by its hook', () => {
    const warning = attributionWarning(3, { present: false, fontSizePx: 0, color: '' })
    expect(warning.message).toContain('data-presentation-attribution')
    expect(warning.step).toBe(3)
  })

  it('reports small or browser-default attribution', () => {
    expect(attributionWarning(1, { present: true, fontSizePx: MIN_ATTRIBUTION_FONT_PX - 1, color: 'rgb(1, 2, 3)' })).not.toBeNull()
    expect(attributionWarning(1, { present: true, fontSizePx: 16, color: DEFAULT_LINK_COLOR })).not.toBeNull()
  })

  it('accepts a legible, styled attribution', () => {
    expect(attributionWarning(1, { present: true, fontSizePx: 13, color: 'rgb(199, 167, 85)' })).toBeNull()
  })
})

describe('chromeWarning', () => {
  it('names the affected control and the styling hook', () => {
    const warning = chromeWarning(4, 'progress indicator')
    expect(warning.message).toContain('step 4')
    expect(warning.message).toContain('progress indicator')
    expect(warning.message).toContain('data-presentation-active')
  })
})

describe('stepWarnings entry point', () => {
  it('reports a missing attribution for its step without crashing on a null attribution', () => {
    const diagnostics = { items: [], progress: null, toc: null, attribution: { present: false, fontSizePx: 0, color: '' } }
    const warnings = stepWarnings(4, diagnostics)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].step).toBe(4)
    expect(warnings[0].message).toContain('data-presentation-attribution')
  })

  it('returns nothing when no presentation was mounted', () => {
    expect(stepWarnings(1, null)).toEqual([])
  })
})

describe('table-of-contents diagnostics', () => {
  const same = { color: 'rgb(1, 1, 1)', backgroundColor: 'rgba(0, 0, 0, 0)', borderColor: 'rgb(9, 9, 9)', borderWidth: '1px', fontWeight: '400', transform: 'none', textDecorationLine: 'none', boxShadow: 'none' }
  const attribution = { present: true, fontSizePx: 14, color: 'rgb(199, 167, 85)' }

  it('warns about an indistinct active table-of-contents entry, naming the step and the entry', () => {
    const warnings = stepWarnings(2, { items: [], progress: null, toc: { active: { ...same }, inactive: { ...same } }, attribution })
    expect(warnings).toHaveLength(1)
    expect(warnings[0].message).toContain('step 2')
    expect(warnings[0].message).toContain('table-of-contents entry')
  })

  it('stays silent when the active table-of-contents entry is visibly distinct', () => {
    const warnings = stepWarnings(2, {
      items: [],
      progress: null,
      toc: { active: { ...same, color: 'rgb(199, 167, 85)' }, inactive: { ...same } },
      attribution,
    })
    expect(warnings).toEqual([])
  })
})

