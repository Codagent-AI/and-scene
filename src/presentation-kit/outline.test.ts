import { describe, expect, it } from 'vitest'
import { buildOutline } from './outline.ts'
import type { AnyStep } from './types.ts'

const step = (id: string, era: string): AnyStep => ({
  id,
  era,
  title: `title ${id}`,
  caption: `caption ${id}`,
  Scene: () => null,
  payload: undefined,
})

describe('buildOutline', () => {
  it('derives one-based numbers from position and groups consecutive eras', () => {
    const { entries, eras } = buildOutline([step('a', 'one'), step('b', 'one'), step('c', 'two')])
    expect(entries.map((e) => e.number)).toEqual([1, 2, 3])
    expect(eras).toEqual([
      { label: 'one', firstIndex: 0, indices: [0, 1] },
      { label: 'two', firstIndex: 2, indices: [2] },
    ])
    expect(entries.map((e) => e.eraIndex)).toEqual([0, 0, 1])
  })

  it('renumbers after insert, remove, and reorder without touching steps', () => {
    const a = step('a', 'x')
    const b = step('b', 'x')
    const c = step('c', 'y')
    const reordered = buildOutline([c, a, b]).entries
    expect(reordered.map((e) => [e.step.id, e.number])).toEqual([['c', 1], ['a', 2], ['b', 3]])
    expect(buildOutline([a, c]).entries.map((e) => [e.step.id, e.number])).toEqual([['a', 1], ['c', 2]])
    expect(a).not.toHaveProperty('number')
  })

  it('gives each step identity, era, title, and caption', () => {
    const [entry] = buildOutline([step('a', 'x')]).entries
    expect(entry.step).toMatchObject({ id: 'a', era: 'x', title: 'title a', caption: 'caption a' })
  })

  it('starts a new era when a label returns after another', () => {
    const { eras } = buildOutline([step('a', 'x'), step('b', 'y'), step('c', 'x')])
    expect(eras.map((e) => e.label)).toEqual(['x', 'y', 'x'])
  })
})
