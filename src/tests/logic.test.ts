import { describe, expect, it } from 'vitest'
import { computeFitScale } from '../presentation-kit/fitScale'
import { DESIGN_H, DESIGN_W, MIN_SCALE } from '../presentation-kit/constants'
import { clampIndex, deriveEras, formatStepNumber, isInteractiveTarget, keyToAction, swipeToAction } from '../presentation-kit/navLogic'
import { resolveRoute } from '../routes'

describe('nav logic', () => {
  it('clamps at both ends', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(5, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
    expect(clampIndex(3, 0)).toBe(0)
  })
  it('maps keys', () => {
    for (const k of ['ArrowRight', ' ', 'PageDown']) expect(keyToAction(k)).toBe('next')
    for (const k of ['ArrowLeft', 'PageUp']) expect(keyToAction(k)).toBe('prev')
    expect(keyToAction('p')).toBe('toggle-mode')
    expect(keyToAction('x')).toBeNull()
  })
  it('maps swipes', () => {
    expect(swipeToAction(-80, 5)).toBe('next')
    expect(swipeToAction(80, 5)).toBe('prev')
    expect(swipeToAction(10, 0)).toBeNull()
    expect(swipeToAction(-50, 120)).toBeNull()
  })
  it('detects interactive controls', () => {
    const b = document.createElement('button')
    const d = document.createElement('div')
    expect(isInteractiveTarget(b)).toBe(true)
    expect(isInteractiveTarget(d)).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })
  it('derives numbering from position', () => {
    expect(formatStepNumber(0)).toBe('01')
    expect(formatStepNumber(8)).toBe('09')
  })
  it('maps eras to first step', () => {
    expect(deriveEras([{ era: 'A' }, { era: 'A' }, { era: 'B' }, { era: 'A' }])).toEqual([
      { label: 'A', firstIndex: 0 },
      { label: 'B', firstIndex: 2 },
    ])
  })
})

describe('fit scale', () => {
  it('defaults to 880x380', () => {
    expect([DESIGN_W, DESIGN_H]).toEqual([880, 380])
  })
  it('scales uniformly by the limiting axis', () => {
    expect(computeFitScale(1760, 1000, 880, 380, MIN_SCALE)).toBe(2)
    expect(computeFitScale(1760, 380, 880, 380, MIN_SCALE)).toBe(1)
  })
  it('floors at min scale and tolerates zero area', () => {
    expect(computeFitScale(10, 10, 880, 380, MIN_SCALE)).toBe(MIN_SCALE)
    expect(computeFitScale(0, 0, 880, 380, MIN_SCALE)).toBe(1)
  })
})

describe('resolveRoute', () => {
  const entry = { slug: 'talk', title: 'T', load: async () => ({ default: () => null }) }
  it('resolves landing, slug, and unknown', () => {
    expect(resolveRoute('/', [entry]).kind).toBe('landing')
    expect(resolveRoute('/talk', [entry])).toEqual({ kind: 'presentation', entry })
    expect(resolveRoute('/talk/', [entry]).kind).toBe('presentation')
    expect(resolveRoute('/nope', [entry]).kind).toBe('landing')
  })
})
