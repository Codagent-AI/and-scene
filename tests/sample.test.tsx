import { act, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { STEPS, EvolvingScene } from '../src/presentations/how-to-make-a-presentation/steps'
import { entities, visibleEntities, identity } from '../src/presentations/how-to-make-a-presentation/entities'
import { Presentation } from '../src/presentation-kit/Presentation'
it('I-34 canonical sample has nine ordered steps in one persistent group', () => {
  expect(STEPS).toHaveLength(9)
  expect(new Set(STEPS.map(s => s.id)).size).toBe(9)
  expect(new Set(STEPS.map(s => s.groupKey)).size).toBe(1)
  expect(STEPS.every(s => s.Scene === EvolvingScene)).toBe(true)
  expect(STEPS.map(s => s.era)).toEqual(['the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal'])
})
it('I-35 initial conversation entities accumulate without coordinate changes', () => {
  expect(visibleEntities(0).map(e => e.id)).toEqual(['you', 'prompt'])
  expect(visibleEntities(1).map(e => e.id)).toEqual(['you', 'prompt', 'skill', 'question', 'conversation'])
  expect(visibleEntities(0).every(e => visibleEntities(1).includes(e))).toBe(true)
})
it('I-36 cards accumulate with inter-card morph annotations and depth control', () => {
  expect(visibleEntities(2).map(e => e.id)).toContain('tray')
  for (const name of ['card-1', 'card-2', 'card-3', 'ghost', 'depth']) expect(visibleEntities(4).find(e => e.id === name)).toBeTruthy()
  for (const e of entities.filter(e => e.kind === 'card')) expect(e.detail).toBe('title · caption · visual')
  for (const id of ['link-1', 'link-2']) { const e = entities.find(e => e.id === id)!; expect(e.detail).toBe('morph'); expect(e.x).toBeGreaterThan(170) }
  expect(entities.find(e => e.id === 'depth')?.x).toBe(entities.find(e => e.id === 'you')?.x)
})
it('I-37 socket docks under tray and verification follows cards in the tray row', () => {
  const find = (id: string) => entities.find(e => e.id === id)!
  expect(find('kit').y).toBe(find('tray').y + find('tray').height)
  expect(find('verify').y).toBe(find('card-1').y)
  expect(find('verify').x).toBeGreaterThan(find('ghost').x)
  expect(find('verify').detail).toBe('build ✓  render ✓')
  expect(visibleEntities(5).map(e => e.id)).not.toContain('verify')
  expect(visibleEntities(6).map(e => e.id)).toContain('verify')
})
it('I-38 final reveal preserves every continuing entity and Scene instance', async () => {
  const { container } = render(<Presentation title="Sample" steps={STEPS} />)
  const you = container.querySelector('[data-entity-id="you"]')
  for (let beat = 1; beat < 9; beat++) {
    await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) })
    expect(container.querySelector('[data-entity-id="you"]')).toBe(you)
    expect(visibleEntities(beat - 1).every(e => visibleEntities(beat).includes(e))).toBe(true)
  }
  expect(screen.getByLabelText('modify arc from conversation to edited card')).toBeTruthy()
  expect(container.querySelector('[data-entity-id="edited"]')).toBeTruthy()
  expect(container.querySelector('[data-entity-id="reveal"]')).toBeTruthy()
  for (const entity of entities) {
    const node = container.querySelector(`[data-entity-id="${entity.id}"]`)!
    expect(node.parentElement!.style.left).toBe(`${entity.x}px`)
    expect(node.parentElement!.style.top).toBe(`${entity.y}px`)
    expect(identity(entity.id)).toMatch(/^how-to-make-a-presentation:/)
  }
})
