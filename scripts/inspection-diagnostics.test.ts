// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { assertPresentationSlug, inspectStep } from './inspection-diagnostics.mjs'

describe('inspection diagnostics', () => {
  test('INT-002 reports accidental defects but exempts a marked composition', () => {
    const warnings = inspectStep({
      activeStyles: [{ active: 'same', inactive: 'same' }],
      attribution: { browserDefault: true, fontSize: 11, present: true },
      elements: [
        { allowOverlap: false, id: 'caption', rect: { bottom: 40, left: 0, right: 100, top: 0 } },
        { allowOverlap: false, id: 'next', rect: { bottom: 60, left: 50, right: 150, top: 20 } },
        { allowOverlap: true, id: 'intentional-a', rect: { bottom: 40, left: 200, right: 300, top: 0 } },
        { allowOverlap: true, id: 'intentional-b', rect: { bottom: 50, left: 220, right: 320, top: 10 } },
      ],
    })

    expect(warnings).toContain('overlap: caption and next')
    expect(warnings).toContain('active chrome is visually indistinct')
    expect(warnings).toContain('attribution is browser-default or undersized')
    expect(warnings.join('\n')).not.toContain('intentional-a')
  })

  test('rejects screenshot artifact paths outside the presentation slug format', () => {
    expect(() => assertPresentationSlug('../../report')).toThrow('invalid presentation slug')
    expect(assertPresentationSlug('how-to-make-a-presentation')).toBe('how-to-make-a-presentation')
  })
})
