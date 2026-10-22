import { describe, expect, it } from 'vitest'
import { buildToc, stepNumber, validateSteps } from '../steps.ts'
import type { Step } from '../types.ts'

const ok = { id: 'a', era: 'e', title: 't', caption: 'c' }

describe('validateSteps', () => {
  it('accepts a complete step list', () => {
    expect(validateSteps([ok, { ...ok, id: 'b' }])).toEqual([])
  })

  it.each(['id', 'era', 'title', 'caption'] as const)('rejects a missing %s', (field) => {
    const broken: Partial<typeof ok> = { ...ok }
    delete broken[field]
    expect(validateSteps([broken])).toEqual([expect.stringContaining(`"${field}"`)])
  })

  it.each(['', '   '])('rejects an empty narration field %j', (value) => {
    expect(validateSteps([{ ...ok, title: value }])).toEqual([expect.stringContaining('"title"')])
  })

  it('rejects duplicate ids', () => {
    expect(validateSteps([ok, ok])).toEqual([expect.stringContaining('duplicate id "a"')])
  })
})

describe('step contract types', () => {
  it('carries a typed payload and its Scene together', () => {
    const step: Step<{ n: number }> = {
      ...ok,
      Scene: ({ payload }) => payload.n,
      payload: { n: 1 },
    }
    expect(step.payload.n).toBe(1)
  })

  it('rejects a Scene whose payload type does not match', () => {
    // @ts-expect-error payload must match the Scene's payload type
    const bad: Step<{ n: number }> = { ...ok, Scene: ({ payload }) => payload.n, payload: { n: 'x' } }
    expect(bad).toBeDefined()
  })

  it('rejects a step missing narration fields', () => {
    // @ts-expect-error caption is required
    const bad: Step = { id: 'a', era: 'e', title: 't', Scene: () => null, payload: undefined }
    expect(bad).toBeDefined()
  })
})

describe('order-derived numbering', () => {
  it('numbers from position, one-based', () => {
    expect([0, 1, 2].map(stepNumber)).toEqual([1, 2, 3])
  })
})

describe('buildToc', () => {
  it('groups consecutive steps by era and records the first index', () => {
    const toc = buildToc([{ era: 'a' }, { era: 'a' }, { era: 'b' }, { era: 'b' }, { era: 'b' }, { era: 'c' }])
    expect(toc).toEqual([
      { era: 'a', firstIndex: 0, indices: [0, 1] },
      { era: 'b', firstIndex: 2, indices: [2, 3, 4] },
      { era: 'c', firstIndex: 5, indices: [5] },
    ])
  })
})
