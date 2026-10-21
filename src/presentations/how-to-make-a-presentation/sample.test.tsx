import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from '../index'
import { DiagramScene } from './DiagramScene'
import { AT, ID, INTRODUCED_AT } from './entities'
import type { EntityId } from './entities'
import { STEPS } from './steps'
import Talk from './Talk'

// Independent transcription of the normative table; not shared with the sample or the verifier.
const TABLE = [
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

describe('reference sample outline', () => {
  it('is registered under its slug and title', () => {
    expect(PRESENTATIONS.find((p) => p.slug === 'how-to-make-a-presentation')?.title).toBe(
      'How to Use This Skill to Make a Presentation',
    )
  })

  it('has exactly the nine normative steps in order, with unique stable ids', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(TABLE.map((r) => [...r]))
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(new Set(STEPS.map((s) => s.era))).toEqual(new Set(['the ask', 'the gathering', 'the build', 'the loop', 'the reveal']))
  })

  it('shares one scene group so the diagram persists', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.stage)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
})

const idOf = (key: EntityId) => ID[key]
type Box = { x: number; y: number; w: number; h: number }

function scene(stage: number) {
  const view = render(<DiagramScene payload={{ stage }} />)
  const el = (key: EntityId) => view.container.querySelector<HTMLElement>(`[data-presentation-id="${idOf(key)}"]`)
  const rect = (key: EntityId): Box => {
    const e = el(key)!
    return { x: parseFloat(e.style.left), y: parseFloat(e.style.top), w: parseFloat(e.style.width), h: parseFloat(e.style.height) }
  }
  const present = () =>
    (Object.keys(ID) as EntityId[]).filter((k) => el(k) !== null)
  return { ...view, el, rect, present }
}

const contains = (outer: Box, inner: Box) =>
  outer.x <= inner.x && outer.y <= inner.y && outer.x + outer.w >= inner.x + inner.w && outer.y + outer.h >= inner.y + inner.h

/** Entities each step's scene content must show, from the normative table. */
const EXPECTED_ENTITIES: EntityId[][] = [
  ['you', 'prompt'],
  ['skill', 'ask', 'question'],
  ['tray', 'route', 'card1', 'link1', 'link1Label'],
  ['card2', 'card3', 'link2', 'link2Label'],
  ['ghost', 'link3', 'depth'],
  ['socket', 'plug'],
  ['verify', 'link4', 'pass'],
  ['modify', 'modifyLabel', 'flag', 'edited'],
  ['frame'],
]

describe('sample scene content', () => {
  it.each(EXPECTED_ENTITIES.map((added, stage) => [stage, added] as const))(
    'step %i introduces exactly its normative entities',
    (stage, added) => {
      const { present } = scene(stage)
      const expected = EXPECTED_ENTITIES.slice(0, stage + 1).flat()
      expect(present().sort()).toEqual([...expected].sort())
      expect(added.every((k) => INTRODUCED_AT[k] === stage)).toBe(true)
    },
  )

  it('step 1: a you entity and a prompt bubble', () => {
    const { el } = scene(0)
    expect(el('you')!.textContent).toBe('you')
    expect(el('prompt')!.textContent).toContain('prompt')
  })

  it('step 2: a skill node and a two-way arrow with a question chip above it', () => {
    const { el, rect } = scene(1)
    expect(el('skill')!.textContent).toBe('skill')
    expect(el('ask')!.querySelector('[data-presentation-arrow-line]')!.getAttribute('marker-start')).toBeTruthy()
    expect(el('question')!.textContent).toContain('question')
    const arrowY = rect('ask').y + rect('ask').h / 2
    expect(rect('question').y + rect('question').h).toBeLessThanOrEqual(arrowY)
    expect(rect('question').x).toBeGreaterThan(rect('you').x + rect('you').w)
    expect(rect('question').x + rect('question').w).toBeLessThan(rect('skill').x)
  })

  it('step 3: a tray under the conversation with a first card whose parts are title, caption and visual; morphs sit on the link', () => {
    const { el, rect } = scene(2)
    expect(rect('tray').y).toBeGreaterThan(rect('you').y + rect('you').h)
    const card = el('card1')!
    expect(card.textContent).toContain('title')
    expect(card.textContent).toContain('caption')
    expect(card.textContent).toContain('visual')
    expect(card.textContent).not.toMatch(/morph/)
    expect(el('link1Label')!.textContent).toBe('morphs')
    const label = rect('link1Label')
    expect(label.x).toBeGreaterThanOrEqual(rect('card1').x + rect('card1').w)
    expect(label.x + label.w).toBeLessThanOrEqual(AT.card2!.x)
    expect(contains(rect('tray'), rect('card1'))).toBe(true)
  })

  it('step 4: more cards land and everything already shown stays where it was', () => {
    const before = scene(2)
    const rects = Object.fromEntries(before.present().map((k) => [k, before.rect(k)]))
    before.unmount()
    const after = scene(3)
    for (const [key, box] of Object.entries(rects)) expect(after.rect(key as EntityId)).toEqual(box)
    expect(after.present()).toEqual(expect.arrayContaining(['card2', 'card3']))
  })

  it('step 5: a dashed ghost card and a partial↔full control docked on you', () => {
    const { el, rect } = scene(4)
    expect(el('ghost')!.hasAttribute('data-presentation-ghost')).toBe(true)
    expect(el('depth')!.textContent).toContain('partial ↔ full')
    const you = rect('you')
    const depth = rect('depth')
    expect(depth.y).toBeGreaterThanOrEqual(you.y + you.h)
    expect(depth.y - (you.y + you.h)).toBeLessThanOrEqual(16)
    expect(depth.x).toBeGreaterThanOrEqual(you.x)
    expect(depth.x + depth.w).toBeLessThanOrEqual(you.x + you.w)
  })

  it('step 6: a labeled scene-kit socket plugs into the bottom of the unframed tray', () => {
    const { el, rect, present } = scene(5)
    expect(el('socket')!.textContent).toContain('scene kit')
    const cardsBottom = AT.card1!.y + AT.card1!.h
    expect(rect('socket').y).toBeGreaterThanOrEqual(cardsBottom)
    expect(rect('socket').y - cardsBottom).toBeLessThanOrEqual(16)
    // Arrow boxes carry 8px of padding around their endpoints.
    expect(rect('plug').y + 8).toBe(cardsBottom)
    expect(rect('plug').y + rect('plug').h - 8).toBe(rect('socket').y)
    expect(present()).not.toContain('frame')
    expect(el('tray')!.querySelector('[data-presentation-node="frame"]')).toBeNull()
  })

  it('step 7: a verify node chained after the cards in the same row with a green pass', () => {
    const { el, rect } = scene(6)
    expect(el('verify')!.textContent).toContain('build')
    expect(el('verify')!.textContent).toContain('render')
    expect(rect('verify').y).toBe(rect('card1').y)
    expect(rect('verify').x).toBeGreaterThan(rect('ghost').x)
    expect(rect('link4').x).toBeGreaterThanOrEqual(rect('ghost').x)
    expect(el('pass')!.getAttribute('data-presentation-state')).toBe('pass')
    expect(el('pass')!.textContent).toContain('pass')
  })

  it('step 8: a modify arc from the conversation into the route and a flagged edited card', () => {
    const { el, rect } = scene(7)
    expect(el('modifyLabel')!.textContent).toBe('modify')
    const arc = rect('modify')
    expect(arc.y).toBeLessThan(rect('tray').y)
    expect(arc.y + arc.h).toBeGreaterThanOrEqual(rect('card2').y)
    expect(el('modify')!.querySelector('[data-presentation-arrow-line]')!.getAttribute('d')).toMatch(/Q/)
    expect(contains(rect('flag'), rect('card2'))).toBe(true)
    expect(el('edited')!.textContent).toContain('edited')
  })

  it('step 9: only now an outer labeled frame draws around the whole diagram', () => {
    const { el, rect, present } = scene(8)
    expect(el('frame')!.querySelector('[data-presentation-frame-label]')!.textContent).toBeTruthy()
    for (const key of present().filter((k) => k !== 'frame' && rect(k) && !Number.isNaN(rect(k).x))) {
      expect(contains(rect('frame'), rect(key)), key).toBe(true)
    }
  })

  it('accumulates: ids never disappear and persisting entities keep their geometry', () => {
    let previous: Record<string, Box> = {}
    for (let stage = 0; stage < 9; stage++) {
      const view = scene(stage)
      const current = Object.fromEntries(view.present().map((k) => [k, view.rect(k)]))
      for (const [key, box] of Object.entries(previous)) {
        expect(current[key], `${key} missing at step ${stage + 1}`).toBeDefined()
        if (!Number.isNaN(box.x)) expect(current[key]).toEqual(box)
      }
      previous = current
      view.unmount()
    }
  })

  it('stacks intentionally: the tray encloses its cards and the flag ring sits over card 2', () => {
    expect(contains(AT.tray!, AT.card1!)).toBe(true)
    expect(contains(AT.tray!, AT.verify!)).toBe(true)
    expect(contains(AT.flag!, AT.card2!)).toBe(true)
  })
})

const nextKey = () => act(() => void fireEvent.keyDown(document.body, { key: 'ArrowRight' }))
const prevKey = () => act(() => void fireEvent.keyDown(document.body, { key: 'ArrowLeft' }))

describe('sample continuity while navigating', () => {
  it('reuses the same DOM nodes for continuing entities and starts newcomers invisible', () => {
    render(<Talk />)
    const you = document.querySelector(`[data-presentation-id="${ID.you}"]`)
    const youWrapper = document.querySelector(`[data-presentation-entity="you"]`) as HTMLElement
    for (let i = 0; i < 8; i++) {
      nextKey()
      expect(document.querySelector(`[data-presentation-id="${ID.you}"]`)).toBe(you)
      expect(youWrapper.style.opacity).not.toBe('0')
    }
    expect(document.querySelectorAll('[data-presentation-layer]')).toHaveLength(1)
  })

  it('animates newcomers in from invisible and departing entities out when stepping back', async () => {
    render(<Talk />)
    nextKey()
    expect((document.querySelector('[data-presentation-entity="skill"]') as HTMLElement).style.opacity).toBe('0')
    prevKey()
    expect(document.querySelector('[data-presentation-entity="skill"]')).not.toBeNull() // still exiting
    await waitFor(() => expect(document.querySelector('[data-presentation-entity="skill"]')).toBeNull(), { timeout: 3000 })
    expect(document.querySelector('[data-presentation-entity="you"]')).not.toBeNull()
  })

  it('shows each step title and caption from the table in browse mode', () => {
    render(<Talk />)
    TABLE.forEach(([, title, caption], i) => {
      expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(title)
      expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe(caption)
      expect(document.querySelector('[data-step-index]')!.getAttribute('data-step-index')).toBe(String(i))
      nextKey()
    })
  })
})
