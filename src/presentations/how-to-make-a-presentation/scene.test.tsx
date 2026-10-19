import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ALL_ARROWS, ALL_RECTS, ARROWS, CARD_IDS, ID, RECTS, idsAtStep, type EntitySpec } from './entities'
import { ALL_SPECS, entity, geometry, mount, next, prev, renderedIds, settleAt, type Geometry } from './test-support'

vi.setConfig({ testTimeout: 60000 })
afterEach(cleanup)

// Literal expectation of which entities each step introduces (independent of entities.ts step fields).
const INTRODUCED: Record<number, string[]> = {
  1: ['prompt', 'you'],
  2: ['skill', 'convo-arrow', 'question'],
  3: ['tray', 'card-1'],
  4: ['card-2', 'card-3', 'link-1-2', 'morph-1-2', 'link-2-3', 'morph-2-3'],
  5: ['ghost-card', 'link-3-ghost', 'depth'],
  6: ['kit-socket'],
  7: ['verify', 'link-ghost-verify', 'verify-pass'],
  8: ['modify-arc', 'modify-label', 'edited-flag'],
  9: ['outer-frame'],
}
const full = (short: string) => `how-to-make-a-presentation/${short}`

function goTo(c: HTMLElement, step: number) {
  for (let i = 0; i < step - 1; i++) next(c)
}

const px = (v: string) => Number.parseFloat(v)
function box(c: HTMLElement, spec: EntitySpec) {
  const el = entity(c, spec.id)
  if (!el) throw new Error(`missing ${spec.id}`)
  return { x: px(el.style.left), y: px(el.style.top), w: px(el.style.width), h: px(el.style.height), el }
}
function line(c: HTMLElement, id: string) {
  const l = entity(c, id)?.querySelector('line')
  if (!l) throw new Error(`missing arrow ${id}`)
  const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((a) => Number(l.getAttribute(a)))
  return { x1, y1, x2, y2 }
}

describe('entity ids per step (L-45)', () => {
  it('introduces each named entity at exactly the right beat and keeps it afterwards', async () => {
    const c = mount()
    const seen = new Set<string>()
    for (let step = 1; step <= 9; step++) {
      if (step > 1) next(c)
      const expectedNew = INTRODUCED[step].map(full)
      const now = new Set(renderedIds(c))
      for (const id of expectedNew) expect(now.has(id), `${id} at step ${step}`).toBe(true)
      const fresh = [...now].filter((id) => !seen.has(id))
      expect(fresh.sort(), `new ids at step ${step}`).toEqual([...expectedNew].sort())
      for (const id of seen) expect(now.has(id), `${id} retained at step ${step}`).toBe(true)
      fresh.forEach((id) => seen.add(id))
      expect([...now].sort()).toEqual(idsAtStep(step).sort())
    }
    expect(seen.size).toBe(ALL_SPECS.length)
  })

  it('uses distinct stable ids for distinct cards and no duplicated hooks', () => {
    const c = mount()
    goTo(c, 9)
    expect(new Set(CARD_IDS).size).toBe(3)
    for (const id of CARD_IDS) expect(c.querySelectorAll(`[data-presentation-entity="${id}"]`)).toHaveLength(1)
    const ids = renderedIds(c)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => id.startsWith('how-to-make-a-presentation/'))).toBe(true)
  })

  it('renders meaningful labels and content, not just ids', () => {
    const c = mount()
    goTo(c, 9)
    const text = (id: string) => entity(c, id)?.textContent ?? ''
    expect(text(ID.prompt)).toContain('sourdough')
    expect(text(ID.you)).toBe('You')
    expect(text(ID.skill)).toBe('Skill')
    expect(text(ID.question)).toContain('question')
    expect(text(ID.tray)).toContain('route')
    expect(text(ID.card1)).toContain('Step 1')
    expect(text(ID.card2)).toContain('Step 2')
    expect(text(ID.card3)).toContain('Step 3')
    expect(text(ID.ghost)).toContain('steps you left open')
    expect(text(ID.depth)).toMatch(/partial.*full/)
    expect(text(ID.kitSocket)).toContain('shared scene kit')
    expect(text(ID.verify)).toMatch(/verify.*build.*render/)
    expect(entity(c, ID.verifyPass)?.querySelector('svg')).not.toBeNull()
    expect(text(ID.modifyLabel)).toContain('edit')
    expect(text(ID.editedFlag)).toContain('edited')
    expect(text(ID.outerFrame)).toContain('built by the skill')
  })
})

describe('one accumulating scene (L-46)', () => {
  it('accumulates monotonically with shared ids keeping the same rect (data)', () => {
    const rects = [...ALL_RECTS, ...ALL_ARROWS]
    for (let step = 1; step < 9; step++) {
      const a = new Set(idsAtStep(step))
      const b = new Set(idsAtStep(step + 1))
      for (const id of a) expect(b.has(id)).toBe(true)
      expect(b.size).toBeGreaterThan(a.size)
    }
    // every entity has exactly one rect: ids are unique, so no step can give it another
    expect(new Set(rects.map((r) => r.id)).size).toBe(rects.length)
  })

  it('navigates all nine steps forward and back on one scene with identical continuing DOM nodes and geometry', async () => {
    const c = mount()
    const sceneEl = c.querySelector('[data-presentation-scene]')
    expect(sceneEl).not.toBeNull()
    expect(sceneEl?.getAttribute('data-presentation-scene')).toBe('scene')
    const nodes = new Map<string, Element>()
    const geo = new Map<string, Geometry>()

    const record = (step: number, forward: boolean) => {
      expect(c.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
      expect(c.querySelector('[data-presentation-scene]')).toBe(sceneEl)
      for (const id of idsAtStep(step)) {
        const el = entity(c, id) as HTMLElement
        expect(el, id).not.toBeNull()
        if (forward && !nodes.has(id)) {
          nodes.set(id, el)
          geo.set(id, geometry(el))
        }
        expect(el, `${id} is the same node at step ${step}`).toBe(nodes.get(id))
        expect(geometry(el), `${id} geometry at step ${step}`).toEqual(geo.get(id))
        expect(el.getAttribute('data-presentation-entity')).toBe(id)
      }
    }

    record(1, true)
    for (let step = 2; step <= 9; step++) {
      next(c)
      record(step, true)
    }
    for (let step = 8; step >= 1; step--) {
      prev(c)
      await settleAt(c, step)
      record(step, false)
    }
    // and forward again after the back traversal: new nodes may mount, scene must not
    for (let step = 2; step <= 9; step++) {
      next(c)
      expect(c.querySelector('[data-presentation-scene]')).toBe(sceneEl)
    }
  }, 60000)

  it('renders the data rects as the entity geometry', () => {
    const c = mount()
    goTo(c, 9)
    for (const r of ALL_RECTS) {
      const b = box(c, r)
      expect([b.x, b.y, b.w, b.h]).toEqual([r.x, r.y, r.w, r.h])
    }
    for (const a of ALL_ARROWS) {
      expect(line(c, a.id)).toEqual({ x1: a.from[0], y1: a.from[1], x2: a.to[0], y2: a.to[1] })
    }
  })
})

describe('scene relationships per step (C-1)', () => {
  it('step 1: you and a prompt bubble above them', () => {
    const c = mount()
    expect(renderedIds(c).sort()).toEqual([ID.prompt, ID.you].sort())
    const you = box(c, RECTS.you)
    const prompt = box(c, RECTS.prompt)
    expect(prompt.y + prompt.h).toBeLessThanOrEqual(you.y)
    expect(prompt.x).toBeGreaterThanOrEqual(you.x - 1)
    expect(prompt.x).toBeLessThan(you.x + you.w)
  })

  it('step 2: two-way arrow you <-> skill with the question chip above it', () => {
    const c = mount()
    goTo(c, 2)
    const you = box(c, RECTS.you)
    const skill = box(c, RECTS.skill)
    const chip = box(c, RECTS.question)
    const arrowEl = entity(c, ARROWS.convo.id)
    expect(arrowEl?.getAttribute('data-presentation-two-way')).toBe('true')
    const l = line(c, ARROWS.convo.id)
    expect(l.x1).toBeGreaterThanOrEqual(you.x + you.w)
    expect(l.x1).toBeLessThan(skill.x)
    expect(l.x2).toBeLessThanOrEqual(skill.x)
    expect(l.x2).toBeGreaterThan(you.x + you.w)
    expect(l.y1).toBe(l.y2)
    expect(l.y1).toBeGreaterThan(you.y)
    expect(l.y1).toBeLessThan(you.y + you.h)
    expect(skill.y).toBe(you.y)
    expect(chip.y + chip.h).toBeLessThanOrEqual(l.y1)
    expect(chip.x).toBeGreaterThanOrEqual(Math.min(l.x1, l.x2))
    expect(chip.x + chip.w).toBeLessThanOrEqual(Math.max(l.x1, l.x2))
    expect(chip.el.textContent).toContain('question')
  })

  it('step 3: tray under the conversation holds the first card showing title, caption and visual parts', () => {
    const c = mount()
    goTo(c, 3)
    const you = box(c, RECTS.you)
    const tray = box(c, RECTS.tray)
    const card = box(c, RECTS.card1)
    expect(tray.y).toBeGreaterThanOrEqual(you.y + you.h)
    expect(card.x).toBeGreaterThanOrEqual(tray.x)
    expect(card.x + card.w).toBeLessThanOrEqual(tray.x + tray.w)
    expect(card.y).toBeGreaterThanOrEqual(tray.y)
    expect(card.y + card.h).toBeLessThanOrEqual(tray.y + tray.h)
    for (const part of ['title', 'caption', 'visual']) {
      expect(card.el.querySelector(`[data-presentation-part="${part}"]`), part).not.toBeNull()
    }
    expect(c.querySelector('[data-presentation-entity*="morph"]')).toBeNull()
  })

  it('step 4: more cards in the same row; morphs are annotated on the inter-card links, not inside cards', () => {
    const c = mount()
    goTo(c, 4)
    const cards = [RECTS.card1, RECTS.card2, RECTS.card3].map((r) => box(c, r))
    expect(new Set(cards.map((k) => k.y)).size).toBe(1)
    expect(cards[0].x).toBeLessThan(cards[1].x)
    expect(cards[1].x).toBeLessThan(cards[2].x)
    const links = [ARROWS.link12, ARROWS.link23]
    const morphs = [RECTS.morph12, RECTS.morph23]
    links.forEach((link, i) => {
      const l = line(c, link.id)
      expect(l.x1).toBeGreaterThanOrEqual(cards[i].x + cards[i].w)
      expect(l.x2).toBeLessThanOrEqual(cards[i + 1].x)
      expect(l.y1).toBeGreaterThan(cards[i].y)
      expect(l.y1).toBeLessThan(cards[i].y + cards[i].h)
      const m = box(c, morphs[i])
      expect(m.x).toBeGreaterThanOrEqual(cards[i].x + cards[i].w)
      expect(m.x + m.w).toBeLessThanOrEqual(cards[i + 1].x)
      expect(m.el.textContent?.trim()).toBeTruthy()
      for (const card of cards) {
        expect(card.el.contains(m.el)).toBe(false)
        expect(card.el.textContent).not.toBe(m.el.textContent)
      }
    })
    for (const card of cards) {
      expect(card.el.querySelector('[data-presentation-entity]')).toBeNull()
    }
  })

  it('step 5: dashed-ghost card in the row and the partial/full control docked on you', () => {
    const c = mount()
    goTo(c, 5)
    const you = box(c, RECTS.you)
    const depth = box(c, RECTS.depth)
    const ghost = box(c, RECTS.ghost)
    const card3 = box(c, RECTS.card3)
    expect(depth.y).toBe(you.y + you.h)
    expect(depth.x).toBeGreaterThanOrEqual(you.x)
    expect(depth.x + depth.w).toBeLessThanOrEqual(you.x + you.w)
    expect(depth.el.querySelector('[data-presentation-segment="partial"]')).not.toBeNull()
    expect(depth.el.querySelector('[data-presentation-segment="full"]')).not.toBeNull()
    expect(depth.el.querySelector('[data-presentation-selected]')?.getAttribute('data-presentation-segment')).toBe('partial')
    expect(ghost.el.classList.contains('sample-ghost')).toBe(true)
    expect(ghost.y).toBe(card3.y)
    expect(ghost.x).toBeGreaterThan(card3.x + card3.w)
    const l = line(c, ARROWS.link3Ghost.id)
    expect(l.x1).toBeGreaterThanOrEqual(card3.x + card3.w)
    expect(l.x2).toBeLessThanOrEqual(ghost.x)
  })

  it('step 6: the kit socket plugs into the bottom edge of the unframed tray and names the shared kit', () => {
    const c = mount()
    goTo(c, 6)
    const tray = box(c, RECTS.tray)
    const socket = box(c, RECTS.kitSocket)
    expect(socket.y).toBe(tray.y + tray.h)
    expect(socket.x).toBeGreaterThanOrEqual(tray.x)
    expect(socket.x + socket.w).toBeLessThanOrEqual(tray.x + tray.w)
    expect(socket.el.textContent).toContain('shared scene kit')
    expect(c.querySelectorAll('[data-presentation-kind="frame"]')).toHaveLength(0)
    expect(tray.el.getAttribute('data-presentation-kind')).toBe('box')
    expect(tray.el.closest('[data-presentation-kind="frame"]')).toBeNull()
  })

  it('step 7: verify chained after the cards in the same row, build and render resolving to a green pass check', () => {
    const c = mount()
    goTo(c, 7)
    const verify = box(c, RECTS.verify)
    const cards = [RECTS.card1, RECTS.card2, RECTS.card3, RECTS.ghost].map((r) => box(c, r))
    for (const card of cards) {
      expect(verify.x).toBeGreaterThan(card.x + card.w)
      expect(verify.y).toBe(card.y)
      expect(verify.h).toBe(card.h)
    }
    const l = line(c, ARROWS.linkGhostVerify.id)
    expect(l.x1).toBeGreaterThanOrEqual(cards[3].x + cards[3].w)
    expect(l.x2).toBeLessThanOrEqual(verify.x)
    expect(verify.el.querySelector('[data-presentation-check="build"]')).not.toBeNull()
    expect(verify.el.querySelector('[data-presentation-check="render"]')).not.toBeNull()
    expect(verify.el.getAttribute('data-presentation-state')).toBe('pass')
    const pass = box(c, RECTS.verifyPass)
    expect(pass.x).toBeGreaterThanOrEqual(verify.x)
    expect(pass.x + pass.w).toBeGreaterThan(verify.x + verify.w - 20)
    expect(pass.y).toBeLessThan(verify.y)
    expect(pass.y + pass.h).toBeGreaterThan(verify.y)
    expect(pass.el.querySelector('svg')).not.toBeNull()
    expect(pass.el.getAttribute('aria-label')).toMatch(/pass/)
  })

  it('step 8: the modify arc runs from the conversation into the route and the edited card is flagged', () => {
    const c = mount()
    goTo(c, 8)
    const you = box(c, RECTS.you)
    const skill = box(c, RECTS.skill)
    const tray = box(c, RECTS.tray)
    const card3 = box(c, RECTS.card3)
    const l = line(c, ARROWS.modify.id)
    expect(l.y1).toBeGreaterThanOrEqual(you.y)
    expect(l.y1).toBeLessThanOrEqual(you.y + you.h)
    expect(l.x1).toBeGreaterThan(you.x + you.w)
    expect(l.x1).toBeLessThan(skill.x)
    expect(l.y2).toBeGreaterThan(tray.y - 1)
    expect(l.x2).toBeGreaterThanOrEqual(card3.x)
    expect(l.x2).toBeLessThanOrEqual(card3.x + card3.w)
    const flag = box(c, RECTS.editedFlag)
    expect(flag.el.getAttribute('data-presentation-emphasis')).toBe('true')
    expect(flag.el.getAttribute('data-presentation-kind')).toBe('emphasis')
    expect(flag.x).toBeLessThan(card3.x)
    expect(flag.y).toBeLessThan(card3.y)
    expect(flag.x + flag.w).toBeGreaterThan(card3.x + card3.w)
    expect(flag.y + flag.h).toBeGreaterThan(card3.y + card3.h)
    expect(card3.el.getAttribute('data-presentation-state')).toBe('edited')
    for (const other of [RECTS.card1, RECTS.card2]) {
      expect(box(c, other).el.getAttribute('data-presentation-state')).not.toBe('edited')
      expect(flag.x).toBeGreaterThan(box(c, other).x + box(c, other).w)
    }
  })

  it('step 9: a labeled outer frame encloses the whole accumulated diagram', () => {
    const c = mount()
    goTo(c, 9)
    const frame = box(c, RECTS.outerFrame)
    expect(frame.el.getAttribute('data-presentation-kind')).toBe('frame')
    expect(frame.el.querySelector('[data-presentation-label]')?.textContent).toBeTruthy()
    expect(frame.x).toBeGreaterThanOrEqual(0)
    expect(frame.y).toBeGreaterThanOrEqual(0)
    expect(frame.x + frame.w).toBeLessThanOrEqual(880)
    expect(frame.y + frame.h).toBeLessThanOrEqual(380)
    for (const r of ALL_RECTS) {
      if (r.id === RECTS.outerFrame.id) continue
      expect(r.x, r.id).toBeGreaterThan(frame.x)
      expect(r.y, r.id).toBeGreaterThan(frame.y)
      expect(r.x + r.w, r.id).toBeLessThan(frame.x + frame.w)
      expect(r.y + r.h, r.id).toBeLessThan(frame.y + frame.h)
    }
    for (const a of ALL_ARROWS) {
      for (const [x, y] of [a.from, a.to]) {
        expect(x).toBeGreaterThan(frame.x)
        expect(y).toBeGreaterThan(frame.y)
        expect(x).toBeLessThan(frame.x + frame.w)
        expect(y).toBeLessThan(frame.y + frame.h)
      }
    }
  })
})
