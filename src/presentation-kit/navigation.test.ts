import { describe, expect, it } from 'vitest'
import { clampIndex, keyToAction, resolveGroup, resolveRoute, stepNumber, swipeToAction } from './navigation'
import { DESIGN_H, DESIGN_W } from './constants'
import { computeFitScale } from './useFitScale'
import { isValidRegistry } from '../presentations'

describe('presentation kit pure contracts', () => {
  it('derives step numbers from their current array position', () => { expect([stepNumber(0), stepNumber(2)]).toEqual([1, 3]) })
  it('clamps navigation at each boundary and direct jumps', () => { expect([clampIndex(-1, 4), clampIndex(2, 4), clampIndex(9, 4), clampIndex(0, 0)]).toEqual([0, 2, 3, 0]) })
  it('maps supported keys and leaves focused controls in control', () => {
    expect(['ArrowRight', ' ', 'PageDown'].map((key) => keyToAction(key))).toEqual(['next', 'next', 'next'])
    expect(['ArrowLeft', 'PageUp'].map((key) => keyToAction(key))).toEqual(['prev', 'prev'])
    expect(keyToAction('p')).toBe('toggle-mode')
    expect(keyToAction(' ', { tagName: 'BUTTON', isContentEditable: false } as unknown as EventTarget)).toBeNull()
  })
  it('interprets horizontal swipes with a threshold', () => { expect([swipeToAction(-60), swipeToAction(60), swipeToAction(20)]).toEqual(['next', 'prev', null]) })
  it('fits the fixed canvas uniformly in both modes', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(computeFitScale(1200, 900, 'browse')).toBeCloseTo(Math.min((1200 - 96) / 880, (900 - 340) / 380))
  })
  it('resolves only exact registered route slugs', () => { expect(resolveRoute('/demo/', ['demo'])).toBe('demo'); expect(resolveRoute('/unknown', ['demo'])).toBeNull() })
  it('validates explicit unique registry slugs', () => {
    const load = async () => ({ default: () => null })
    expect(isValidRegistry([{ slug: 'good-demo', title: 'Good', load }])).toBe(true)
    expect(isValidRegistry([{ slug: 'x', title: 'X', load }, { slug: 'x', title: 'Duplicate', load }])).toBe(false)
  })
  it('groups only contiguous steps sharing both key and scene identity', () => {
    const scene = () => null
    const other = () => null
    const steps = [{ groupKey: 'a', Scene: scene }, { groupKey: 'a', Scene: scene }, { groupKey: 'a', Scene: other }]
    expect(resolveGroup(steps, 1)).toEqual({ key: 'a', scene, start: 0, end: 1 })
    expect(resolveGroup(steps, 2)).toEqual({ key: 'a', scene: other, start: 2, end: 2 })
  })
})
