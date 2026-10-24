import { describe, expect, it } from 'vitest'
import { sceneKey, sectionIndexOf, sectionsOf, stepMarker, stepNumber, validateSteps } from '../../src/presentation-kit'
import { makeSteps } from './helpers'

describe('step model', () => {
  it('derives numbering from position after insert, remove, and reorder', () => {
    const base = ['a', 'b', 'c']
    expect(base.map((_, i) => stepNumber(i))).toEqual([1, 2, 3])
    const inserted = ['a', 'x', 'b', 'c']
    expect(inserted.map((_, i) => stepMarker(i, inserted.length))).toEqual(['1 / 4', '2 / 4', '3 / 4', '4 / 4'])
    const removed = base.filter((s) => s !== 'a')
    expect(removed.map((_, i) => stepNumber(i))).toEqual([1, 2])
    const reordered = [...base].reverse()
    expect(reordered.map((_, i) => stepNumber(i))).toEqual([1, 2, 3])
  })

  it('groups consecutive steps into era sections', () => {
    const sections = sectionsOf(makeSteps(5))
    expect(sections.map((s) => [s.era, s.first, s.indices])).toEqual([
      ['era-0', 0, [0, 1]],
      ['era-1', 2, [2, 3]],
      ['era-2', 4, [4]],
    ])
    expect(sectionIndexOf(sections, 3)).toBe(1)
    expect(sectionIndexOf(sections, 9)).toBe(-1)
  })

  it('does not merge non-adjacent steps that share an era label', () => {
    const sections = sectionsOf(makeSteps(3, (i) => (i === 1 ? 'b' : 'a')))
    expect(sections.map((s) => s.first)).toEqual([0, 1, 2])
  })

  describe('validateSteps', () => {
    it('accepts valid steps', () => {
      expect(validateSteps(makeSteps(3))).toEqual([])
    })

    it.each(['id', 'era', 'title', 'caption'] as const)('rejects a missing %s', (field) => {
      const [step] = makeSteps(1)
      expect(validateSteps([{ ...step, [field]: undefined }])).toEqual([`step 1: missing ${field}`])
    })

    it.each(['', '   '])('rejects a blank title %j', (title) => {
      const [step] = makeSteps(1)
      expect(validateSteps([{ ...step, title }])).toEqual(['step 1: missing title'])
    })

    it('rejects a missing Scene and duplicate ids', () => {
      const [a, b] = makeSteps(2)
      expect(validateSteps([{ ...a, Scene: undefined }])).toEqual(['step 1: missing Scene'])
      expect(validateSteps([{ ...a, Scene: null as never }])).toEqual(['step 1: missing Scene'])
      expect(validateSteps([{ ...a, Scene: 'div' as never }])).toEqual(['step 1: missing Scene'])
      expect(validateSteps([a, { ...b, id: a.id }])).toEqual([`step 2: duplicate id "${a.id}"`])
    })
  })

  describe('sceneKey', () => {
    const [a, b] = makeSteps(2)
    const OtherScene = () => null

    it('shares a key within a group with the same Scene', () => {
      expect(sceneKey({ ...a, groupKey: 'g' })).toBe(sceneKey({ ...b, groupKey: 'g' }))
    })

    it('separates different groups, different scenes in one group, and ungrouped steps', () => {
      expect(sceneKey({ ...a, groupKey: 'g' })).not.toBe(sceneKey({ ...b, groupKey: 'h' }))
      expect(sceneKey({ ...a, groupKey: 'g' })).not.toBe(sceneKey({ ...b, groupKey: 'g', Scene: OtherScene }))
      expect(sceneKey(a)).not.toBe(sceneKey(b))
      expect(sceneKey(a)).toBe(`step:${a.id}`)
    })
  })
})
