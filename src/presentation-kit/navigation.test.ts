import { describe, expect, it } from 'vitest'
import { clampIndex, keyToAction, resolveGroup, resolveRoute, sceneTransitionKey, stepNumber, swipeToAction, touchToAction } from './navigation'
import { DESIGN_H, DESIGN_W } from './constants'
import { computeFitScale, computeFitScaleState } from './useFitScale'
import { isValidRegistry } from '../presentations'

describe('presentation kit pure contracts', () => {
  it('derives step numbers from their current array position', () => { expect([stepNumber(0), stepNumber(2)]).toEqual([1, 3]) })
  it('clamps navigation at each boundary and direct jumps', () => { expect([clampIndex(-1, 4), clampIndex(2, 4), clampIndex(9, 4), clampIndex(0, 0)]).toEqual([0, 2, 3, 0]) })
  it('maps supported keys and leaves focused controls in control', () => {
    expect(['ArrowRight', ' ', 'PageDown'].map((key) => keyToAction(key))).toEqual(['next', 'next', 'next'])
    expect(['ArrowLeft', 'PageUp'].map((key) => keyToAction(key))).toEqual(['prev', 'prev'])
    expect(keyToAction('p')).toBe('toggle-mode')
    expect(keyToAction('p', null, { ctrlKey: true })).toBeNull()
    expect(keyToAction('p', null, { metaKey: true })).toBeNull()
    expect(keyToAction('ArrowLeft', null, { altKey: true })).toBeNull()
    const button = { tagName: 'BUTTON', isContentEditable: false } as unknown as EventTarget
    expect(keyToAction(' ', button)).toBeNull()
    expect(keyToAction('Enter', button)).toBeNull()
    expect(keyToAction('ArrowRight', button)).toBe('next')
    expect(keyToAction('ArrowLeft', button)).toBe('prev')
    expect(keyToAction('PageDown', button)).toBe('next')
    expect(keyToAction('PageUp', button)).toBe('prev')
  })
  it('interprets horizontal swipes with a threshold and requires a matching start', () => {
    expect([swipeToAction(-60), swipeToAction(60), swipeToAction(20)]).toEqual(['next', 'prev', null])
    expect(touchToAction(null, 100)).toBeNull()
    expect(touchToAction(100, undefined)).toBeNull()
    expect(touchToAction(100, 40)).toBe('next')
    expect(touchToAction(40, 100)).toBe('prev')
  })
  it('fits the fixed canvas uniformly in both modes', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
    expect(computeFitScale(1200, 900, 'browse')).toBeCloseTo(Math.min((1200 - 96) / 880, (900 - 340) / 380))
    expect(computeFitScaleState(200, 140, 'browse')).toEqual({ scale: 0.25, overflowing: true })
  })
  it('resolves only exact registered route slugs', () => { expect(resolveRoute('/demo/', ['demo'])).toBe('demo'); expect(resolveRoute('/unknown', ['demo'])).toBeNull() })
  it('validates explicit unique registry slugs', () => {
    const load = async () => ({ default: () => null })
    expect(isValidRegistry([{ slug: 'good-demo', title: 'Good', load }])).toBe(true)
    expect(isValidRegistry([{ slug: 'x', title: 'X', load }, { slug: 'x', title: 'Duplicate', load }])).toBe(false)
    expect(isValidRegistry([{ slug: 'good-demo', title: '  ', load }])).toBe(false)
  })
  it('groups only contiguous steps sharing both key and scene identity', () => {
    const scene = () => null
    const other = () => null
    const steps = [{ id: 'one', groupKey: 'a', Scene: scene }, { id: 'two', groupKey: 'a', Scene: scene }, { id: 'three', groupKey: 'a', Scene: other }]
    expect(resolveGroup(steps, 1)).toEqual({ key: 'a', scene, start: 0, end: 1 })
    expect(resolveGroup(steps, 2)).toEqual({ key: 'a', scene: other, start: 2, end: 2 })
    expect([sceneTransitionKey(steps, 0), sceneTransitionKey(steps, 1)]).toEqual(['group:a:0', 'group:a:0'])
    const mixed = [steps[0], { id: 'alone', Scene: other }]
    expect([sceneTransitionKey(mixed, 0), sceneTransitionKey(mixed, 1)]).toEqual(['group:a:0', 'step:alone'])
  })
})
