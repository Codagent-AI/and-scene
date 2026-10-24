import { describe, expect, it } from 'vitest'
import { formatStepNumber, sceneKey, sectionsOf, stepNumber, validateSteps } from '../steps'

const meta = (id: string, era = 'a') => ({ id, era, title: `t-${id}`, caption: `c-${id}` })

describe('step model', () => {
  it('derives on-screen numbers from position, so reordering needs no renumbering', () => {
    const steps = [meta('x'), meta('y'), meta('z')]
    const numbers = (list: typeof steps) => list.map((s, i) => [s.id, stepNumber(i)])
    expect(numbers(steps)).toEqual([['x', 1], ['y', 2], ['z', 3]])
    expect(numbers([steps[2], steps[0]])).toEqual([['z', 1], ['x', 2]])
    expect(formatStepNumber(2, 12)).toBe('03')
  })

  it('accepts steps carrying id, era, title, caption', () => {
    expect(() => validateSteps([meta('a'), meta('b')])).not.toThrow()
  })

  it.each(['id', 'era', 'title', 'caption'] as const)('rejects a step missing %s', (field) => {
    expect(() => validateSteps([{ ...meta('a'), [field]: '' }])).toThrow(/missing/)
  })

  it('rejects duplicate ids and empty step lists', () => {
    expect(() => validateSteps([meta('a'), meta('a')])).toThrow(/Duplicate/)
    expect(() => validateSteps([])).toThrow(/at least one/)
  })

  it('builds table-of-contents sections by era in first-appearance order', () => {
    const sections = sectionsOf([meta('1', 'ask'), meta('2', 'ask'), meta('3', 'build'), meta('4', 'ask')])
    expect(sections).toEqual([
      { era: 'ask', first: 0, indexes: [0, 1, 3] },
      { era: 'build', first: 2, indexes: [2] },
    ])
  })
})

describe('sceneKey', () => {
  const A = () => null
  const B = () => null
  it('is shared by steps with the same groupKey and Scene', () => {
    expect(sceneKey({ id: '1', groupKey: 'g', Scene: A })).toBe(sceneKey({ id: '2', groupKey: 'g', Scene: A }))
  })
  it('differs for another Scene, another group, or an ungrouped step', () => {
    const base = sceneKey({ id: '1', groupKey: 'g', Scene: A })
    expect(sceneKey({ id: '2', groupKey: 'g', Scene: B })).not.toBe(base)
    expect(sceneKey({ id: '2', groupKey: 'h', Scene: A })).not.toBe(base)
    expect(sceneKey({ id: '1', Scene: A })).not.toBe(sceneKey({ id: '2', Scene: A }))
  })
})
