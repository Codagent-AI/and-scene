import { describe, expect, it } from 'vitest'
import {
  DESIGN_H,
  DESIGN_W,
  ENTER_DELAY,
  LAYOUT_T,
  MIN_SCALE,
  SETTLE_MS,
  STAGE_LAYOUT,
} from '../constants.ts'
import { computeScale } from '../useFitScale.ts'
import { buildSections, formatMarker, sceneKey } from '../sections.ts'

describe('fixed canvas', () => {
  it('defaults to 880 × 380 with browse and present geometry', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })

  it('lets newcomers wait for layout morphs and settles after every transition', () => {
    expect(ENTER_DELAY).toBeGreaterThanOrEqual(LAYOUT_T)
    expect(SETTLE_MS).toBeGreaterThan((ENTER_DELAY + 0.5) * 1000)
  })
})

describe('computeScale', () => {
  it('fits the canvas uniformly in both modes', () => {
    for (const mode of ['browse', 'present'] as const) {
      const { padX, padY } = STAGE_LAYOUT[mode]
      const wide = computeScale(1760 + 2 * padX, 2000, mode)
      expect(wide).toBeCloseTo(2)
      expect(wide * DESIGN_W).toBeLessThanOrEqual(1760 + 0.001)
      const tall = computeScale(4000, 190 + 2 * padY, mode)
      expect(tall).toBeCloseTo(0.5)
      expect(tall * DESIGN_H).toBeLessThanOrEqual(190 + 0.001)
    }
  })

  it('never drops below MIN_SCALE and has no upper cap', () => {
    expect(computeScale(0, 0, 'browse')).toBe(MIN_SCALE)
    expect(computeScale(10000, 10000, 'present')).toBeGreaterThan(5)
  })
})

describe('sections and identity', () => {
  it('groups consecutive steps sharing an era into one section', () => {
    const steps = [{ era: 'a' }, { era: 'a' }, { era: 'b' }, { era: 'a' }]
    expect(buildSections(steps)).toEqual([
      { era: 'a', firstIndex: 0, lastIndex: 1 },
      { era: 'b', firstIndex: 2, lastIndex: 2 },
      { era: 'a', firstIndex: 3, lastIndex: 3 },
    ])
  })

  it('derives markers from position', () => {
    expect(formatMarker(0)).toBe('01')
    expect(formatMarker(11)).toBe('12')
  })

  it('shares a scene key across a group with one Scene and separates other steps', () => {
    const A = () => null
    const B = () => null
    expect(sceneKey({ id: 'a', groupKey: 'g', Scene: A })).toBe(sceneKey({ id: 'b', groupKey: 'g', Scene: A }))
    expect(sceneKey({ id: 'a', groupKey: 'g', Scene: A })).not.toBe(sceneKey({ id: 'b', groupKey: 'g', Scene: B }))
    expect(sceneKey({ id: 'a', Scene: A })).not.toBe(sceneKey({ id: 'b', Scene: A }))
  })
})
