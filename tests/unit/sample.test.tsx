import { StrictMode } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { ARROWS, ENTITIES, SAMPLE_STEP_COUNT } from '../../src/presentations/how-to-make-a-presentation/entities'
import { Scene } from '../../src/presentations/how-to-make-a-presentation/Scene'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { presentations } from '../../src/presentations'
import { setViewport } from '../support/fixtures'

// A literal copy of the normative table (specs/presentation-verification/spec.md).
const NORMATIVE = [
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

describe('sample registration and narration', () => {
  it('is registered under its slug and title with a working lazy loader', async () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')!
    expect(entry.title).toBe('How to Use This Skill to Make a Presentation')
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
    const mod = await entry.load()
    expect(mod.default).toBeTypeOf('function')
  })

  it('has exactly the nine normative steps, in order, with nonempty captions', () => {
    expect(STEPS).toHaveLength(NORMATIVE.length)
    expect(SAMPLE_STEP_COUNT).toBe(9)
    STEPS.forEach((s, i) => {
      expect([s.era, s.title, s.caption]).toEqual(NORMATIVE[i])
      expect(s.caption.trim()).not.toBe('')
    })
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })

  it('is one grouped scene: one Scene component, one group key, steps numbered 1..9', () => {
    expect(new Set(STEPS.map((s) => s.Scene))).toEqual(new Set([Scene]))
    expect(new Set(STEPS.map((s) => s.groupKey))).toEqual(new Set(['sample']))
    expect(STEPS.map((s) => s.payload.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('namespaces every entity id and keeps ids unique', () => {
    const ids = [...Object.values(ENTITIES), ...Object.values(ARROWS)].map((e) => e.id)
    expect(ids.every((id) => id.startsWith('htmp:'))).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const px = (v: string) => Number.parseFloat(v)
const rectOf = (el: HTMLElement): Rect => ({ x: px(el.style.left), y: px(el.style.top), w: px(el.style.width), h: px(el.style.height) })

function snapshot(container: HTMLElement) {
  const byId = new Map<string, HTMLElement>()
  for (const el of container.querySelectorAll<HTMLElement>('[data-presentation-id]')) byId.set(el.dataset.presentationId!, el)
  return byId
}

function ids(container: HTMLElement) {
  return [...snapshot(container).keys()].map((id) => id.replace('htmp:', ''))
}

function view() {
  setViewport(1440, 900)
  return render(
    <StrictMode>
      <Presentation steps={STEPS} title="Sample" initialMode="browse" />
    </StrictMode>,
  )
}

const next = (c: HTMLElement) => fireEvent.click(c.querySelector('[data-presentation-next]')!)

beforeEach(() => setViewport(1440, 900))

describe('sample scene content per step', () => {
  const EXPECTED: string[][] = [
    ['you', 'prompt'],
    ['skill', 'talk', 'question'],
    ['tray', 'card-1'],
    ['card-2', 'card-3', 'link-1', 'link-2', 'morph-1', 'morph-2'],
    ['ghost', 'depth'],
    ['scene-kit'],
    ['verify', 'chain', 'pass'],
    ['route', 'modify', 'edited'],
    ['reveal', 'reveal-label'],
  ]

  it('accumulates exactly the specified entities at each step', () => {
    const { container } = view()
    let seen: string[] = []
    EXPECTED.forEach((added, i) => {
      if (i > 0) next(container)
      seen = [...seen, ...added]
      expect(ids(container).sort(), `step ${i + 1}`).toEqual([...seen].sort())
    })
  })

  it('keeps every earlier entity mounted, on the same node, at identical coordinates', () => {
    const { container } = view()
    const nodes = snapshot(container)
    const rects = new Map([...nodes].map(([id, el]) => [id, el.getAttribute('style')]))
    for (let i = 1; i < 9; i++) {
      next(container)
      const now = snapshot(container)
      for (const [id, el] of nodes) {
        expect(now.get(id), `${id} at step ${i + 1}`).toBe(el)
        expect(el.getAttribute('style')).toBe(rects.get(id))
      }
      for (const [id, el] of now) {
        nodes.set(id, el)
        rects.set(id, el.getAttribute('style'))
      }
    }
  })

  it('renders entity boxes at the declared literal coordinates', () => {
    const { container } = view()
    for (let i = 1; i < 9; i++) next(container)
    const now = snapshot(container)
    for (const spec of Object.values(ENTITIES)) {
      expect(rectOf(now.get(spec.id)!), spec.id).toEqual({ x: spec.at.x, y: spec.at.y, w: spec.at.w, h: spec.at.h })
    }
  })

  it('mounts an Appear wrapper only for entities newly present in the step, and never re-wraps a continuing one', () => {
    const { container } = view()
    const wrappers = () => {
      const map = new Map<string, Element>()
      for (const w of container.querySelectorAll('[data-presentation-appear]')) {
        for (const e of w.querySelectorAll('[data-presentation-id]')) map.set(e.getAttribute('data-presentation-id')!.replace('htmp:', ''), w)
      }
      return map
    }
    expect(wrappers().size).toBe(0)
    let known = wrappers()
    for (let i = 1; i < 9; i++) {
      next(container)
      const now = wrappers()
      const fresh = [...now].filter(([id, w]) => known.get(id) !== w).map(([id]) => id)
      expect(fresh.sort(), `step ${i + 1}`).toEqual([...EXPECTED[i]].sort())
      known = now
    }
    for (let i = 8; i > 3; i--) {
      fireEvent.click(container.querySelector('[data-presentation-prev]')!)
      const now = wrappers()
      expect([...now].filter(([id, w]) => known.get(id) !== w)).toEqual([])
    }
  })
})

describe('sample scene composition by step', () => {
  const step = (n: number) => {
    const view_ = view()
    for (let i = 1; i < n; i++) next(view_.container)
    return { ...view_, nodes: snapshot(view_.container) }
  }

  it('step 2: a two-way arrow between you and the skill with a question chip above it', () => {
    const { nodes } = step(2)
    const talk = nodes.get(ARROWS.talk.id)!
    expect(talk.querySelectorAll('path')).toHaveLength(3)
    const [fx, fy] = ARROWS.talk.from
    const [tx] = ARROWS.talk.to
    const you = rectOf(nodes.get(ENTITIES.you.id)!)
    const skill = rectOf(nodes.get(ENTITIES.skill.id)!)
    expect(fx).toBeGreaterThanOrEqual(you.x + you.w)
    expect(tx).toBeLessThanOrEqual(skill.x)
    const chip = rectOf(nodes.get(ENTITIES.question.id)!)
    expect(chip.y + chip.h).toBeLessThanOrEqual(fy)
    expect(chip.x).toBeGreaterThan(fx)
    expect(chip.x + chip.w).toBeLessThan(tx)
  })

  it('step 3: the tray sits under the conversation and the first card carries title, caption, and visual', () => {
    const { nodes } = step(3)
    const you = rectOf(nodes.get(ENTITIES.you.id)!)
    const card = nodes.get(ENTITIES.card1.id)!
    expect(rectOf(card).y).toBeGreaterThan(you.y + you.h)
    expect([...card.querySelectorAll('[data-part]')].map((p) => p.getAttribute('data-part'))).toEqual(['title', 'caption', 'visual'])
  })

  it('step 4: morph information lives on the links between cards, never inside them', () => {
    const { nodes } = step(4)
    const cards = [ENTITIES.card1, ENTITIES.card2, ENTITIES.card3].map((c) => nodes.get(c.id)!)
    const rects = cards.map(rectOf)
    expect(new Set(rects.map((r) => r.y)).size).toBe(1)
    const chips = [ENTITIES.morph1, ENTITIES.morph2].map((c) => nodes.get(c.id)!)
    chips.forEach((chip, i) => {
      const r = rectOf(chip)
      expect(r.x).toBeGreaterThanOrEqual(rects[i].x + rects[i].w)
      expect(r.x + r.w).toBeLessThanOrEqual(rects[i + 1].x)
      for (const card of cards) expect(card.contains(chip)).toBe(false)
    })
    for (const card of cards) expect(card.querySelector('[data-presentation-node="symbol-chip"]')).toBeNull()
  })

  it('step 5: a dashed ghost card and the partial/full control docked on you', () => {
    const { nodes } = step(5)
    expect(nodes.get(ENTITIES.ghost.id)!.getAttribute('data-presentation-variant')).toBe('ghost-card')
    const you = rectOf(nodes.get(ENTITIES.you.id)!)
    const depth = nodes.get(ENTITIES.depth.id)!
    const control = rectOf(depth)
    expect(control.x).toBe(you.x)
    expect(control.y).toBeGreaterThanOrEqual(you.y + you.h)
    expect(depth.textContent).toBe('partial ↔ full')
  })

  it('step 6: the labeled scene-kit socket meets the bottom edge of the unframed tray', () => {
    const { nodes, container } = step(6)
    const cards = [ENTITIES.card1, ENTITIES.card2, ENTITIES.card3].map((c) => rectOf(nodes.get(c.id)!))
    const bottom = Math.max(...cards.map((c) => c.y + c.h))
    const kit = nodes.get(ENTITIES.kit.id)!
    const r = rectOf(kit)
    expect(r.y - bottom).toBeGreaterThanOrEqual(0)
    expect(r.y - bottom).toBeLessThanOrEqual(4)
    expect(r.x).toBeLessThanOrEqual(cards[0].x)
    expect(r.x + r.w).toBeGreaterThanOrEqual(cards[2].x + cards[2].w)
    expect(kit.textContent).toBe('scene kit')
    expect(container.querySelector('[data-presentation-node="frame"]')).toBeNull()
  })

  it('step 7: the verify node follows the cards in the same row and shows a pass check', () => {
    const { nodes } = step(7)
    const cards = [ENTITIES.card1, ENTITIES.card2, ENTITIES.card3, ENTITIES.ghost].map((c) => rectOf(nodes.get(c.id)!))
    const verify = rectOf(nodes.get(ENTITIES.verify.id)!)
    expect(new Set([...cards, verify].map((c) => c.y)).size).toBe(1)
    expect(verify.x).toBeGreaterThan(Math.max(...cards.map((c) => c.x + c.w)))
    const pass = nodes.get(ENTITIES.pass.id)!
    expect(pass.querySelector('svg')).not.toBeNull()
    expect(pass.getAttribute('data-presentation-variant')).toBe('pass')
    expect(nodes.get(ARROWS.chain.id)).toBeDefined()
  })

  it('step 8: a modify arc runs from the conversation into the route and the edited card is flagged', () => {
    const { nodes } = step(8)
    const [sx, sy] = ARROWS.modify.from
    const [ex, ey] = ARROWS.modify.to
    const skill = rectOf(nodes.get(ENTITIES.skill.id)!)
    expect(sx).toBeGreaterThanOrEqual(skill.x)
    expect(sx).toBeLessThanOrEqual(skill.x + skill.w)
    expect(sy).toBeLessThanOrEqual(skill.y + skill.h + 1)
    const route = rectOf(nodes.get(ENTITIES.route.id)!)
    expect(ex).toBeGreaterThanOrEqual(route.x)
    expect(ex).toBeLessThanOrEqual(route.x + route.w)
    expect(ey).toBeGreaterThanOrEqual(route.y)
    const arc = nodes.get(ARROWS.modify.id)!
    expect(arc.querySelector('path')!.getAttribute('d')).toMatch(/Q/)
    const flag = rectOf(nodes.get(ENTITIES.edited.id)!)
    const card2 = rectOf(nodes.get(ENTITIES.card2.id)!)
    expect(flag.y + flag.h).toBeLessThanOrEqual(card2.y)
    expect(flag.x).toBeGreaterThanOrEqual(card2.x)
  })

  it('step 9: a labeled outer frame encloses every other entity and is an allowed overlap', () => {
    const { nodes } = step(9)
    const frame = nodes.get(ENTITIES.reveal.id)!
    expect(frame.hasAttribute('data-presentation-allow-overlap')).toBe(true)
    const f = rectOf(frame)
    for (const spec of Object.values(ENTITIES)) {
      if (spec.id === ENTITIES.reveal.id) continue
      const r = spec.at
      expect(r.x, spec.id).toBeGreaterThan(f.x)
      expect(r.y, spec.id).toBeGreaterThan(f.y)
      expect(r.x + r.w, spec.id).toBeLessThan(f.x + f.w)
      expect(r.y + r.h, spec.id).toBeLessThan(f.y + f.h)
    }
    for (const a of Object.values(ARROWS)) {
      for (const [x, y] of [a.from, a.to]) {
        expect(x).toBeGreaterThan(f.x)
        expect(x).toBeLessThan(f.x + f.w)
        expect(y).toBeGreaterThan(f.y)
        expect(y).toBeLessThan(f.y + f.h)
      }
    }
    expect(nodes.get(ENTITIES.revealLabel.id)!.textContent).toBe('built with this skill')
  })
})
