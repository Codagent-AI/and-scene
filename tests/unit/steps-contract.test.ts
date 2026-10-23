import { describe, expect, it } from 'vitest'
import { eraEntries, validateSteps } from '../../src/presentation-kit'
import { FOUR, makeSteps, TextScene } from '../helpers/fixtures'

describe('step contract', () => {
  it('accepts steps carrying id, era, title, caption, Scene and payload', () => {
    expect(validateSteps(FOUR)).toEqual([])
    for (const s of FOUR) {
      expect(s).toMatchObject({ id: expect.any(String), era: expect.any(String), title: expect.any(String), caption: expect.any(String) })
      expect(s.Scene).toBe(TextScene)
      expect(s.payload).toBeDefined()
    }
  })

  it.each(['id', 'era', 'title', 'caption'] as const)('rejects a step missing %s', (field) => {
    const steps = makeSteps([{ id: 'a', era: 'one' }, { id: 'b', era: 'one' }])
    const broken = { ...steps[1], [field]: '' }
    expect(validateSteps([steps[0], broken])).toEqual([`step 1 is missing "${field}"`])
  })

  it('rejects a step with no Scene', () => {
    const [s] = makeSteps([{ id: 'a', era: 'one' }])
    expect(validateSteps([{ ...s, Scene: undefined }])).toEqual(['step 0 is missing "Scene"'])
  })

  it('rejects duplicate ids and empty arrays', () => {
    const steps = makeSteps([{ id: 'a', era: 'one' }, { id: 'a', era: 'two' }])
    expect(validateSteps(steps)).toEqual(['duplicate step id "a"'])
    expect(validateSteps([])).toEqual(['a presentation needs at least one step'])
  })

  it('lists distinct eras in first-appearance order with their first step', () => {
    const steps = makeSteps([
      { id: 'a', era: 'x' }, { id: 'b', era: 'y' }, { id: 'c', era: 'x' }, { id: 'd', era: 'z' },
    ])
    expect(eraEntries(steps)).toEqual([
      { era: 'x', firstIndex: 0 }, { era: 'y', firstIndex: 1 }, { era: 'z', firstIndex: 3 },
    ])
  })
})
