import { describe, expect, it } from 'vitest'
import { presentations } from '../../src/presentations'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { ENTITY_IDS, GEOMETRY, INTRO } from '../../src/presentations/how-to-make-a-presentation/entities'
import { CANONICAL_STEPS } from '../helpers/canonical-sample'

describe('reference sample', () => {
  it('is registered under its slug with the normative title', () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('implements the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(CANONICAL_STEPS.map((s) => [...s]))
  })

  it('gives every step a stable unique id and the diagram state it shows', () => {
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(9)
    for (const [i, step] of STEPS.entries()) {
      expect(step.id).toBeTruthy()
      expect(step.era).toBeTruthy()
      expect(step.Scene).toBeTypeOf('function')
      expect(step.payload).toEqual({ step: i + 1 })
    }
  })

  it('is one grouped scene so the diagram persists between steps', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(STEPS[0].groupKey).toBeDefined()
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })

  it('accumulates entities: unique ids, every step introduces something, none leaves', () => {
    expect(new Set(ENTITY_IDS).size).toBe(ENTITY_IDS.length)
    for (let step = 1; step <= 9; step++) {
      expect(ENTITY_IDS.some((id) => INTRO[id] === step)).toBe(true)
    }
    for (const id of ENTITY_IDS) expect(INTRO[id]).toBeLessThanOrEqual(9)
  })

  it('docks the depth control on the you node (flush under it, within its width)', () => {
    const { you, control } = GEOMETRY
    expect(control.y).toBe(you.y + you.h)
    expect(control.x).toBeGreaterThanOrEqual(you.x)
    expect(control.x + control.w).toBeLessThanOrEqual(you.x + you.w)
  })

  it('introduces the entities the spec names at the steps it names', () => {
    expect([INTRO.you, INTRO.prompt]).toEqual([1, 1])
    expect([INTRO.skill, INTRO.talk, INTRO.question]).toEqual([2, 2, 2])
    expect(INTRO.tray).toBe(3)
    expect(INTRO['card-1']).toBe(3)
    expect([INTRO['card-2'], INTRO['card-3'], INTRO['card-4']]).toEqual([4, 4, 4])
    expect([INTRO.ghost, INTRO.control]).toEqual([5, 5])
    expect(INTRO.socket).toBe(6)
    expect([INTRO.verify, INTRO.check]).toEqual([7, 7])
    expect([INTRO['modify-arc'], INTRO['edited-ring']]).toEqual([8, 8])
    expect(INTRO['reveal-frame']).toBe(9)
  })
})
