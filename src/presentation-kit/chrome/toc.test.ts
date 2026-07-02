import { describe, expect, it } from 'vitest'
import { toSections } from './tocSections'

describe('toSections', () => {
  it('collapses consecutive steps that share an era into one section', () => {
    const sections = toSections([
      { id: 'a', era: 'intro', title: 'One', caption: '' },
      { id: 'b', era: 'intro', title: 'Two', caption: '' },
      { id: 'c', era: 'next', title: 'Three', caption: '' },
    ])

    expect(sections).toEqual([
      { era: 'intro', start: 0, end: 1 },
      { era: 'next', start: 2, end: 2 },
    ])
  })
})
