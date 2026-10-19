// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ENTITIES, FLAGGED_CARD, entitiesAt, ns } from '../../src/presentations/how-to-make-a-presentation/entities.ts'
import type { Entity } from '../../src/presentations/how-to-make-a-presentation/entities.ts'
import { NARRATION, TITLE } from '../../src/presentations/how-to-make-a-presentation/narration.ts'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps.ts'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk.tsx'
import { PRESENTATIONS } from '../../src/presentations/index.ts'
import { setViewport } from '../helpers/viewport.ts'

vi.mock('motion/react', async () => await import('../helpers/motionMock.tsx'))

// The canonical table from specs/presentation-verification/spec.md, typed out independently.
const CANON: [string, string, string][] = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

const byId = (id: string) => ENTITIES.find((e) => e.id === ns(id)) as Entity
const rect = (e: Entity) => {
  if (e.kind === 'arrow') return { x: Math.min(e.a[0], e.b[0]), y: Math.min(e.a[1], e.b[1]), w: Math.abs(e.b[0] - e.a[0]), h: Math.abs(e.b[1] - e.a[1]) }
  return { x: e.x, y: e.y, w: e.w, h: e.h }
}

describe('reference sample outline', () => {
  it('has exactly nine steps with the normative eras, titles and captions in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(CANON)
    expect(NARRATION.map((s) => [s.era, s.title, s.caption])).toEqual(CANON)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })

  it('is the verification manifest, and is registered and routable', () => {
    const manifest = JSON.parse(readFileSync('scripts/verify-manifest.json', 'utf8'))
    expect(manifest.steps.map((s: { era: string; title: string; caption: string }) => [s.era, s.title, s.caption])).toEqual(CANON)
    const entry = PRESENTATIONS.find((p) => p.slug === manifest.slug)
    expect(entry?.title).toBe(TITLE)
    expect(TITLE).toBe('How to Use This Skill to Make a Presentation')
  })

  it('shares one scene group so the scene persists across steps', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.stage)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('sample accumulates one scene', () => {
  it('uses unique namespaced entity ids with a single fixed definition each', () => {
    const ids = ENTITIES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => id.startsWith('how-to:'))).toBe(true)
  })

  it('never removes or re-places an entity: each step is a superset of the previous', () => {
    for (let n = 2; n <= 9; n++) {
      const prev = entitiesAt(n - 1)
      const cur = entitiesAt(n)
      expect(cur).toEqual(expect.arrayContaining(prev))
      expect(cur.length).toBeGreaterThan(prev.length)
    }
  })

  it('introduces the spec beats at the right steps', () => {
    const idsAt = (n: number) => entitiesAt(n).map((e) => e.id.replace('how-to:', ''))
    expect(idsAt(1)).toEqual(['you', 'prompt'])
    expect(idsAt(2)).toEqual(expect.arrayContaining(['skill', 'converse', 'question']))
    expect(idsAt(3).filter((i) => i.startsWith('card'))).toEqual(['card-0'])
    expect(idsAt(3)).toContain('tray')
    expect(idsAt(4).filter((i) => i.startsWith('card'))).toEqual(['card-0', 'card-1', 'card-2', 'card-3'])
    expect(idsAt(4).filter((i) => i.startsWith('link'))).toHaveLength(3)
    expect(idsAt(5)).toEqual(expect.arrayContaining(['ghost', 'depth']))
    expect(idsAt(6)).toContain('socket')
    expect(idsAt(7)).toContain('verify')
    expect(idsAt(8)).toEqual(expect.arrayContaining(['modify', 'flag']))
    expect(idsAt(9)).toContain('frame')
    expect(entitiesAt(8).some((e) => e.kind === 'frame')).toBe(false)
  })

  it('arranges the conversation row, two-way arrow and question chip above it', () => {
    const you = byId('you'), skill = byId('skill'), arrow = byId('converse'), q = byId('question')
    expect(you.kind === 'node' && skill.kind === 'node' && you.y === skill.y).toBe(true)
    expect(arrow.kind === 'arrow' && arrow.both).toBe(true)
    if (arrow.kind === 'arrow' && q.kind === 'chip' && you.kind === 'node' && skill.kind === 'node') {
      expect(arrow.a[0]).toBeGreaterThan(you.x + you.w)
      expect(arrow.b[0]).toBeLessThan(skill.x)
      expect(q.y + q.h).toBeLessThanOrEqual(arrow.a[1])
    }
  })

  it('lays the tray under the conversation with morph chips on the links between consecutive cards', () => {
    const cards = [0, 1, 2, 3].map((i) => byId(`card-${i}`))
    const you = byId('you')
    for (const c of cards) expect(c.kind === 'card' && you.kind === 'node' && c.y > you.y + you.h).toBe(true)
    for (let i = 0; i < 3; i++) {
      const a = cards[i], b = cards[i + 1], chip = byId(`morph-${i}`), link = byId(`link-${i}`)
      if (a.kind === 'card' && b.kind === 'card' && chip.kind === 'chip' && link.kind === 'arrow') {
        expect(a.y).toBe(b.y)
        expect(chip.x).toBeGreaterThanOrEqual(a.x + a.w)
        expect(chip.x + chip.w).toBeLessThanOrEqual(b.x)
        expect(link.a[0]).toBeGreaterThanOrEqual(a.x + a.w)
        expect(link.b[0]).toBeLessThanOrEqual(b.x)
      }
    }
  })

  it('docks the depth control on "you", beside a dashed-role ghost card in the tray row', () => {
    const you = rect(byId('you')), depth = rect(byId('depth')), ghost = byId('ghost'), card = byId('card-0')
    expect(depth.x < you.x + you.w && depth.x + depth.w > you.x && depth.y < you.y + you.h && depth.y + depth.h > you.y).toBe(true)
    expect(ghost.kind === 'node' && ghost.role === 'ghost' && card.kind === 'card' && ghost.y === card.y).toBe(true)
    expect(byId('depth').kind === 'chip' && (byId('depth') as Extract<Entity, { kind: 'chip' }>).overlap).toBe(true)
  })

  it('plugs the labelled scene-kit socket into the tray bottom edge without framing the tray', () => {
    const socket = byId('socket'), card = byId('card-0')
    expect(socket.kind === 'node' && socket.text).toBe('scene kit')
    if (socket.kind === 'node' && card.kind === 'card') expect(socket.y).toBe(card.y + card.h)
    expect(ENTITIES.filter((e) => e.kind === 'frame' && e.from < 9)).toHaveLength(0)
  })

  it('chains the verify node after the step cards in the same row', () => {
    const verify = byId('verify'), cards = [0, 1, 2, 3].map((i) => byId(`card-${i}`))
    if (verify.kind === 'node') for (const c of cards) if (c.kind === 'card') {
      expect(verify.y).toBe(c.y)
      expect(verify.x).toBeGreaterThan(c.x + c.w)
    }
    const chain = byId('verify-link')
    expect(chain.kind === 'arrow' && verify.kind === 'node' && chain.b[0] <= verify.x).toBe(true)
  })

  it('reaches the modify arc from the conversation down to the flagged card', () => {
    const arc = byId('modify'), skill = byId('skill'), card = byId(FLAGGED_CARD.replace('how-to:', ''))
    if (arc.kind === 'arrow' && skill.kind === 'node' && card.kind === 'card') {
      expect(arc.via).toBeDefined()
      expect(arc.a[1]).toBeGreaterThanOrEqual(skill.y + skill.h - 10)
      expect(arc.a[0]).toBeGreaterThanOrEqual(skill.x)
      expect(arc.b[1]).toBeLessThanOrEqual(card.y)
      expect(arc.b[0]).toBeGreaterThanOrEqual(card.x)
      expect(arc.b[0]).toBeLessThanOrEqual(card.x + card.w)
    }
  })

  it('draws the labelled outer frame around the whole diagram', () => {
    const frame = byId('frame')
    if (frame.kind !== 'frame') throw new Error('frame expected')
    expect(frame.text.length).toBeGreaterThan(0)
    for (const e of ENTITIES.filter((x) => x.kind !== 'frame')) {
      const r = rect(e)
      expect(r.x).toBeGreaterThan(frame.x)
      expect(r.y).toBeGreaterThan(frame.y)
      expect(r.x + r.w).toBeLessThan(frame.x + frame.w)
      expect(r.y + r.h).toBeLessThan(frame.y + frame.h)
    }
  })
})

describe('sample rendering', () => {
  beforeEach(() => setViewport(1440, 900))
  const next = () => act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
  const prev = () => act(() => void fireEvent.keyDown(window, { key: 'ArrowLeft' }))

  it('opens in browse mode and traverses forward and back showing each caption and scene', () => {
    const { container } = render(<Talk />)
    expect(container.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('browse')
    const state = () => [container.querySelector('[data-step-index]')?.getAttribute('data-step-index'), container.querySelector('[data-presentation-caption]')?.textContent, container.querySelectorAll('[data-presentation-entity]').length]
    const forward: unknown[][] = []
    for (let i = 0; i < 9; i++) {
      forward.push(state())
      if (i < 8) next()
    }
    expect(forward.map((s) => s[1])).toEqual(CANON.map((c) => c[2]))
    expect(forward.map((s) => s[0])).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8'])
    expect(forward.map((s) => s[2])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => entitiesAt(n).length))
    for (let i = 7; i >= 0; i--) {
      prev()
      expect(state()).toEqual(forward[i])
    }
  })

  it('keeps every continuing entity at the same position and enters only newcomers', () => {
    const { container } = render(<Talk />)
    const pos = () => new Map([...container.querySelectorAll<HTMLElement>('[data-presentation-node]:not(svg)')].map((e) => [e.getAttribute('data-presentation-entity'), `${e.style.left},${e.style.top},${e.style.width},${e.style.height}`]))
    const entering = () => [...container.querySelectorAll('[data-presentation-appear="enter"]')].length
    let before = pos()
    expect(entering()).toBe(entitiesAt(1).length)
    for (let n = 2; n <= 9; n++) {
      next()
      const after = pos()
      for (const [id, p] of before) expect(after.get(id)).toBe(p)
      expect(entering()).toBe(entitiesAt(n).filter((e) => e.from === n).length)
      before = after
    }
  })

  it('renders the card parts, the verify pass check, the flagged card and the frame label', () => {
    const { container } = render(<Talk />)
    for (let i = 0; i < 2; i++) next()
    const card = container.querySelector('[data-presentation-entity="how-to:card-0"]')!
    expect(card.querySelector('[data-part="title"]')).not.toBeNull()
    expect(card.querySelector('[data-part="caption"]')).not.toBeNull()
    expect(card.querySelector('svg')).not.toBeNull()
    for (let i = 0; i < 4; i++) next()
    const verify = container.querySelector('[data-presentation-entity="how-to:verify"]')!
    expect([...verify.querySelectorAll('[data-part="check"]')].map((e) => e.textContent)).toEqual(['build', 'render'])
    expect(verify.querySelector('[data-presentation-pass]')).not.toBeNull()
    expect(container.querySelector(`[data-presentation-entity="${FLAGGED_CARD}"]`)?.getAttribute('data-presentation-emphasis')).toBeNull()
    next()
    expect(container.querySelector(`[data-presentation-entity="${FLAGGED_CARD}"]`)?.getAttribute('data-presentation-emphasis')).toBe('true')
    next()
    expect(container.querySelector('[data-presentation-frame-label]')?.textContent).toBe('built with the skill')
  })
})
