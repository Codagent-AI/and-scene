import { describe, expect, it } from 'vitest'
import { eraRunIndex, groupEras } from '../eras'

const eras = (...labels: string[]) => labels.map((era) => ({ era }))

describe('groupEras', () => {
  it('groups maximal consecutive runs and keeps repeated nonadjacent labels distinct', () => {
    const runs = groupEras(eras('A', 'A', 'B', 'A', 'A'))
    expect(runs).toEqual([
      { era: 'A', start: 0, length: 2 },
      { era: 'B', start: 2, length: 1 },
      { era: 'A', start: 3, length: 2 },
    ])
    expect(runs.map((r) => r.start)).toEqual([0, 2, 3])
  })

  it('handles empty and single-step lists', () => {
    expect(groupEras([])).toEqual([])
    expect(groupEras(eras('X'))).toEqual([{ era: 'X', start: 0, length: 1 }])
  })

  it('finds the run containing an index', () => {
    const runs = groupEras(eras('A', 'A', 'B', 'A'))
    expect([0, 1, 2, 3].map((i) => eraRunIndex(runs, i))).toEqual([0, 0, 1, 2])
  })
})
