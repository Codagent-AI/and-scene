import { describe, expect, it } from 'vitest'
import { checkAdvance, diffStep, formatError, selectTarget } from './verify-core.mjs'

const sample = { slug: 's', title: 'T', steps: [{ era: 'e', title: 't', caption: 'c' }] }

describe('selectTarget', () => {
  it('returns the mandatory sample and its expected steps', () => {
    expect(selectTarget([{ slug: 's', title: 'T' }], sample)).toEqual({ slug: 's', expected: sample.steps })
  })
  it('fails when the sample is absent', () => {
    expect(() => selectTarget([{ slug: 'other', title: 'T' }], sample)).toThrow(/"s" is not registered/)
    expect(() => selectTarget([], sample)).toThrow(/not registered/)
  })
  it('fails when the sample title is wrong', () => {
    expect(() => selectTarget([{ slug: 's', title: 'Different' }], sample)).toThrow(/title is "Different"/)
  })
  it('falls back to the first registered route when no sample is mandatory', () => {
    expect(selectTarget([{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }], null)).toEqual({ slug: 'a', expected: null })
    expect(() => selectTarget([], null)).toThrow(/no presentation is registered/)
  })
})

describe('diffStep', () => {
  const expected = { era: 'e', title: 't', caption: 'c' }
  it('accepts a matching step', () => expect(diffStep(expected, { ...expected })).toBeNull())
  it.each(['era', 'title', 'caption'])('rejects a wrong %s', (field) => {
    expect(diffStep(expected, { ...expected, [field]: 'wrong' })).toContain(field)
  })
  it('rejects missing text', () => expect(diffStep(expected, { era: 'e', title: null, caption: 'c' })).toContain('title'))
})

describe('checkAdvance', () => {
  it('requires the index to advance by exactly one', () => {
    expect(checkAdvance(3, 4)).toBeNull()
    expect(checkAdvance(3, 3)).toMatch(/stayed at 3/)
    expect(checkAdvance(3, 5)).toMatch(/from 3 to 5/)
    expect(checkAdvance(3, 2)).toMatch(/from 3 to 2/)
  })
})

describe('formatError', () => {
  it('names the step', () => expect(formatError('console error', 4, 'boom')).toBe('console error at step 4: boom'))
})
