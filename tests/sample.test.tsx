import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { entities, visibleEntities, entityId } from '../src/presentations/how-to-make-a-presentation/entities'
import { OUTLINE, TITLE } from '../src/presentations/how-to-make-a-presentation/outline'
import { STEPS } from '../src/presentations/how-to-make-a-presentation/steps'
import Talk from '../src/presentations/how-to-make-a-presentation/Talk'
import Landing from '../src/Landing'
import { findPresentation, presentations } from '../src/presentations'

describe('reference sample', () => {
  it('I-37 exact canonical nine-step outline', () => {
    expect(TITLE).toBe('How to Use This Skill to Make a Presentation')
    expect(STEPS.map(s => s.era)).toEqual(['the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal'])
    expect(STEPS.map(s => s.title)).toEqual(['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"])
    expect(OUTLINE.map(s => s[2])).toEqual([
      'It starts with you, a topic, and mild overconfidence.',
      'One question at a time: the topic, the look, then each beat of the story.',
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
      'Same shapes, new beats. Every answer extends the story without redrawing it.',
      'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
      'Before saying done, it builds and renders every step — and fixes what breaks.',
      'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
      'This presentation was built exactly this way. Thanks for watching.',
    ])
  })
  it('I-38 opening conversation and first card, with morph labels between cards', () => {
    const { container } = render(<Talk />)
    expect(container.querySelector('[data-sample-entity="you"]')).toBeTruthy()
    expect(container.querySelector('[data-sample-entity="prompt"]')).toBeTruthy()
    expect(container.querySelector('[data-sample-entity="skill"]')).toBeNull()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    for (const id of ['skill', 'conversation', 'question']) expect(container.querySelector(`[data-sample-entity="${id}"]`)).toBeTruthy()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    const card = container.querySelector('[data-sample-entity="card-1"]')!
    expect(card.textContent).toContain('titlecaption◇ visual')
    expect(card.textContent).not.toContain('morph')
    expect(container.querySelector('[data-sample-entity="tray"]')).toBeTruthy()
    const entity = (id: string) => entities.find(e => e.id === id)!
    const you = entity('you'), skill = entity('skill'), arrow = entity('conversation'), chip = entity('question'), tray = entity('tray')
    expect(arrow.text).toBe('⟷')
    expect(arrow.x).toBeGreaterThan(you.x + you.w)
    expect(arrow.x + arrow.w).toBeLessThan(skill.x)
    expect(chip.y + chip.h).toBeLessThan(arrow.y)
    expect(chip.x).toBeGreaterThanOrEqual(arrow.x)
    expect(chip.x + chip.w).toBeLessThanOrEqual(arrow.x + arrow.w)
    const conversationBottom = Math.max(you.y + you.h, skill.y + skill.h, arrow.y + arrow.h)
    expect(tray.y).toBeGreaterThan(conversationBottom)
    console.info('I-38 geometry', { chipBottom: chip.y + chip.h, arrowTop: arrow.y, conversationBottom, trayTop: tray.y })
    const firstCard = entity('card-1')
    expect(firstCard.y).toBeGreaterThanOrEqual(tray.y)
    expect(firstCard.y + firstCard.h).toBeLessThanOrEqual(tray.y + tray.h)
    const link = entities.find(e => e.id === 'link-1')!
    expect(link.x).toBeGreaterThan(entities.find(e => e.id === 'card-1')!.x + 128)
    expect(link.x + link.w).toBeLessThan(entities.find(e => e.id === 'card-2')!.x)
  })
  it('I-39 cards, depth dock, and scene-kit socket accumulate at fixed coordinates', () => {
    const { container } = render(<Talk />)
    for (let i = 1; i < 6; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
    for (const id of ['card-1', 'card-2', 'card-3', 'ghost', 'depth', 'kit']) expect(container.querySelector(`[data-sample-entity="${id}"]`)).toBeTruthy()
    const you = entities.find(e => e.id === 'you')!, depth = entities.find(e => e.id === 'depth')!, tray = entities.find(e => e.id === 'tray')!, kit = entities.find(e => e.id === 'kit')!
    expect(depth.x).toBe(you.x)
    expect(depth.y).toBe(you.y + you.h)
    expect(kit.y).toBe(tray.y + tray.h)
    expect(kit.x).toBeGreaterThanOrEqual(tray.x)
    expect(kit.x + kit.w).toBeLessThanOrEqual(tray.x + tray.w)
    console.info('I-39 geometry', { trayBottom: tray.y + tray.h, socketTop: kit.y, socketLeft: kit.x, socketRight: kit.x + kit.w, trayLeft: tray.x, trayRight: tray.x + tray.w })
    for (const item of entities.filter(e => ['card', 'ghost'].includes(e.kind))) {
      expect(item.x).toBeGreaterThan(tray.x)
      expect(item.x + item.w).toBeLessThan(tray.x + tray.w)
      expect(item.y).toBeGreaterThan(tray.y)
      expect(item.y + item.h).toBeLessThan(tray.y + tray.h)
    }
    expect(container.querySelector('[data-sample-entity="tray"]')?.getAttribute('data-presentation-node')).not.toBe('Frame')
  })
  it('I-40 verification, modify arc, flag, and reveal follow the pipeline', () => {
    const { container } = render(<Talk />)
    for (let i = 1; i < 9; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
    for (const id of ['verify', 'verify-link', 'modify', 'edited', 'reveal']) expect(container.querySelector(`[data-sample-entity="${id}"]`)).toBeTruthy()
    expect(container.querySelector('[data-sample-entity="verify"]')?.textContent).toContain('✓ verifybuild + renderall steps pass')
    expect(entities.find(e => e.id === 'verify')!.y).toBe(entities.find(e => e.id === 'card-1')!.y)
    expect(container.querySelector('[data-sample-entity="reveal"]')?.getAttribute('data-presentation-node')).toBe('Frame')
    const entity = (id: string) => entities.find(e => e.id === id)!
    const skill = entity('skill'), route = entity('modify'), card = entity('card-2'), flag = entity('edited'), frame = entity('reveal'), tray = entity('tray')
    const path = container.querySelector('[data-sample-modify-path]')!
    const d = path.getAttribute('d')!
    const start = d.match(/^M([\d.]+) ([\d.]+)/)!
    const end = d.match(/Q0 60 0 80 V([\d.]+)$/)!
    // Resolve the actual rendered path's local endpoints into canvas coordinates.
    expect(route.x + Number(start[1])).toBe(skill.x + skill.w)
    expect(route.y + Number(start[2])).toBe(skill.y + skill.h / 2)
    expect(route.y + Number(end[1])).toBe(card.y)
    expect(route.x).toBeGreaterThan(card.x)
    expect(route.x).toBeLessThan(card.x + card.w)
    expect(route.y + Number(end[1])).toBeGreaterThan(tray.y)
    expect(path.getAttribute('marker-end')).toBe('url(#sample-modify-arrow)')
    expect(container.querySelector('[data-sample-entity="edited"]')?.getAttribute('data-sample-flags')).toBe('card-2')
    expect(flag.x).toBeGreaterThanOrEqual(card.x)
    expect(flag.x + flag.w).toBe(card.x + card.w)
    expect(flag.y + flag.h).toBe(card.y)
    expect(route.x).toBeLessThan(flag.x) // The incoming arrow avoids the flag text.
    console.info('I-40 rendered path geometry', {
      start: [route.x + Number(start[1]), route.y + Number(start[2])],
      skillRightMidpoint: [skill.x + skill.w, skill.y + skill.h / 2],
      end: [route.x, route.y + Number(end[1])],
      targetCard: { id: card.id, left: card.x, right: card.x + card.w, top: card.y },
      trayTop: tray.y, flagBottom: flag.y + flag.h,
      reveal: { left: frame.x, top: frame.y, right: frame.x + frame.w, bottom: frame.y + frame.h },
    })
    for (const item of entities.filter(e => e.id !== 'reveal')) {
      expect(item.x).toBeGreaterThan(frame.x)
      expect(item.y).toBeGreaterThan(frame.y)
      expect(item.x + item.w).toBeLessThan(frame.x + frame.w)
      expect(item.y + item.h).toBeLessThan(frame.y + frame.h)
    }
  })
  it('I-41 all nine states preserve continuing nodes and accumulate without rearrangement', () => {
    const { container } = render(<Talk />)
    let prior: Map<string, Element> = new Map()
    for (let beat = 1; beat <= 9; beat++) {
      for (const entity of visibleEntities(beat)) {
        const node = container.querySelector(`[data-sample-entity="${entity.id}"]`)!
        expect(node).toBeTruthy()
        if (prior.has(entity.id)) expect(node).toBe(prior.get(entity.id))
        expect((node as HTMLElement).style.left).toBe(`${entity.x}px`)
        expect((node as HTMLElement).style.top).toBe(`${entity.y}px`)
        expect(node.getAttribute('data-presentation-entity')).toBe(entityId(entity.id))
      }
      expect(STEPS[beat - 1].Scene).toBe(STEPS[0].Scene)
      expect(STEPS[beat - 1].groupKey).toBe(STEPS[0].groupKey)
      prior = new Map(visibleEntities(beat).map(e => [e.id, container.querySelector(`[data-sample-entity="${e.id}"]`)!]))
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    }
    expect(new Set(entities.map(e => e.id)).size).toBe(entities.length)
    for (const e of entities) { expect(e.x).toBeGreaterThanOrEqual(0); expect(e.y).toBeGreaterThanOrEqual(0); expect(e.x + e.w).toBeLessThanOrEqual(880); expect(e.y + e.h).toBeLessThanOrEqual(380) }
  })
  it('I-35 captions update through previous and next controls', () => {
    const { container } = render(<Talk />)
    const caption = () => container.querySelector('[data-presentation-caption]')?.textContent
    expect(caption()).toBe(OUTLINE[0][2])
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }))
    expect(caption()).toBe(OUTLINE[1][2])
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }))
    expect(caption()).toBe(OUTLINE[0][2])
    expect(screen.getByRole('button', { name: 'Previous step' }).hasAttribute('disabled')).toBe(true)
  })
  it('I-28 registry lookup preserves multiple entries and unknown-route fallback', () => {
    const registry = [...presentations, { ...presentations[0], slug: 'second', title: 'Another presentation' }]
    render(<Landing registry={registry} />)
    for (const item of registry) expect(screen.getByRole('link', { name: new RegExp(item.title) }).getAttribute('href')).toBe(`/${item.slug}`)
    expect(findPresentation('/second', registry)?.slug).toBe('second')
    expect(findPresentation('/how-to-make-a-presentation/', registry)).toBe(presentations[0])
    expect(findPresentation('/missing', registry)).toBeUndefined()
  })
})
