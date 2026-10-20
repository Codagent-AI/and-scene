import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXPECTED_SAMPLE } from '../../scripts/verify.mjs'
import { Presentation } from '../presentation-kit/Presentation.tsx'
import { ENTITIES, ids, type Entity } from './how-to-make-a-presentation/entities.ts'
import { STEPS } from './how-to-make-a-presentation/steps/index.ts'
import { STEP_META } from './how-to-make-a-presentation/steps/meta.ts'
import { presentations } from './index.ts'

const here = path.dirname(new URL(import.meta.url).pathname)

describe('reference sample outline', () => {
  it('registers the sample and has the nine normative steps in order', async () => {
    expect(presentations.map((p) => p.slug)).toContain('how-to-make-a-presentation')
    expect(presentations.find((p) => p.slug === 'how-to-make-a-presentation')!.title).toBe(
      'How to Use This Skill to Make a Presentation',
    )
    expect(STEP_META).toHaveLength(9)
    STEP_META.forEach((s, i) => {
      expect({ era: s.era, title: s.title, caption: s.caption }, `step ${i}`).toEqual(EXPECTED_SAMPLE[i])
    })
    expect((await presentations[0].load()).default).toBeTypeOf('function')
  })

  it('gives every step a stable unique id and the diagram state', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    for (const s of STEPS) {
      expect(s.id && s.era && s.title && s.caption).toBeTruthy()
      expect(s.Scene).toBeTypeOf('function')
    }
  })

  it('verification expectations match the spec table', () => {
    const spec = readFileSync(
      path.join(here, '../../openspec/changes/create-and-scene/specs/presentation-verification/spec.md'),
      'utf8',
    )
    const rows = spec
      .split('\n')
      .filter((l) => /^\| \d \|/.test(l))
      .map((l) => l.split('|').map((c) => c.trim()))
    expect(rows).toHaveLength(9)
    rows.forEach((cells, i) => {
      const unquote = (s: string) => s.replace(/^"|"$/g, '')
      expect({ era: cells[2], title: unquote(cells[3]), caption: cells[4] }, `row ${i + 1}`).toEqual(EXPECTED_SAMPLE[i])
    })
  })

  it('shows each step\'s own caption in browse mode and its title in present mode', () => {
    const view = render(<Presentation steps={STEPS} title="x" initialMode="browse" />)
    STEPS.forEach((s, i) => {
      expect(document.querySelector('[data-presentation-caption]')!.textContent, `caption ${i}`).toBe(s.caption)
      expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(s.title)
      act(() => {
        fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      })
    })
    view.unmount()
    render(<Presentation steps={STEPS} title="x" initialMode="present" />)
    expect(document.querySelector('[data-presentation-title]')!.textContent).toBe(STEPS[0].title)
    expect(document.querySelector('[data-presentation-caption]')).toBeNull()
  })
})

const byId = (id: string): Entity => ENTITIES.find((e) => e.id === id)!
type Rect = { x: number; y: number; w: number; h: number }
const rectOf = (id: string) => byId(id) as unknown as Rect
const within = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h
const textOf = (id: string): string => {
  const e = byId(id)
  return 'text' in e ? [e.text].flat().join(' ') : ''
}
const onStep = (n: number) => ENTITIES.filter((e) => e.since <= n).map((e) => e.id)

describe('sample scene composition', () => {
  it('accumulates entities: nothing leaves, ids are unique, and each step adds to the last', () => {
    expect(new Set(ENTITIES.map((e) => e.id)).size).toBe(ENTITIES.length)
    expect(Object.values(ids).sort()).toEqual(ENTITIES.map((e) => e.id).sort())
    for (let n = 2; n <= 9; n++) {
      const prev = onStep(n - 1)
      expect(onStep(n)).toEqual(expect.arrayContaining(prev))
      expect(onStep(n).length, `step ${n} adds something`).toBeGreaterThan(prev.length)
    }
  })

  it('renders exactly the entities introduced so far, with stable ids across steps', () => {
    render(<Presentation steps={STEPS} title="x" />)
    let seen: string[] = []
    for (let n = 1; n <= 9; n++) {
      const now = [...document.querySelectorAll('[data-presentation-id]')]
        .map((el) => el.getAttribute('data-presentation-id')!)
        .filter((id) => id !== ids.tray)
      const expected = onStep(n).filter((id) => id !== ids.tray)
      expect(now.sort(), `step ${n}`).toEqual(expect.arrayContaining(expected))
      expect(now.every((id) => expected.includes(id as never)), `step ${n} extras`).toBe(true)
      expect(now).toEqual(expect.arrayContaining(seen))
      seen = now
      act(() => {
        fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      })
    }
  })

  it('step 1: you and a prompt', () => {
    expect(onStep(1)).toEqual([ids.you, ids.prompt])
  })

  it('step 2: skill, two-way link, and a question chip above it', () => {
    expect(onStep(2)).toEqual(expect.arrayContaining([ids.skill, ids.link, ids.question]))
    const link = byId(ids.link)
    expect(link.kind === 'arrow' && link.both).toBe(true)
    const chip = rectOf(ids.question)
    expect(chip.y + chip.h).toBeLessThanOrEqual((link as { from: { y: number } }).from.y)
  })

  it('step 3: a tray under the conversation holds the first card with title, caption and visual; morph sits on the link', () => {
    expect(byId(ids.tray).since).toBe(3)
    const tray = rectOf(ids.tray)
    expect(tray.y).toBeGreaterThan(rectOf(ids.you).y + rectOf(ids.you).h)
    const card = byId(ids.card1)
    expect(card.since).toBe(3)
    expect(card.kind === 'box' && card.text).toEqual(['title', 'caption', 'visual'])
    expect(within(rectOf(ids.card1), tray)).toBe(true)
    expect(byId(ids.link1).since).toBe(3)
    // The morph marker is drawn on the link between cards, not inside any card.
    const morph = rectOf(ids.morph1)
    for (const c of [ids.card1, ids.card2, ids.card3, ids.card4]) expect(within(morph, rectOf(c)), c).toBe(false)
    expect(Math.abs(morph.x + morph.w / 2 - (rectOf(ids.card1).x + rectOf(ids.card1).w))).toBeLessThan(morph.w)
  })

  it('step 4: more cards land in the tray row', () => {
    for (const c of [ids.card2, ids.card3, ids.card4]) {
      expect(byId(c).since).toBe(4)
      expect(rectOf(c).y).toBe(rectOf(ids.card1).y)
    }
  })

  it('step 5: a ghost card in the tray and a partial/full control docked on you', () => {
    const ghost = byId(ids.ghost)
    expect(ghost.since).toBe(5)
    expect(ghost.kind === 'box' && ghost.role).toBe('ghost-card')
    expect(within(rectOf(ids.ghost), rectOf(ids.tray))).toBe(true)
    const you = rectOf(ids.you)
    const control = rectOf(ids.depth)
    expect(textOf(ids.depth)).toMatch(/partial.*full/)
    expect(control.x).toBeGreaterThanOrEqual(you.x)
    expect(control.x).toBeLessThan(you.x + you.w)
    expect(control.y).toBeGreaterThanOrEqual(you.y + you.h)
  })

  it('step 6: the scene-kit socket plugs into the tray bottom edge and the tray is not framed', () => {
    expect(byId(ids.socket).since).toBe(6)
    const tray = rectOf(ids.tray)
    const socket = rectOf(ids.socket)
    expect(socket.y).toBeLessThan(tray.y + tray.h)
    expect(socket.y + socket.h).toBeGreaterThan(tray.y + tray.h)
    expect(textOf(ids.socket)).toMatch(/scene kit/)
    expect(ENTITIES.filter((e) => e.kind === 'frame').map((e) => e.since)).toEqual([9])
  })

  it('step 7: verify chained after the cards in the same row with a green pass check', () => {
    const v = rectOf(ids.verify)
    expect(byId(ids.verify).since).toBe(7)
    expect(v.y).toBe(rectOf(ids.card1).y)
    for (const c of [ids.card1, ids.card2, ids.card3, ids.card4, ids.ghost]) {
      expect(v.x).toBeGreaterThan(rectOf(c).x + rectOf(c).w - 1)
    }
    expect(textOf(ids.verify)).toMatch(/build \+ render/)
    expect(within(rectOf(ids.pass), v)).toBe(true)
    expect(byId(ids.pass).role).toBe('pass')
  })

  it('step 8: a modify arc from the conversation into the cards and a flagged edited card', () => {
    const arc = byId(ids.modify)
    expect(arc.since).toBe(8)
    if (arc.kind !== 'arrow') throw new Error('modify arc must be an arrow')
    expect(arc.from.y).toBeLessThan(rectOf(ids.tray).y)
    expect(arc.to.y).toBeGreaterThanOrEqual(rectOf(ids.tray).y)
    const ring = rectOf(ids.editedRing)
    expect(within(rectOf(ids.card3), ring)).toBe(true)
    expect(byId(ids.edited).since).toBe(8)
  })

  it('step 9: a labeled outer frame encloses the whole existing diagram', () => {
    const frame = rectOf(ids.frame)
    expect(byId(ids.frame).since).toBe(9)
    for (const e of ENTITIES) {
      if (e.id === ids.frame) continue
      if (e.kind === 'arrow') {
        for (const p of [e.from, e.to]) expect(within({ x: p.x, y: p.y, w: 0, h: 0 }, frame), e.id).toBe(true)
      } else {
        expect(within(e as unknown as Rect, frame), e.id).toBe(true)
      }
    }
    expect(byId(ids.frameLabel).since).toBe(9)
    expect(textOf(ids.frameLabel).length).toBeGreaterThan(0)
  })

  it('keeps every entity inside the 880 x 380 canvas', () => {
    const inside = (x: number, y: number) => x >= 0 && y >= 0 && x <= 880 && y <= 380
    for (const e of ENTITIES) {
      if (e.kind === 'arrow') {
        expect(inside(e.from.x, e.from.y) && inside(e.to.x, e.to.y), e.id).toBe(true)
      } else {
        expect(inside(e.x, e.y) && inside(e.x + e.w, e.y + e.h), e.id).toBe(true)
      }
    }
  })

  it('uses a raw motion element with a stable layoutId for the coordinate-heavy tray', () => {
    const source = readFileSync(path.join(here, 'how-to-make-a-presentation/SampleScene.tsx'), 'utf8')
    expect(source).toMatch(/<motion\.div layoutId=\{ids\.tray\}/)
  })

  it('keeps retained Appear wrappers and their entities mounted, with opacity not restarted, as steps advance', async () => {
    const next = () =>
      act(() => {
        fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      })
    const entity = (id: string) => document.querySelector<HTMLElement>(`[data-presentation-id="${id}"]`)!
    const wrapper = (id: string) => entity(id).closest<HTMLElement>('[data-presentation-appear]')!
    render(<Presentation steps={STEPS} title="x" />)
    next()
    next() // step 3: card-1 lands
    const card = entity(ids.card1)
    const card1Wrapper = wrapper(ids.card1)
    const you = entity(ids.you)
    const youWrapper = wrapper(ids.you)
    await waitFor(() => expect(card1Wrapper.style.opacity).toBe('1'), { timeout: 4000 })
    for (let step = 4; step <= 9; step++) {
      next()
      // Same DOM instances, and the wrapper never drops back to the entry state.
      expect(entity(ids.card1)).toBe(card)
      expect(wrapper(ids.card1)).toBe(card1Wrapper)
      expect(entity(ids.you)).toBe(you)
      expect(wrapper(ids.you)).toBe(youWrapper)
      expect(card1Wrapper.style.opacity).toBe('1')
      expect(youWrapper.style.opacity).toBe('1')
    }
    // Only entities introduced on the step enter from the hidden state.
  })

  it('starts a newcomer hidden while continuing entities stay visible', async () => {
    render(<Presentation steps={STEPS} title="x" />)
    const next = () =>
      act(() => {
        fireEvent.keyDown(document.body, { key: 'ArrowRight' })
      })
    const wrapperOf = (id: string) =>
      document.querySelector<HTMLElement>(`[data-presentation-id="${id}"]`)!.closest<HTMLElement>('[data-presentation-appear]')!
    await waitFor(() => expect(wrapperOf(ids.you).style.opacity).toBe('1'), { timeout: 4000 })
    next()
    expect(wrapperOf(ids.skill).style.opacity).toBe('0')
    expect(wrapperOf(ids.you).style.opacity).toBe('1')
  })

  it('shares one group so every step keeps the same scene instance', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })
})
