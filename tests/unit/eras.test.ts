import { describe, expect, it } from 'vitest'
import { groupEras } from '../../src/presentation-kit/eras.ts'

describe('groupEras', () => {
  it('makes one entry per consecutive era run, in order, keyed by first index', () => {
    const g = groupEras([{ era: 'a' }, { era: 'a' }, { era: 'b' }, { era: 'a' }])
    expect(g.map((x) => [x.era, x.firstIndex, x.indices])).toEqual([
      ['a', 0, [0, 1]],
      ['b', 2, [2]],
      ['a', 3, [3]],
    ])
  })
})
