import { describe, expect, it } from 'vitest'
import { CANONICAL_SLUG, findCanonicalMismatches } from './canonical-sample.mjs'

const CANONICAL = [
  { era: 'the ask', title: 'You have a topic', caption: 'It starts.' },
  { era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time.' },
]

describe('findCanonicalMismatches', () => {
  it('exposes the canonical sample slug', () => {
    expect(CANONICAL_SLUG).toBe('how-to-make-a-presentation')
  })

  it('returns no errors when actual steps match the canonical outline exactly and in order', () => {
    const actual = [
      { title: 'You have a topic', caption: 'It starts.' },
      { title: 'The skill interviews you', caption: 'One question at a time.' },
    ]
    expect(findCanonicalMismatches(actual, CANONICAL)).toEqual([])
  })

  it('reports a mismatch identifying the step index when a title differs', () => {
    const actual = [
      { title: 'Wrong title', caption: 'It starts.' },
      { title: 'The skill interviews you', caption: 'One question at a time.' },
    ]
    const errors = findCanonicalMismatches(actual, CANONICAL)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/step 0/)
    expect(errors[0]).toMatch(/title/)
  })

  it('reports a mismatch identifying the step index when a caption differs', () => {
    const actual = [
      { title: 'You have a topic', caption: 'It starts.' },
      { title: 'The skill interviews you', caption: 'Wrong caption.' },
    ]
    const errors = findCanonicalMismatches(actual, CANONICAL)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/step 1/)
    expect(errors[0]).toMatch(/caption/)
  })

  it('reports missing steps when actual has fewer entries than canonical', () => {
    const actual = [{ title: 'You have a topic', caption: 'It starts.' }]
    const errors = findCanonicalMismatches(actual, CANONICAL)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/count mismatch/i)
  })

  it('reports a count mismatch when actual has extra steps beyond the canonical outline', () => {
    const actual = [
      { title: 'You have a topic', caption: 'It starts.' },
      { title: 'The skill interviews you', caption: 'One question at a time.' },
      { title: 'Bonus step', caption: 'Not in the outline.' },
    ]
    const errors = findCanonicalMismatches(actual, CANONICAL)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/count mismatch/i)
    expect(errors[0]).toMatch(/found 3/)
  })
})
