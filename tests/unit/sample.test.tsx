import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { DESIGN_H, DESIGN_W, Presentation, validateSteps } from '../../src/presentation-kit'
import { presentations } from '../../src/presentations'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { ENTITIES, entitiesThrough, type EntityDef } from '../../src/presentations/how-to-make-a-presentation/entities'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { currentIndex, setViewport } from './helpers'

// Independent expectation: parsed from the approved definition, not from the sample's own constants.
const SPEC = readFileSync('openspec/changes/create-and-scene/specs/presentation-verification/spec.md', 'utf8')
const EXPECTED = [...SPEC.matchAll(/^\| (\d) \| ([^|]+?) \| "(.+?)" \| (.+?) \| .+ \|$/gm)].map((m) => ({
  n: Number(m[1]), era: m[2], title: m[3], caption: m[4],
}))
const CANONICAL_TITLE = /\*\*"(How to Use This Skill to Make a Presentation)"\*\*/.exec(SPEC)![1]

const byId = (id: string) => ENTITIES.find((e) => e.id === id)!
const box = (e: EntityDef) => ('x' in e ? { x: e.x, y: e.y, w: e.w, h: e.h } : undefined)

describe('reference sample metadata', () => {
  it('parses the nine normative rows from the approved definition', () => {
    expect(EXPECTED.map((r) => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('has the canonical title and is registered at its own slug', () => {
    expect(presentations.map((p) => p.slug)).toContain('how-to-make-a-presentation')
    expect(presentations.find((p) => p.slug === 'how-to-make-a-presentation')!.title).toBe(CANONICAL_TITLE)
  })

  it('implements the nine steps with the exact eras, titles and captions, in order', () => {
    expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(
      EXPECTED.map(({ era, title, caption }) => ({ era, title, caption })),
    )
  })

  it('has valid, unique step ids and a single shared scene group', () => {
    expect(validateSteps(STEPS)).toEqual([])
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.stage)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('reference sample scene content', () => {
  it('accumulates entities: each step keeps every earlier id', () => {
    for (let step = 2; step <= 9; step++) {
      const previous = entitiesThrough(step - 1).map((e) => e.id)
      expect(entitiesThrough(step).map((e) => e.id)).toEqual(expect.arrayContaining(previous))
    }
  })

  it('introduces the normative entities at the normative steps', () => {
    const introduced = (n: number) => ENTITIES.filter((e) => e.first === n).map((e) => e.id)
    expect(introduced(1)).toEqual(['you', 'prompt'])
    expect(introduced(2)).toEqual(['skill', 'conversation', 'question'])
    expect(introduced(3)).toEqual(['tray', 'card-1', 'morph-chip', 'link-1'])
    expect(introduced(4)).toEqual(['card-2', 'card-3', 'card-4', 'link-2', 'link-3'])
    expect(introduced(5)).toEqual(['ghost', 'depth'])
    expect(introduced(6)).toEqual(['scene-kit'])
    expect(introduced(7)).toEqual(['verify', 'verify-chain', 'verify-build', 'verify-render', 'verify-pass'])
    expect(introduced(8)).toEqual(['route', 'modify-arc', 'edit-link', 'edited-flag'])
    expect(introduced(9)).toEqual(['reveal-frame', 'reveal-label'])
  })

  it('never moves or resizes an entity once it is on screen', () => {
    for (const def of ENTITIES) {
      const first = entitiesThrough(def.first).find((e) => e.id === def.id)
      for (let step = def.first; step <= 9; step++) {
        expect(entitiesThrough(step).find((e) => e.id === def.id)).toBe(first)
      }
    }
    expect(new Set(ENTITIES.map((e) => e.id)).size).toBe(ENTITIES.length)
  })

  it('connects you and skill with a two-way arrow and a question chip above it', () => {
    const arrow = byId('conversation')
    expect(arrow.kind === 'arrow' && arrow.bidirectional).toBe(true)
    const you = box(byId('you'))!
    const skill = box(byId('skill'))!
    const chip = box(byId('question'))!
    if (arrow.kind !== 'arrow') throw new Error('arrow expected')
    expect(arrow.from[0]).toBeGreaterThanOrEqual(you.x + you.w)
    expect(arrow.to[0]).toBeLessThanOrEqual(skill.x)
    expect(chip.y + chip.h).toBeLessThan(arrow.from[1])
  })

  it('lands cards in a tray under the conversation; the tray is not framed before the reveal', () => {
    const tray = box(byId('tray'))!
    for (const id of ['card-1', 'card-2', 'card-3', 'card-4']) {
      const c = box(byId(id))!
      expect(c.y).toBeGreaterThanOrEqual(tray.y)
      expect(c.y + c.h).toBeLessThanOrEqual(tray.y + tray.h)
      expect(c.x).toBeGreaterThanOrEqual(tray.x)
    }
    expect(box(byId('you'))!.y + box(byId('you'))!.h).toBeLessThan(tray.y)
    expect(entitiesThrough(8).some((e) => e.kind === 'frame')).toBe(false)
    expect(byId('morph-chip').kind).toBe('chip') // what morphs is labelled on the link, not in cards
    expect(byId('link-1').kind).toBe('arrow')
  })

  it('marks unspecified steps with a ghost card and docks the depth control on you', () => {
    expect(byId('ghost').kind).toBe('ghost')
    const depth = box(byId('depth'))!
    const you = box(byId('you'))!
    expect(depth.x).toBe(you.x)
    expect(depth.y).toBeGreaterThanOrEqual(you.y + you.h)
  })

  it('plugs the scene-kit socket into the bottom edge of the tray', () => {
    const tray = box(byId('tray'))!
    const socket = box(byId('scene-kit'))!
    expect(socket.y).toBe(tray.y + tray.h)
    expect(byId('scene-kit').kind === 'node' && (byId('scene-kit') as { text: string }).text).toMatch(/scene kit/)
  })

  it('chains verify after the step cards in the same row with a pass check', () => {
    const verify = box(byId('verify'))!
    const lastCard = box(byId('ghost'))!
    expect(verify.y).toBe(box(byId('card-1'))!.y)
    expect(verify.x).toBeGreaterThan(lastCard.x)
    const check = byId('verify-pass')
    expect(check.kind).toBe('check')
    const c = box(check)!
    expect(c.x).toBeGreaterThanOrEqual(verify.x)
    expect(c.x).toBeLessThanOrEqual(verify.x + verify.w)
  })

  it('shows build and render checks inside the verify node, resolving to the green pass check', () => {
    const verify = box(byId('verify'))!
    const check = byId('verify-pass')
    if (check.kind !== 'check') throw new Error('check expected')
    expect(check.resolves).toEqual(['verify-build', 'verify-render'])
    for (const id of check.resolves) {
      const label = byId(id)
      expect(label.kind).toBe('label')
      expect(label.first).toBe(check.first)
      const b = box(label)!
      expect(b.x).toBeGreaterThanOrEqual(verify.x)
      expect(b.x + b.w).toBeLessThanOrEqual(verify.x + verify.w)
      expect(b.y).toBeGreaterThanOrEqual(verify.y)
      expect(b.y + b.h).toBeLessThanOrEqual(verify.y + verify.h)
    }
    expect(['build', 'render']).toEqual(check.resolves.map((id) => (byId(id) as { text: string }).text))
  })

  it('draws the modify arc from the conversation into the route and flags the edited card', () => {
    const arc = byId('modify-arc')
    const conversation = byId('conversation')
    const route = box(byId('route'))!
    if (arc.kind !== 'arrow' || conversation.kind !== 'arrow') throw new Error('arrows expected')
    expect(arc.from[1]).toBeGreaterThanOrEqual(conversation.from[1])
    expect(arc.to[1]).toBe(route.y)
    const flag = box(byId('edited-flag'))!
    const card = box(byId('card-2'))!
    expect(flag.x).toBeLessThan(card.x)
    expect(flag.x + flag.w).toBeGreaterThan(card.x + card.w)
  })

  it('draws a labelled outer frame around the whole diagram at the end', () => {
    const frame = box(byId('reveal-frame'))!
    for (const def of ENTITIES) {
      if (def.id === 'reveal-frame') continue
      const b = box(def)
      if (b) {
        expect(b.x).toBeGreaterThan(frame.x)
        expect(b.y).toBeGreaterThan(frame.y)
        expect(b.x + b.w).toBeLessThan(frame.x + frame.w)
        expect(b.y + b.h).toBeLessThan(frame.y + frame.h)
      }
    }
    expect(byId('reveal-label').first).toBe(9)
  })

  it('keeps every entity inside the 880 x 380 canvas', () => {
    for (const def of ENTITIES) {
      const b = box(def)
      if (b) {
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.y).toBeGreaterThanOrEqual(0)
        expect(b.x + b.w).toBeLessThanOrEqual(DESIGN_W)
        expect(b.y + b.h).toBeLessThanOrEqual(DESIGN_H)
      } else if (def.kind === 'arrow') {
        for (const [x, y] of [def.from, def.to]) {
          expect(x).toBeGreaterThanOrEqual(0)
          expect(x).toBeLessThanOrEqual(DESIGN_W)
          expect(y).toBeGreaterThanOrEqual(0)
          expect(y).toBeLessThanOrEqual(DESIGN_H)
        }
      }
    }
  })

  it('has no accidental overlaps between text-bearing entities', () => {
    const textual = ENTITIES.filter((e) => ['node', 'chip', 'ghost', 'card', 'label'].includes(e.kind))
    const contains = (a: EntityDef, b: EntityDef) => {
      const p = box(a)!
      const q = box(b)!
      return p.x <= q.x && p.y <= q.y && p.x + p.w >= q.x + q.w && p.y + p.h >= q.y + q.h
    }
    const hit = (a: EntityDef, b: EntityDef) => {
      const p = box(a)!
      const q = box(b)!
      return p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h
    }
    for (let i = 0; i < textual.length; i++) {
      for (let j = i + 1; j < textual.length; j++) {
        const nested = contains(textual[i], textual[j]) || contains(textual[j], textual[i]) // a label inside its own node
        expect([textual[i].id, textual[j].id, nested || hit(textual[i], textual[j])]).toEqual([textual[i].id, textual[j].id, nested])
      }
    }
  })
})

describe('reference sample rendering', () => {
  it('opens in browse mode as declared', () => {
    setViewport(1440, 900)
    render(<Talk />)
    expect(document.querySelector('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('browse')
    expect(document.querySelector('[data-step-count]')!.getAttribute('data-step-count')).toBe('9')
  })

  it('shows each step caption and navigates next/previous including at the ends', () => {
    setViewport(1440, 900)
    render(<Presentation steps={STEPS} title="sample" />)
    const caption = () => document.querySelector('[data-presentation-caption]')!.textContent
    const prev = document.querySelector<HTMLButtonElement>('[data-presentation-prev]')!
    const nextButton = document.querySelector<HTMLButtonElement>('[data-presentation-next]')!
    expect(prev.disabled).toBe(true)
    STEPS.forEach((step, i) => {
      expect(currentIndex()).toBe(i)
      expect(caption()).toBe(step.caption)
      expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(step.title)
      if (i < STEPS.length - 1) fireEvent.click(nextButton)
    })
    expect(nextButton.disabled).toBe(true)
    fireEvent.click(prev)
    expect(caption()).toBe(STEPS[7].caption)
  })

  it('renders exactly the cumulative entities for every step', () => {
    setViewport(1440, 900)
    render(<Presentation steps={STEPS} title="sample" />)
    STEPS.forEach((_, i) => {
      if (i > 0) fireEvent.click(document.querySelectorAll('[data-presentation-progress-dot]')[i])
      for (const def of entitiesThrough(i + 1)) {
        expect(document.querySelector(`[data-presentation-entity="${def.id}"]`)).not.toBeNull()
      }
    })
    // the final step holds the whole diagram
    expect(document.querySelectorAll('[data-presentation-scene] [data-presentation-entity]').length).toBeGreaterThanOrEqual(ENTITIES.length)
  })

  it('marks only the pass check as an intentional overlap', () => {
    setViewport(1440, 900)
    render(<Presentation steps={STEPS} title="sample" />)
    fireEvent.click(document.querySelectorAll('[data-presentation-progress-dot]')[8])
    const marked = document.querySelectorAll('[data-presentation-allow-overlap]')
    expect(Array.from(marked).map((m) => m.getAttribute('data-presentation-entity'))).toEqual(['verify-pass'])
  })
})
