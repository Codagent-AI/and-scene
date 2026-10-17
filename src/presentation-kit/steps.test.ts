import { describe, expect, it } from 'vitest'
import { clampIndex, sectionIndexOf, sectionsOf, stepNumber } from './steps.ts'
import type { AnyStep } from './types.ts'

const step = (id: string, era: string): AnyStep => ({ id, era, title: id, caption: id, Scene: () => null, payload: null })

describe('step helpers', () => {
  const steps = [step('a', 'one'), step('b', 'one'), step('c', 'two'), step('d', 'three')]

  it('derives step numbers from position', () => {
    expect([0, 1, 2].map(stepNumber)).toEqual([1, 2, 3])
  })

  it('groups consecutive steps by era with the first index of each section', () => {
    expect(sectionsOf(steps)).toEqual([
      { era: 'one', firstIndex: 0 },
      { era: 'two', firstIndex: 2 },
      { era: 'three', firstIndex: 3 },
    ])
  })

  it('finds the section containing a step', () => {
    expect([0, 1, 2, 3].map((i) => sectionIndexOf(steps, i))).toEqual([0, 0, 1, 2])
  })

  it('clamps indices to the valid range', () => {
    expect([clampIndex(-1, 4), clampIndex(2, 4), clampIndex(9, 4)]).toEqual([0, 2, 3])
  })
})
