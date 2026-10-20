import { act, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { isValidElement, type ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../../presentation-kit/index.ts'
import { key } from '../../presentation-kit/testing.tsx'
import { PRESENTATIONS } from '../index.ts'
import { STEP_MODULES } from './modules.ts'
import { SampleScene } from './SampleScene.tsx'
import { STEPS } from './steps.ts'

// Independent copy of the normative outline in the presentation-verification spec.
const OUTLINE = [
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

interface Node {
  key: string
  kind: string
  props: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** The entity element inside each keyed Appear wrapper. */
function nodes(upTo: number): Node[] {
  return STEP_MODULES.slice(0, upTo)
    .flatMap((m) => m.entities())
    .map((wrapper) => {
      const child = (wrapper as ReactElement<{ children: ReactElement<Record<string, unknown>> }>).props.children
      expect(isValidElement(child)).toBe(true)
      return { key: String(wrapper.key), kind: String(child.props['data-kind']), props: child.props }
    })
}
const byKind = (all: Node[], kind: string) => all.filter((n) => n.kind === kind)
const one = (all: Node[], kind: string) => {
  const found = byKind(all, kind)
  expect(found, kind).toHaveLength(1)
  return found[0]
}
type R = { x: number; y: number; w: number; h: number }
const within = (inner: R, outer: R) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h

describe('outline', () => {
  it('has exactly the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(OUTLINE)
  })

  it('gives every step a unique stable id, a scene and a payload', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    for (const step of STEPS) {
      expect(step.Scene).toBe(SampleScene)
      expect(step.payload).toBeDefined()
      expect(step.title.length).toBeGreaterThan(0)
    }
  })

  it('is registered under its slug with the sample title', () => {
    const entry = PRESENTATIONS.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(new Set(PRESENTATIONS.map((p) => p.slug)).size).toBe(PRESENTATIONS.length)
  })

  it('renders each outline title and caption in browse mode, in order, with scene entities', () => {
    render(<Presentation steps={STEPS} initialMode="browse" />)
    OUTLINE.forEach(([era, title, caption], i) => {
      expect(document.querySelector('[data-presentation-era]')!.textContent).toBe(era)
      expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(title)
      expect(document.querySelector('[data-presentation-caption]')!.textContent).toBe(caption)
      expect(document.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')).toBe(String(i))
      expect(document.querySelectorAll('[data-presentation-entity]').length).toBeGreaterThan(0)
      key('ArrowRight')
    })
  })
})

describe('scene content per step', () => {
  it('1: a you entity and a prompt bubble', () => {
    const all = nodes(1)
    expect(all.map((n) => n.kind).sort()).toEqual(['prompt', 'you'])
  })

  it('2: a skill node and a two-way arrow with a question chip above it', () => {
    const all = nodes(2)
    one(all, 'skill')
    const arrow = one(all, 'converse')
    expect(arrow.props.bidirectional).toBe(true)
    expect(arrow.props.from.x).toBeLessThan(arrow.props.to.x)
    const chip = one(all, 'question').props.rect as R
    expect(chip.y + chip.h).toBeLessThan(arrow.props.from.y)
  })

  it('3: a tray with the first card carrying title, caption and visual, and no links yet', () => {
    const all = nodes(3)
    one(all, 'tray')
    expect(byKind(all, 'card')).toHaveLength(1)
    const parts = byKind(all, 'card-part')
    expect(parts.map((p) => p.props.children)).toEqual(['title', 'caption', 'visual'])
    const card = one(all, 'card').props.rect as R
    for (const p of parts) expect(within(p.props.rect, card)).toBe(true)
    expect(byKind(all, 'link')).toHaveLength(0)
  })

  it('4: more cards in the tray, with what morphs drawn on the links, not inside the cards', () => {
    const all = nodes(4)
    const cards = byKind(all, 'card').map((c) => c.props.rect as R)
    expect(cards).toHaveLength(3)
    expect(new Set(cards.map((c) => c.y)).size).toBe(1)
    const morphs = byKind(all, 'morph')
    expect(morphs).toHaveLength(2)
    for (const m of morphs) for (const c of cards) expect(within(m.props.rect, c)).toBe(false)
    expect(byKind(all, 'link')).toHaveLength(2)
    for (const p of byKind(all, 'card-part')) expect(['title', 'caption', 'visual']).toContain(p.props.children)
  })

  it('5: a dashed ghost card and a partial/full control docked on you', () => {
    const all = nodes(5)
    expect(one(all, 'ghost').props['data-presentation-ghost']).toBe('')
    expect(one(all, 'depth').props['data-docked-to']).toBe('you')
    const css = readFileSync(path.join(import.meta.dirname, 'talk.css'), 'utf8')
    expect(css).toMatch(/\[data-kind='ghost'\][^}]*dashed/)
  })

  it('6: the scene-kit socket plugs into the bottom edge of an unframed tray', () => {
    const all = nodes(6)
    const cards = byKind(all, 'card').map((c) => c.props.rect as R)
    const socket = one(all, 'socket').props.rect as R
    const bottom = cards[0].y + cards[0].h
    expect(socket.y).toBeLessThan(bottom)
    expect(socket.y + socket.h).toBeGreaterThan(bottom)
    expect(socket.x).toBeGreaterThanOrEqual(cards[0].x)
    expect(socket.x + socket.w).toBeLessThanOrEqual(cards[2].x + cards[2].w)
    expect(one(all, 'socket').props['data-presentation-allow-overlap']).toBe('')
    expect(one(all, 'socket-label').props.children).toBe('shared scene kit')
    expect(all.filter((n) => n.props['data-presentation-node'] === 'frame' || n.kind === 'reveal')).toHaveLength(0)
  })

  it('7: a verify node chained after the cards in the same row with a green pass', () => {
    const all = nodes(7)
    const verify = one(all, 'verify').props.rect as R
    const cards = byKind(all, 'card').map((c) => c.props.rect as R)
    expect(verify.y).toBe(cards[0].y)
    for (const c of cards) expect(verify.x).toBeGreaterThan(c.x + c.w)
    const link = byKind(all, 'link').find((l) => l.key.endsWith('verify-link'))!
    expect(link.props.to.x).toBe(verify.x)
    expect(one(all, 'pass').props['data-state']).toBe('green')
    expect(one(all, 'verify-label').props.children).toBe('build + render')
  })

  it('8: a modify arc from the conversation into the cards and a flagged edited card', () => {
    const all = nodes(8)
    const arc = one(all, 'modify').props
    const skill = one(all, 'skill').props.rect as R
    const card2 = byKind(all, 'card')[1].props.rect as R
    expect(arc.from.y).toBe(skill.y + skill.h)
    expect(arc.to.y).toBeLessThanOrEqual(card2.y)
    expect(arc.to.x).toBeGreaterThanOrEqual(card2.x)
    expect(arc.to.x).toBeLessThanOrEqual(card2.x + card2.w)
    expect(within(card2, one(all, 'flag').props.rect)).toBe(true)
    expect(one(all, 'flag-label').props.children).toBe('edited')
  })

  it('9: a labeled outer frame encloses everything already on screen', () => {
    const all = nodes(9)
    const frame = one(all, 'reveal').props.rect as R
    for (const n of all.filter((n) => n.props.rect && n.kind !== 'reveal')) expect(within(n.props.rect, frame), n.kind).toBe(true)
    expect(one(all, 'reveal-label').props.children).toBeTruthy()
  })
})

describe('one accumulating scene', () => {
  const geometry = (n: Node) => JSON.stringify(n.props.rect ?? { from: n.props.from, to: n.props.to })

  it('keeps every earlier entity, in the same place and size, at every later step', () => {
    for (let upTo = 2; upTo <= 9; upTo++) {
      const before = new Map(nodes(upTo - 1).map((n) => [n.key, n]))
      const after = new Map(nodes(upTo).map((n) => [n.key, n]))
      for (const [id, node] of before) {
        expect(after.has(id), `${id} kept at step ${upTo}`).toBe(true)
        expect(geometry(after.get(id)!), `${id} geometry`).toBe(geometry(node))
      }
      expect(after.size).toBeGreaterThan(before.size)
    }
  })

  it('uses unique keys and layout ids', () => {
    const all = nodes(9)
    expect(new Set(all.map((n) => n.key)).size).toBe(all.length)
    expect(new Set(all.map((n) => n.props.id)).size).toBe(all.length)
  })

  it('shares one group so the scene instance persists, and entity DOM nodes survive navigation', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    render(<Presentation steps={STEPS} initialMode="browse" />)
    const you = document.querySelector('[data-presentation-entity="htmp/you"]')!
    const stage = document.querySelector('[data-presentation-step]')!
    for (let i = 0; i < 4; i++) key('ArrowRight')
    expect(document.querySelector('[data-presentation-entity="htmp/you"]')).toBe(you)
    expect(document.querySelector('[data-presentation-step]')).toBe(stage)
    expect(document.querySelector('[data-presentation-entity="htmp/ghost"]')).not.toBeNull()
  })

  it('renders only the entities of the requested step', () => {
    const { container } = render(<SampleScene payload={{ upTo: 2 }} step={STEPS[1]} index={1} />)
    expect(container.querySelectorAll('[data-presentation-entity]').length).toBeGreaterThanOrEqual(nodes(2).length)
    expect(container.querySelector('[data-kind="ghost"]')).toBeNull()
    act(() => void 0)
  })
})
