import { describe, expect, it } from 'vitest'
import { entities, layoutId } from '../src/presentations/how-to-make-a-presentation/entities'
import type { EntityId } from '../src/presentations/how-to-make-a-presentation/entities'
import { steps } from '../src/presentations/how-to-make-a-presentation/steps'

const expectedBeats: EntityId[][] = [
  ['you', 'prompt'],
  ['skill', 'conversation', 'question'],
  ['tray', 'first'],
  ['firstLink', 'morph', 'second', 'secondLink', 'third'],
  ['ghostLink', 'ghost', 'depth'],
  ['kit'],
  ['checkLink', 'verify'],
  ['modify', 'modifyLabel', 'edited'],
  ['reveal', 'revealLabel'],
]

describe('reference scene continuity', () => {
  it('accumulates each beat with stable IDs and fixed placements in one scene group', () => {
    expect(steps).toHaveLength(expectedBeats.length)
    const placements = new Map<string, (typeof entities)[EntityId]>()

    steps.forEach((step, index) => {
      expect(step.groupKey).toBe(steps[0].groupKey)
      expect(step.Scene).toBe(steps[0].Scene)
      expect(step.payload.entityIds).toEqual(expectedBeats.slice(0, index + 1).flat())

      for (const id of step.payload.entityIds) {
        const placement = entities[id]
        const identity = layoutId(id)
        if (placements.has(identity)) expect(placement).toBe(placements.get(identity))
        placements.set(identity, placement)
      }
    })

    expect(placements.size).toBe(Object.keys(entities).length)
  })

  it('contains the diagram and aligns its kit and verification nodes', () => {
    for (const { left, top, width, height } of Object.values(entities)) {
      expect(left).toBeGreaterThanOrEqual(0)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(left + width).toBeLessThanOrEqual(880)
      expect(top + height).toBeLessThanOrEqual(380)
    }

    expect(entities.kit.top).toBeLessThanOrEqual(entities.tray.top + entities.tray.height)
    expect(entities.kit.left + entities.kit.width / 2).toBe(entities.tray.left + entities.tray.width / 2)
    expect(entities.verify.top).toBe(entities.first.top)
    expect(entities.verify.height).toBe(entities.first.height)
    expect(entities.verify.left).toBeGreaterThan(entities.ghost.left + entities.ghost.width)
    expect(entities.reveal.left).toBeLessThan(entities.tray.left)
    expect(entities.reveal.left + entities.reveal.width).toBeGreaterThan(entities.tray.left + entities.tray.width)
  })
})
