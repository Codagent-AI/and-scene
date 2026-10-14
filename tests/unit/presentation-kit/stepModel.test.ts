import { describe, expect, it } from 'vitest'
import { eraOf, eraStarts, stepNumber } from '../../../src/presentation-kit/stepModel'

const meta = (id: string, era: string) => ({ id, era, title: id, caption: id })

describe('stepNumber', () => {
  it('derives the on-screen number from position', () => {
    expect(stepNumber(0)).toBe('01')
    expect(stepNumber(8)).toBe('09')
  })
})

describe('eraStarts', () => {
  it('lists each era once at its first step, in deck order', () => {
    const starts = eraStarts([meta('a', 'Intro'), meta('b', 'Intro'), meta('c', 'Model'), meta('d', 'Close')])
    expect(starts).toEqual([
      { era: 'Intro', firstIndex: 0 },
      { era: 'Model', firstIndex: 2 },
      { era: 'Close', firstIndex: 3 },
    ])
  })

  it('starts a new group when an era repeats non-adjacently', () => {
    const starts = eraStarts([meta('a', 'Intro'), meta('b', 'Model'), meta('c', 'Intro')])
    expect(starts.map((start) => start.firstIndex)).toEqual([0, 1, 2])
  })

  it('maps any step index to its era group', () => {
    const starts = eraStarts([meta('a', 'Intro'), meta('b', 'Intro'), meta('c', 'Model')])
    expect(eraOf(starts, 1)).toBe(0)
    expect(eraOf(starts, 2)).toBe(1)
  })
})
