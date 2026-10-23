import { describe, expect, it } from 'vitest'
import { eraFirstIndex, eraSections, sceneKey, stepNumber } from '../../src/presentation-kit/model'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { REFERENCE_OUTLINE, compareOutline } from '../../scripts/lib/outline.mjs'
import { makeSteps } from './helpers'

describe('step model', () => {
  it('every sample step carries id, era, title, caption and a diagram state (I-1)', () => {
    for (const step of STEPS) {
      expect(step.id).toBeTruthy()
      expect(step.era).toBeTruthy()
      expect(step.title).toBeTruthy()
      expect(step.caption).toBeTruthy()
      expect(step.Scene).toBeTypeOf('function')
      expect(step.payload).toBeDefined()
    }
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length)
  })

  it('derives step numbers from position after insert, remove and reorder (I-2)', () => {
    const steps = makeSteps()
    expect(steps.map((_, i) => stepNumber(i))).toEqual([1, 2, 3, 4])
    const reordered = [steps[3], ...steps.slice(0, 3)]
    expect(reordered.map((s, i) => [s.id, stepNumber(i)])).toEqual([['d', 1], ['a', 2], ['b', 3], ['c', 4]])
    const removed = steps.filter((s) => s.id !== 'a')
    expect(removed.map((_, i) => stepNumber(i))).toEqual([1, 2, 3])
  })

  it('groups eras and finds the first step of an era', () => {
    const steps = makeSteps()
    expect(eraSections(steps)).toEqual([
      { era: 'one', first: 0, count: 2 },
      { era: 'two', first: 2, count: 2 },
    ])
    expect(eraFirstIndex(steps, 3)).toBe(2)
    expect(eraFirstIndex(steps, 1)).toBe(0)
  })

  it('shares a scene key only for grouped steps with the same scene component (I-7)', () => {
    const grouped = makeSteps(true)
    expect(sceneKey(grouped[0])).toBe(sceneKey(grouped[1]))
    const ungrouped = makeSteps(false)
    expect(sceneKey(ungrouped[0])).not.toBe(sceneKey(ungrouped[1]))
    const mixed = { ...grouped[1], Scene: makeSteps(false)[1].Scene }
    expect(sceneKey(mixed)).not.toBe(sceneKey(grouped[0]))
  })

  it('the sample matches the normative nine-step outline in order (I-57)', () => {
    expect(STEPS.map(({ title, caption }) => ({ title, caption }))).toEqual(REFERENCE_OUTLINE)
    expect(STEPS.map((s) => s.era)).toEqual([
      'the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering',
      'the build', 'the build', 'the loop', 'the reveal',
    ])
  })

  it('reports out-of-order or malformed outlines (I-58)', () => {
    const swapped = [...REFERENCE_OUTLINE]
    ;[swapped[0], swapped[1]] = [swapped[1], swapped[0]]
    expect(compareOutline(swapped)).toMatch(/step 1 title/)
    expect(compareOutline(REFERENCE_OUTLINE.slice(0, 8))).toMatch(/expected 9 steps, found 8/)
    expect(compareOutline(REFERENCE_OUTLINE.map((s) => ({ ...s, caption: '' })))).toMatch(/step 1 caption/)
    expect(compareOutline(REFERENCE_OUTLINE)).toBeNull()
  })
})
