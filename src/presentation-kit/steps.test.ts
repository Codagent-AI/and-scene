import { describe, expect, it } from 'vitest'
import { groupByEra, stepNumber } from './steps.ts'

const meta = (id: string, era: string) => ({ id, era, title: id, caption: id })

describe('step numbering', () => {
  it('derives the on-screen number from position, so reordering needs no renumbering', () => {
    const steps = [meta('a', 'x'), meta('b', 'x'), meta('c', 'y')]
    expect(steps.map((_, i) => stepNumber(i))).toEqual([1, 2, 3])
    const reordered = [steps[2], steps[0], steps[1]]
    expect(reordered.map((s, i) => `${s.id}:${stepNumber(i)}`)).toEqual(['c:1', 'a:2', 'b:3'])
    expect([...reordered.slice(0, 1), ...reordered.slice(2)].map((_, i) => stepNumber(i))).toEqual([1, 2])
  })
})

describe('groupByEra', () => {
  it('groups consecutive steps and records the first step of each era', () => {
    const groups = groupByEra([meta('a', 'ask'), meta('b', 'ask'), meta('c', 'build'), meta('d', 'ask')])
    expect(groups).toEqual([
      { era: 'ask', start: 0, end: 1 },
      { era: 'build', start: 2, end: 2 },
      { era: 'ask', start: 3, end: 3 },
    ])
  })
})
