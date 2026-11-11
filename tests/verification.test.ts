import { describe, expect, it } from 'vitest'
// Runtime scripts are shipped JavaScript, imported directly to test the distributed code.
// @ts-expect-error JavaScript script modules intentionally have no separate declaration files.
import { diagnose, rectanglesOverlap } from '../scripts/diagnostics.mjs'
// @ts-expect-error JavaScript script modules intentionally have no separate declaration files.
import { REFERENCE_STEPS, validateReferenceStep, validateStepCount } from '../scripts/reference.mjs'

describe('verification validation', () => {
  it('validates canonical count and every normative title/caption in order', () => {
    expect(validateStepCount('9', true)).toBe(9)
    REFERENCE_STEPS.forEach((step: string[], index: number) => expect(() => validateReferenceStep(index, { title: step[1], caption: step[2] })).not.toThrow())
    expect(() => validateReferenceStep(0, { title: REFERENCE_STEPS[1][1], caption: REFERENCE_STEPS[1][2] })).toThrow(/sample step 0/)
    expect(() => validateReferenceStep(9, {})).toThrow(/sample step 9/)
    expect(() => validateReferenceStep(0, { title: REFERENCE_STEPS[0][1], caption: 'wrong' })).toThrow(/sample step 0/)
  })
  it('rejects missing, malformed, and noncanonical counts', () => {
    for (const value of [null, '', 'no', 0, -1, 2.5, Infinity]) expect(() => validateStepCount(value)).toThrow(/invalid step count/)
    expect(() => validateStepCount(8, true)).toThrow(/invalid step count/)
    expect(validateStepCount(2)).toBe(2)
  })
})

const rect = { left: 0, top: 0, right: 30, bottom: 20 }
const polished = { fontSize: 14, browserDefault: false }

describe('inspection diagnostics', () => {
  it('reports overlapping distinct text and excludes same-owner or explicitly allowed subtree pairs', () => {
    const text = [{ owner: 1, label: 'one', rect }, { owner: 2, label: 'two', rect }]
    expect(diagnose({ text, attribution: polished })).toEqual(['overlap: one / two'])
    expect(diagnose({ text: text.map((item) => ({ ...item, allowed: 42 })), attribution: polished })).toEqual([])
    expect(diagnose({ text: text.map((item) => ({ ...item, owner: 1 })), attribution: polished })).toEqual([])
    expect(diagnose({ text: [{ ...text[0], allowed: 42 }, text[1]], attribution: polished })).toEqual(['overlap: one / two'])
    expect(rectanglesOverlap(rect, { left: 30, top: 0, right: 60, bottom: 20 })).toBe(false)
    expect(rectanglesOverlap(rect, { left: 29.5, top: 0, right: 60, bottom: 20 })).toBe(false)
  })
  it('reports indistinct active progress and table-of-contents controls only', () => {
    for (const kind of ['progress', 'toc']) {
      const chrome = [{ kind, active: true, appearance: 'same' }, { kind, active: false, appearance: 'same' }]
      expect(diagnose({ chrome, attribution: polished })[0]).toContain(`indistinct active ${kind}`)
      chrome[0].appearance = 'different'
      expect(diagnose({ chrome, attribution: polished })).toEqual([])
    }
    expect(diagnose({ chrome: [{ kind: 'toc', active: true, appearance: 'only' }], attribution: polished })).toEqual([])
  })
  it('warns on missing, browser-default, and undersized attribution, allowing legible local styling', () => {
    for (const attribution of [null, { fontSize: 11, browserDefault: false }, { fontSize: 16, browserDefault: true }]) {
      expect(diagnose({ attribution })).toEqual(['attribution: style [data-presentation-attribution] for a legible, intentional link'])
    }
    expect(diagnose({ attribution: polished })).toEqual([])
  })
})
