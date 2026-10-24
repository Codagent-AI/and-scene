import { describe, expect, it } from 'vitest'
import { groupByEra, stepNumber } from '../../src/presentation-kit'

describe('step numbering', () => {
  it('derives numbers from position so reordering needs no renumbering', () => {
    const steps = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(steps.map((_, i) => stepNumber(i))).toEqual([1, 2, 3])
    const reordered = [steps[2], steps[0], steps[1]]
    expect(reordered.map((s, i) => [s.id, stepNumber(i)])).toEqual([['c', 1], ['a', 2], ['b', 3]])
    expect([...reordered.slice(0, 1), ...reordered.slice(2)].map((_, i) => stepNumber(i))).toEqual([1, 2])
  })
})

describe('groupByEra', () => {
  it('groups consecutive steps and records the first index of each era', () => {
    const groups = groupByEra([{ era: 'x' }, { era: 'x' }, { era: 'y' }, { era: 'z' }, { era: 'z' }])
    expect(groups.map((g) => [g.era, g.firstIndex, g.indices])).toEqual([
      ['x', 0, [0, 1]],
      ['y', 2, [2]],
      ['z', 3, [3, 4]],
    ])
  })
})
