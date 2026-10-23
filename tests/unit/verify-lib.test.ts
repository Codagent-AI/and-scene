import { describe, expect, it } from 'vitest'
import { parseRegistry } from '../../scripts/lib/runtime.mjs'

describe('registry parsing used by verification', () => {
  it('reads every slug with its folder from a multi-entry registry (I-42)', () => {
    const text = `export const presentations = [
      { slug: 'one', title: 'One', load: () => import('./one-dir/Talk') },
      {
        slug: "two",
        title: 'Two',
        load: () => import("./two/Talk"),
      },
    ]`
    expect(parseRegistry(text)).toEqual([
      { slug: 'one', dir: 'one-dir' },
      { slug: 'two', dir: 'two' },
    ])
  })

  it('finds nothing in a registry without entries so verification can fail (I-58)', () => {
    expect(parseRegistry('export const presentations = []')).toEqual([])
  })
})
