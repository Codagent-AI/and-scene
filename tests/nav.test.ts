import { describe, expect, it } from 'vitest'
import { buildEras, clampIndex, isInteractiveTarget, keyAction, stepMarker, swipeAction } from '../src/presentation-kit/nav'
import { computeFitScale, fitScaleFor } from '../src/presentation-kit/useFitScale'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT } from '../src/presentation-kit/constants'

describe('nav helpers', () => {
  it('clamps at both ends', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(5, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
    expect(clampIndex(3, 0)).toBe(0)
  })
  it('maps keys', () => {
    for (const key of ['ArrowRight', ' ', 'PageDown']) expect(keyAction({ key })).toBe('next')
    for (const key of ['ArrowLeft', 'PageUp']) expect(keyAction({ key })).toBe('prev')
    expect(keyAction({ key: 'p' })).toBe('toggle-mode')
    expect(keyAction({ key: 'P' })).toBe('toggle-mode')
    expect(keyAction({ key: 'x' })).toBeNull()
  })
  it('maps swipes', () => {
    expect(swipeAction(-120, 5)).toBe('next')
    expect(swipeAction(120, 5)).toBe('prev')
    expect(swipeAction(-10, 0)).toBeNull()
    expect(swipeAction(-60, 100)).toBeNull()
  })
  it('detects interactive targets', () => {
    const b = document.createElement('button')
    const span = document.createElement('span')
    b.append(span)
    document.body.append(b)
    expect(isInteractiveTarget(span)).toBe(true)
    expect(isInteractiveTarget(document.body)).toBe(false)
    b.remove()
  })
  it('derives step markers from position', () => {
    expect(stepMarker(0, 9)).toBe('01')
    expect(stepMarker(8, 9)).toBe('09')
    expect(stepMarker(99, 120)).toBe('100')
  })
  it('groups eras and records first index', () => {
    expect(buildEras([{ era: 'a' }, { era: 'a' }, { era: 'b' }, { era: 'a' }])).toEqual([
      { era: 'a', firstIndex: 0 },
      { era: 'b', firstIndex: 2 },
      { era: 'a', firstIndex: 3 },
    ])
  })
})

describe('fit scale', () => {
  it('uses default canvas 880x380', () => {
    expect(DESIGN_W).toBe(880)
    expect(DESIGN_H).toBe(380)
    expect(Object.keys(STAGE_LAYOUT).sort()).toEqual(['browse', 'present'])
  })
  it('scales uniformly by the tighter axis', () => {
    expect(computeFitScale(1760, 1000)).toBe(2)
    expect(computeFitScale(1760, 190)).toBe(0.5)
  })
  it('never drops below the minimum', () => {
    expect(computeFitScale(1, 1)).toBe(MIN_SCALE)
    expect(computeFitScale(NaN, 100)).toBe(MIN_SCALE)
  })
  it('reserves chrome geometry per mode', () => {
    const present = fitScaleFor('present', 1600, 900)
    const browse = fitScaleFor('browse', 1600, 900)
    expect(present).toBeGreaterThan(browse)
    expect(fitScaleFor('browse', 1000, 900)).toBeGreaterThan(0)
  })
})
