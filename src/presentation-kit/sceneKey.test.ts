import { describe, expect, it } from 'vitest'
import { sceneKey } from './sceneKey'
import type { Step } from './types'

const SceneA = () => null
const SceneB = () => null
const step = (id: string, Scene = SceneA, groupKey?: string): Step => ({
  id,
  era: 'e',
  title: id,
  caption: id,
  Scene,
  payload: undefined,
  groupKey,
})

describe('sceneKey', () => {
  it('shares a key across a group with the same scene component', () => {
    expect(sceneKey(step('a', SceneA, 'g'))).toBe(sceneKey(step('b', SceneA, 'g')))
  })

  it('separates different groups and different scene components', () => {
    expect(sceneKey(step('a', SceneA, 'g'))).not.toBe(sceneKey(step('b', SceneA, 'h')))
    expect(sceneKey(step('a', SceneA, 'g'))).not.toBe(sceneKey(step('b', SceneB, 'g')))
  })

  it('gives ungrouped steps their own key', () => {
    expect(sceneKey(step('a'))).not.toBe(sceneKey(step('b')))
  })
})
