import { describe, expect, it } from 'vitest'
import {
  classifySwipe,
  clampIndex,
  eraEntries,
  firstStepOfEra,
  isInteractiveTarget,
  keyToAction,
  stepNumber,
} from './usePresentationNav'

describe('nav logic', () => {
  it('clamps at both ends without wrapping', () => {
    expect(clampIndex(-1, 5)).toBe(0)
    expect(clampIndex(5, 5)).toBe(4)
    expect(clampIndex(2, 5)).toBe(2)
    expect(clampIndex(3, 0)).toBe(0)
  })

  it('maps keys to actions', () => {
    for (const k of ['ArrowRight', ' ', 'PageDown']) expect(keyToAction(k)).toBe('next')
    for (const k of ['ArrowLeft', 'PageUp']) expect(keyToAction(k)).toBe('prev')
    expect(keyToAction('p')).toBe('toggle-mode')
    expect(keyToAction('P')).toBe('toggle-mode')
    expect(keyToAction('x')).toBeNull()
  })

  it('classifies swipes by direction', () => {
    expect(classifySwipe(-120, 5)).toBe('next')
    expect(classifySwipe(120, 5)).toBe('prev')
    expect(classifySwipe(-10, 0)).toBeNull()
    expect(classifySwipe(-80, 200)).toBeNull()
  })

  it('exempts interactive controls', () => {
    const btn = document.createElement('button')
    const span = document.createElement('span')
    btn.appendChild(span)
    expect(isInteractiveTarget(btn)).toBe(true)
    expect(isInteractiveTarget(span)).toBe(true)
    expect(isInteractiveTarget(document.createElement('div'))).toBe(false)
    expect(isInteractiveTarget(document.body)).toBe(false)
  })

  it('derives numbering and era lookup from order', () => {
    const steps = [{ era: 'A' }, { era: 'A' }, { era: 'B' }, { era: 'C' }]
    expect(stepNumber(0)).toBe(1)
    expect(firstStepOfEra(steps, 'B')).toBe(2)
    expect(firstStepOfEra(steps, 'Z')).toBe(-1)
    expect(eraEntries(steps)).toEqual([
      { era: 'A', firstIndex: 0 },
      { era: 'B', firstIndex: 2 },
      { era: 'C', firstIndex: 3 },
    ])
    const reordered = [steps[2], steps[0], steps[1]]
    expect(reordered.map((_, i) => stepNumber(i))).toEqual([1, 2, 3])
  })
})
