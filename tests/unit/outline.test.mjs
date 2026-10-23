import { describe, expect, it } from 'vitest'
import { checkOutline, validateReference } from '../../scripts/lib/outline.mjs'
import { REFERENCE } from '../../scripts/reference.mjs'

const observedFrom = (steps) => steps.map((step, index) => ({ index, ...step }))

describe('checkOutline', () => {
  const expected = REFERENCE.steps

  it('reports no problems when every observed step matches the outline in order', () => {
    expect(checkOutline(observedFrom(expected), expected)).toEqual([])
  })

  it('names the first altered title by step', () => {
    const altered = expected.map((step, index) => (index === 4 ? { ...step, title: 'Wrong' } : step))
    const problems = checkOutline(observedFrom(altered), expected)
    expect(problems).toHaveLength(1)
    expect(problems[0].step).toBe(4)
    expect(problems[0].message).toContain('step 5 title')
  })

  it('flags an altered caption', () => {
    const altered = expected.map((step, index) => (index === 0 ? { ...step, caption: 'Different.' } : step))
    expect(checkOutline(observedFrom(altered), expected)[0].message).toContain('step 1 caption')
  })

  it('flags a changed era', () => {
    const altered = expected.map((step, index) => (index === 8 ? { ...step, era: 'the start' } : step))
    expect(checkOutline(observedFrom(altered), expected)[0].step).toBe(8)
  })

  it('flags reordered rows', () => {
    const reordered = [expected[1], expected[0], ...expected.slice(2)]
    const problems = checkOutline(observedFrom(reordered), expected)
    expect([...new Set(problems.map((problem) => problem.step))]).toEqual([0, 1])
  })

  it('flags a missing or extra step by count', () => {
    expect(checkOutline(observedFrom(expected.slice(1)), expected)[0].message).toContain('expected 9 steps, observed 8')
    expect(checkOutline(observedFrom([...expected, expected[0]]), expected)[0].message).toContain('observed 10')
  })

  it('treats null observed text as a mismatch', () => {
    const observed = observedFrom(expected).map((step, index) => (index === 2 ? { ...step, caption: null } : step))
    expect(checkOutline(observed, expected)[0].step).toBe(2)
  })
})

describe('validateReference', () => {
  it('accepts the committed reference outline', () => {
    expect(validateReference(REFERENCE)).toEqual([])
  })

  it('rejects a missing slug, empty steps, and a step without a title', () => {
    expect(validateReference({ steps: REFERENCE.steps })[0]).toMatch(/slug/)
    expect(validateReference({ slug: 'x', steps: [] })[0]).toMatch(/at least one step/)
    const broken = { slug: 'x', steps: [{ era: 'a', caption: 'c' }] }
    expect(validateReference(broken)[0]).toMatch(/step 1 is missing title/)
  })
})
