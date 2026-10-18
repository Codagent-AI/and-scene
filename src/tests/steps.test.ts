import { describe, expect, it } from 'vitest'
import { eraGroups, sceneKey, stepMarker, validateSteps } from '../presentation-kit'
import { makeSteps, TestScene } from './helpers'

describe('step contract helpers', () => {
  it('accepts unique ids and rejects duplicates or empty ids', () => {
    expect(() => validateSteps(makeSteps(3))).not.toThrow()
    const dup = makeSteps(3)
    dup[2] = { ...dup[2], id: 's1' }
    expect(() => validateSteps(dup)).toThrow(/Duplicate step id: s1/)
    expect(() => validateSteps([{ id: '' }])).toThrow(/non-empty id/)
    expect(() => validateSteps([])).toThrow(/at least one step/)
  })

  it('derives one-based markers from position', () => {
    expect(stepMarker(0, 9)).toBe('1 / 9')
    expect(stepMarker(2, 9)).toBe('3 / 9')
    expect(stepMarker(8, 9)).toBe('9 / 9')
  })

  it('groups contiguous eras and keeps repeated labels apart', () => {
    expect(eraGroups(makeSteps(5, ['a', 'a', 'b', 'b', 'a']))).toEqual([
      { era: 'a', firstIndex: 0, lastIndex: 1 },
      { era: 'b', firstIndex: 2, lastIndex: 3 },
      { era: 'a', firstIndex: 4, lastIndex: 4 },
    ])
    expect(eraGroups([])).toEqual([])
  })

  it('shares a scene key only for the same group and Scene', () => {
    const [a, b] = makeSteps(2)
    expect(sceneKey(a)).toBe(`step:${a.id}`)
    expect(sceneKey({ ...a, groupKey: 'g' })).toBe(sceneKey({ ...b, groupKey: 'g' }))
    expect(sceneKey({ ...a, groupKey: 'g' })).not.toBe(sceneKey({ ...b, groupKey: 'h' }))
    const Other = () => null
    expect(sceneKey({ ...a, groupKey: 'g' })).not.toBe(sceneKey({ ...b, groupKey: 'g', Scene: Other }))
    expect(TestScene).toBeDefined()
  })
})
