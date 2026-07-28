import { describe, expect, it } from 'vitest'
import { CANONICAL_STEPS, validateCanonicalOrder } from '../../../../scripts/canonical-steps.mjs'
import { STEPS } from './index'

describe('how-to-make-a-presentation steps', () => {
  it('implements exactly the nine canonical steps in order', () => {
    const metas = STEPS.map(({ era, title, caption }) => ({ era, title, caption }))
    expect(validateCanonicalOrder(metas)).toEqual({ ok: true })
    expect(metas).toEqual(CANONICAL_STEPS)
  })

  it('gives every step a unique, stable id', () => {
    const ids = STEPS.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('shares one groupKey and Scene so the diagram never remounts between steps', () => {
    const groupKeys = new Set(STEPS.map((step) => step.groupKey))
    const scenes = new Set(STEPS.map((step) => step.Scene))
    expect(groupKeys.size).toBe(1)
    expect([...groupKeys][0]).toBeTruthy()
    expect(scenes.size).toBe(1)
  })

  it('numbers each step payload to match its position', () => {
    STEPS.forEach((step, index) => {
      expect(step.payload).toEqual({ step: index + 1 })
    })
  })
})
