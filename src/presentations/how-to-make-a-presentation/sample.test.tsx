import { render } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { ARROWS, ENTITIES, FIRST_STEP, GEOMETRY, MORPH_CHIPS, type EntityId } from './entities'
import { Scene } from './Scene'
import { STEPS } from './steps'

// The normative outline, copied from the presentation-verification spec.
const SPEC = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

// Each beat is rendered once; detached clones keep the assertions cheap.
const stages: HTMLElement[][] = []
beforeAll(() => {
  for (let stage = 0; stage < 9; stage++) {
    const { container, unmount } = render(<Scene payload={{ stage }} stepIndex={stage} />)
    stages.push([...container.querySelectorAll<HTMLElement>('[data-presentation-entity]')].map((e) => e.cloneNode(true) as HTMLElement))
    unmount()
  }
})
const present = (stage: number) => stages[stage]
const ids = (stage: number) => present(stage).map((e) => e.dataset.presentationEntity)
const geo = (id: EntityId) => GEOMETRY[id as keyof typeof GEOMETRY]

describe('sample steps', () => {
  it('has the nine normative steps, in order, with exact text', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(SPEC.map((s) => [...s]))
  })

  it('gives every step a unique stable id and a non-empty one-line title', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    for (const s of STEPS) {
      expect(s.id).toMatch(/\S/)
      expect(s.title).not.toContain('\n')
      expect(s.payload).toBeDefined()
    }
  })

  it('shares one group and one Scene so the diagram evolves instead of being redrawn', () => {
    expect(new Set(STEPS.map((s) => s.groupKey))).toEqual(new Set(['scene']))
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.stage)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
})

describe('sample scene accumulation', () => {
  it('shows exactly the entities introduced so far at every step', () => {
    for (let stage = 0; stage < 9; stage++) {
      const expected = ENTITIES.filter((id) => FIRST_STEP[id] <= stage)
      const shown = ids(stage).filter((id) => !id!.startsWith('morph-') && id !== 'reveal-label')
      expect(new Set(shown), `step ${stage + 1}`).toEqual(new Set(expected))
    }
  })

  it('never drops or moves an entity once it is on screen', () => {
    for (const id of ENTITIES) {
      const g = GEOMETRY[id as keyof typeof GEOMETRY]
      if (!g) continue
      const samples = new Set<string>()
      for (let stage = FIRST_STEP[id]; stage < 9; stage++) {
        const el = present(stage).find((e) => e.dataset.presentationEntity === id)
        expect(el, `${id} at step ${stage + 1}`).toBeDefined()
        samples.add([el!.style.left, el!.style.top, el!.style.width, el!.style.height].join('|'))
        }
      expect(samples.size, `${id} geometry`).toBe(1)
    }
  })

  const first = (id: EntityId) => FIRST_STEP[id] + 1
  const bottom = (id: EntityId) => geo(id).y + geo(id).h!
  const right = (id: EntityId) => geo(id).x + geo(id).w!

  it('beats 1–2: you and a prompt, then the skill with a two-way link and a chip above it', () => {
    expect([first('you'), first('prompt'), first('skill'), first('link-you-skill'), first('question-chip')]).toEqual([1, 1, 2, 2, 2])
    const link = ARROWS['link-you-skill']
    expect(link.both).toBe(true)
    expect(link.from.x).toBeLessThanOrEqual(right('you'))
    expect(link.to.x).toBeGreaterThanOrEqual(geo('skill').x)
    expect(bottom('question-chip')).toBeLessThanOrEqual(link.from.y)
    const el = present(1).find((e) => e.dataset.presentationEntity === 'link-you-skill')!
    expect(el.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
  })

  it('beat 3: a tray under the conversation holds a card with title, caption and visual; morph info sits on the link', () => {
    expect(first('tray')).toBe(3)
    expect(geo('tray').y).toBeGreaterThan(bottom('prompt'))
    const card = present(2).find((e) => e.dataset.presentationEntity === 'step-card-1')!
    expect(card.querySelector('b')!.textContent).toBe('title')
    expect(card.textContent).toContain('caption')
    expect(card.querySelector('[data-part="visual"]')).not.toBeNull()
    const chips = present(3).filter((e) => e.dataset.presentationEntity?.startsWith('morph-'))
    expect(chips.length).toBeGreaterThan(0)
    for (const m of MORPH_CHIPS) {
      const chip = { x: m.x, w: 22 }
      for (const c of ['step-card-1', 'step-card-2', 'step-card-3'] as const) {
        const overlapsX = chip.x < right(c) && chip.x + chip.w > geo(c).x
        expect(overlapsX, `${m.id} vs ${c}`).toBe(false)
      }
    }
    expect(card.querySelector('[data-presentation-entity^="morph-"]')).toBeNull()
  })

  it('beat 4: more cards land in the same row and the earlier ones stay put', () => {
    expect([first('step-card-2'), first('step-card-3')]).toEqual([4, 4])
    expect(new Set(['step-card-1', 'step-card-2', 'step-card-3'].map((c) => geo(c as EntityId).y)).size).toBe(1)
  })

  it('beat 5: a ghost card in the card row and a partial↔full control docked on you', () => {
    expect([first('ghost-card'), first('depth-control')]).toEqual([5, 5])
    expect(geo('ghost-card').y).toBe(geo('step-card-1').y)
    const c = geo('depth-control')
    const you = geo('you')
    expect(c.x).toBeGreaterThanOrEqual(you.x)
    expect(c.x).toBeLessThan(right('you'))
    expect(Math.abs(c.y + c.h! - you.y)).toBeLessThanOrEqual(4)
    const el = present(4).find((e) => e.dataset.presentationEntity === 'depth-control')!
    expect(el.textContent).toBe('partial ↔ full')
  })

  it('beat 6: the scene-kit socket plugs into the bottom edge of an unframed tray', () => {
    expect(first('scene-kit')).toBe(6)
    expect(geo('scene-kit').y).toBe(bottom('tray'))
    const kit = geo('scene-kit')
    expect(kit.x).toBeGreaterThanOrEqual(geo('tray').x)
    expect(right('scene-kit')).toBeLessThanOrEqual(right('tray'))
    const six = present(5)
    expect(six.some((e) => e.dataset.presentationNode === 'frame')).toBe(false)
    expect(six.find((e) => e.dataset.presentationEntity === 'scene-kit')!.textContent).toBe('scene kit')
  })

  it('beat 7: verify is chained after the cards in the same row with build, render and a pass check', () => {
    expect(first('verify')).toBe(7)
    expect(geo('verify').y).toBe(geo('step-card-1').y)
    for (const c of ['step-card-1', 'step-card-2', 'step-card-3', 'ghost-card'] as const) {
      expect(geo('verify').x).toBeGreaterThanOrEqual(right(c))
    }
    const verify = present(6).find((e) => e.dataset.presentationEntity === 'verify')!
    expect(verify.textContent).toContain('build')
    expect(verify.textContent).toContain('render')
    expect(first('pass-check')).toBe(7)
    expect(present(6).some((e) => e.dataset.presentationEntity === 'pass-check')).toBe(true)
  })

  it('beat 8: a modify arc from the conversation down into the route, and a flagged card', () => {
    expect(first('modify-arc')).toBe(8)
    const arc = ARROWS['modify-arc']
    expect(arc.from.y).toBeLessThanOrEqual(bottom('prompt') + 4)
    expect(arc.to.y).toBeGreaterThanOrEqual(geo('tray').y)
    const cards = present(7).filter((e) => e.dataset.presentationEntity?.startsWith('step-card'))
    expect(cards.filter((c) => c.dataset.state === 'edited').map((c) => c.dataset.presentationEntity)).toEqual(['step-card-2'])
    expect(present(7).some((e) => e.dataset.presentationEntity === 'edited-flag')).toBe(true)
  })

  it('beat 9: a labeled outer frame encloses the whole diagram', () => {
    expect(first('reveal-frame')).toBe(9)
    const frame = geo('reveal-frame')
    for (const id of ENTITIES) {
      const g = GEOMETRY[id as keyof typeof GEOMETRY]
      if (!g || id === 'reveal-frame') continue
      expect(g.x, id).toBeGreaterThan(frame.x)
      expect(g.y, id).toBeGreaterThan(frame.y)
      expect(g.x + g.w!, id).toBeLessThan(frame.x + frame.w!)
      expect(g.y + g.h!, id).toBeLessThan(frame.y + frame.h!)
    }
    const el = present(8).find((e) => e.dataset.presentationEntity === 'reveal-frame')!
    expect(el.dataset.presentationNode).toBe('frame')
    expect(el.textContent).toMatch(/looking at one/)
  })

  it('keeps the pass check as the only marked intentional overlap', () => {
    const { container } = render(<Scene payload={{ stage: 8 }} stepIndex={8} />)
    const marked = [...container.querySelectorAll('[data-presentation-allow-overlap]')]
    expect(marked.map((m) => m.querySelector('[data-presentation-entity]')!.getAttribute('data-presentation-entity'))).toEqual(['pass-check'])
  })
})
