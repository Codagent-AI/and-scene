import { describe, expect, it } from 'vitest'
import { activeEraIndex, clampIndex, eraEntries, sceneKey, stepNumber } from '../../src/presentation-kit'
import { computeScale, DESIGN_H, DESIGN_W, STAGE_LAYOUT } from '../../src/presentation-kit'
import type { AnyStep } from '../../src/presentation-kit'

const eras = [{ era: 'a' }, { era: 'a' }, { era: 'b' }, { era: 'c' }, { era: 'c' }]

describe('step model', () => {
  it('derives step numbers from position', () => {
    expect([0, 1, 2].map(stepNumber)).toEqual([1, 2, 3])
    const reordered = [...eras].reverse()
    expect(reordered.map((_, i) => stepNumber(i))).toEqual([1, 2, 3, 4, 5])
  })

  it('clamps indices at both ends', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(9, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
  })

  it('groups consecutive eras into table-of-contents entries', () => {
    const entries = eraEntries(eras)
    expect(entries).toEqual([
      { era: 'a', start: 0 },
      { era: 'b', start: 2 },
      { era: 'c', start: 3 },
    ])
    expect([0, 1, 2, 3, 4].map((i) => activeEraIndex(entries, i))).toEqual([0, 0, 1, 2, 2])
  })

  it('shares one scene key across a group and separates ungrouped steps', () => {
    const base = { era: 'e', title: 't', caption: 'c', Scene: () => null, payload: undefined }
    const a: AnyStep = { ...base, id: 'a', groupKey: 'g' }
    const b: AnyStep = { ...base, id: 'b', groupKey: 'g' }
    const c: AnyStep = { ...base, id: 'c' }
    expect(sceneKey(a)).toBe(sceneKey(b))
    expect(sceneKey(c)).toBe('c')
    expect(sceneKey(c)).not.toBe(sceneKey(a))
  })
})

describe('fit scaling', () => {
  it('defaults the design canvas to 880 × 380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })

  it('scales uniformly by the limiting dimension', () => {
    const g = STAGE_LAYOUT.browse
    const wide = computeScale(4000, 600, g)
    const tall = computeScale(600, 4000, g)
    expect(wide).toBeCloseTo((600 - g.top - g.bottom) / DESIGN_H)
    expect(tall).toBeCloseTo((600 - g.side * 2) / DESIGN_W)
  })

  it('never collapses below the minimum scale', () => {
    expect(computeScale(10, 10, STAGE_LAYOUT.present)).toBeGreaterThan(0)
  })

  it('uses per-mode geometry', () => {
    expect(computeScale(1280, 720, STAGE_LAYOUT.present)).toBeGreaterThan(computeScale(1280, 720, STAGE_LAYOUT.browse))
  })
})
