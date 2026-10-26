// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { assertPresentationSlug, inspectStep } from './inspection-diagnostics.mjs'

describe('inspection diagnostics', () => {
  test('INT-002 reports accidental defects but exempts a marked composition', () => {
    const warnings = inspectStep({
      activeStyles: [{ active: 'same', inactive: 'same' }],
      attribution: { browserDefault: true, fontSize: 11, present: true },
      elements: [
        { id: 'caption', overlapRegion: null, rect: { bottom: 40, left: 0, right: 100, top: 0 } },
        { id: 'next', overlapRegion: null, rect: { bottom: 60, left: 50, right: 150, top: 20 } },
        { id: 'intentional-a', overlapRegion: 'region-1', rect: { bottom: 40, left: 200, right: 300, top: 0 } },
        { id: 'intentional-b', overlapRegion: 'region-1', rect: { bottom: 50, left: 220, right: 320, top: 10 } },
        { id: 'unrelated-a', overlapRegion: 'region-2', rect: { bottom: 40, left: 400, right: 500, top: 0 } },
        { id: 'unrelated-b', overlapRegion: 'region-3', rect: { bottom: 50, left: 420, right: 520, top: 10 } },
      ],
    })

    expect(warnings).toContain('overlap: caption and next')
    expect(warnings).toContain('active chrome is visually indistinct')
    expect(warnings).toContain('attribution is browser-default or undersized')
    expect(warnings).toContain('overlap: unrelated-a and unrelated-b')
    expect(warnings.join('\n')).not.toContain('intentional-a')
  })

  test('rejects screenshot artifact paths outside the presentation slug format', () => {
    expect(() => assertPresentationSlug('../../report')).toThrow('invalid presentation slug')
    expect(assertPresentationSlug('how-to-make-a-presentation')).toBe('how-to-make-a-presentation')
  })
})
