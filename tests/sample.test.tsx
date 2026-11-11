import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import { ENTITIES, entitiesForBeat, entityId } from '../src/presentations/how-to-make-a-presentation/entities'
import { SampleScene } from '../src/presentations/how-to-make-a-presentation/steps/Scene'
// @ts-expect-error The shipped JavaScript validator is tested directly.
import { REFERENCE_STEPS } from '../scripts/reference.mjs'

describe('reference sample', () => {
  it('I-26 has exactly nine normative eras titles captions and a persistent typed group', () => {
    expect(STEPS.map(step => [step.era, step.title, step.caption])).toEqual(REFERENCE_STEPS)
    expect(new Set(STEPS.map(step => step.id)).size).toBe(9)
    expect(new Set(STEPS.map(step => step.Scene)).size).toBe(1)
    expect(new Set(STEPS.map(step => step.groupKey)).size).toBe(1)
  })
  it('I-27 establishes you prompt skill conversation and question with fixed positions', () => {
    expect(entitiesForBeat(1).map(e => e.name)).toEqual(['you', 'prompt'])
    const { container, rerender } = render(<SampleScene payload={{ beat: 1 }} />)
    const original = container.querySelector('[data-entity-name="you"]')
    rerender(<SampleScene payload={{ beat: 2 }} />)
    expect(container.querySelector('[data-entity-name="you"]')).toBe(original)
    for (const name of ['skill', 'conversation', 'question']) expect(container.querySelector(`[data-entity-name="${name}"]`)).not.toBeNull()
    expect(container.textContent).toContain('↔')
    expect(container.textContent).toContain('one question at a time')
  })
  it('I-28 accumulates tray cards and link morph labels then ghost and depth control', () => {
    expect(entitiesForBeat(3).some(e => e.name === 'tray')).toBe(true)
    const first = entitiesForBeat(3).find(e => e.name === 'card-1')!
    expect(first.detail).toBe('title · caption · visual')
    const { container, rerender } = render(<SampleScene payload={{ beat: 3 }} />)
    const card = container.querySelector('[data-entity-name="card-1"]')
    rerender(<SampleScene payload={{ beat: 4 }} />)
    expect(container.querySelector('[data-entity-name="card-1"]')).toBe(card)
    for (const name of ['card-2', 'card-3']) expect(container.querySelector(`[data-entity-name="${name}"]`)?.textContent).toContain('title · caption · visual')
    for (const name of ['link-1', 'link-2']) expect(container.querySelector(`[data-entity-name="${name}"]`)?.textContent).toContain('morph')
    expect(card?.textContent).not.toContain('morph')
    rerender(<SampleScene payload={{ beat: 5 }} />)
    expect(container.querySelector('.ghost')?.textContent).toContain('your next beat')
    expect(container.querySelector('.depth')?.textContent).toContain('partial ↔ full')
    const you = ENTITIES.find(e => e.name === 'you')!, depth = ENTITIES.find(e => e.name === 'depth')!
    expect(depth.x).toBe(you.x)
    expect(depth.y).toBeGreaterThanOrEqual(you.y + you.height)
  })
  it('I-29 plugs kit into unframed tray and chains passing verify in the card row', () => {
    const tray = ENTITIES.find(e => e.name === 'tray')!, kit = ENTITIES.find(e => e.name === 'scene-kit')!
    expect(tray.kind).not.toBe('frame')
    expect(kit.y).toBeLessThanOrEqual(tray.y + tray.height)
    expect(kit.y + kit.height).toBeGreaterThan(tray.y + tray.height)
    const verify = ENTITIES.find(e => e.name === 'verify')!, card = ENTITIES.find(e => e.name === 'card-3')!
    expect(verify.y).toBe(card.y)
    expect(verify.x).toBeGreaterThan(card.x + card.width)
    const { container } = render(<SampleScene payload={{ beat: 7 }} />)
    expect(container.querySelector('[data-entity-name="scene-kit"]')?.textContent).toContain('shared scene kit')
    expect(container.querySelector('[data-entity-name="verify"]')?.textContent).toBe('✓build + render')
    expect(container.querySelector('[data-entity-name="verify"]')?.className).toContain('verify')
  })
  it('I-30 modifies in place then adds an outer labeled reveal around all accumulated entities', () => {
    const { container, rerender } = render(<SampleScene payload={{ beat: 7 }} />)
    const card = container.querySelector('[data-entity-name="card-2"]')
    rerender(<SampleScene payload={{ beat: 8 }} />)
    expect(container.querySelector('[data-entity-name="card-2"]')).toBe(card)
    expect(card?.className).toContain('refined')
    expect(container.querySelector('[data-entity-name="modify"] path')).not.toBeNull()
    expect(container.querySelector('[data-entity-name="edited"]')?.textContent).toContain('refined')
    rerender(<SampleScene payload={{ beat: 9 }} />)
    expect(container.querySelector('[data-entity-name="reveal"]')?.textContent).toContain('YOU ARE LOOKING AT ONE')
    expect(container.querySelectorAll('[data-presentation-entity]').length).toBe(ENTITIES.length)
    const frame = ENTITIES.find(e => e.name === 'reveal')!
    for (const entity of ENTITIES.filter(e => e !== frame)) {
      expect(entity.x).toBeGreaterThanOrEqual(frame.x)
      expect(entity.y).toBeGreaterThanOrEqual(frame.y)
      expect(entity.x + entity.width).toBeLessThanOrEqual(frame.x + frame.width)
      expect(entity.y + entity.height).toBeLessThanOrEqual(frame.y + frame.height)
    }
  })
  it('entities accumulate with unique stable identity and authored coordinates inside canvas', () => {
    expect(new Set(ENTITIES.map(e => entityId(e.name))).size).toBe(ENTITIES.length)
    for (let beat = 2; beat <= 9; beat++) {
      const current = entitiesForBeat(beat)
      for (const previous of entitiesForBeat(beat - 1)) expect(current).toContain(previous)
    }
    for (const e of ENTITIES) {
      expect(e.x).toBeGreaterThanOrEqual(0); expect(e.y).toBeGreaterThanOrEqual(0)
      expect(e.x + e.width).toBeLessThanOrEqual(880); expect(e.y + e.height).toBeLessThanOrEqual(380)
    }
  })
})
