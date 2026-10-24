// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit/index.ts'
import { ENTITIES, entitiesAt, type ArrowEntity, type Entity, type RectEntity } from '../../src/presentations/how-to-make-a-presentation/entities.ts'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps.ts'
import { mockViewport } from '../support/fixtures.tsx'
import { read } from '../support/files.ts'

/** The nine normative rows, parsed from the canonical spec so this test is its own oracle. */
function specRows() {
  const spec = read('openspec/changes/create-and-scene/specs/presentation-verification/spec.md')
  return [...spec.matchAll(/^\| (\d) \| ([^|]+) \| "(.+?)" \| ([^|]+) \| /gm)].map((m) => ({ n: Number(m[1]), era: m[2].trim(), title: m[3], caption: m[4].trim() }))
}

describe('sample steps match the normative outline (M-59, M-01)', () => {
  it('has exactly nine steps with the spec era, title and caption in order, verbatim', () => {
    const rows = specRows()
    expect(rows.map((r) => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(STEPS).toHaveLength(9)
    STEPS.forEach((step, i) => {
      expect({ era: step.era, title: step.title, caption: step.caption }, `step ${i + 1}`).toEqual({
        era: rows[i].era,
        title: rows[i].title,
        caption: rows[i].caption,
      })
    })
  })

  it('gives every step the five required fields and a unique stable id', () => {
    for (const step of STEPS) {
      for (const field of ['id', 'era', 'title', 'caption'] as const) expect(step[field].length, field).toBeGreaterThan(0)
      expect(step.Scene).toBeTypeOf('function')
      expect(step.payload).toBeDefined()
    }
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(STEPS.every((s) => s.groupKey === STEPS[0].groupKey)).toBe(true)
  })
})

const byId = (stage: number) => new Map(entitiesAt(stage).map((e) => [e.id, e]))
const rect = (id: string) => ENTITIES.find((e) => e.id === id) as RectEntity
const arrow = (id: string) => ENTITIES.find((e) => e.id === id) as ArrowEntity
const isRect = (e: Entity): e is RectEntity => e.kind !== 'arrow'

describe('each beat adds the named entities (M-60)', () => {
  const expected: Record<number, string[]> = {
    1: ['you', 'prompt'],
    2: ['skill', 'conversation', 'question'],
    3: ['tray', 'step-card', 'morph-link', 'morph-label', 'route'],
    4: ['step-card', 'step-card', 'morph-link', 'morph-label'],
    5: ['ghost-card', 'depth-control'],
    6: ['scene-kit', 'plug'],
    7: ['verify', 'chain', 'pass'],
    8: ['modify-arc', 'modify-label', 'flag', 'flagged-card'],
    9: ['reveal-frame', 'reveal-label'],
  }

  it.each(Object.entries(expected))('step %s introduces exactly its entities', (stage, roles) => {
    const introduced = ENTITIES.filter((e) => e.since === Number(stage)).map((e) => e.role)
    expect(introduced.sort()).toEqual([...roles].sort())
  })

  it.each(Object.keys(expected))('renders step %s with meaningful content for every entity', (stage) => {
    mockViewport(1280, 800)
    const view = render(<Presentation steps={STEPS} />)
    for (let i = 1; i < Number(stage); i++) fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    for (const entity of entitiesAt(Number(stage))) {
      const node = view.container.querySelector(`[data-presentation-entity="${entity.id}"]`)
      expect(node, entity.id).not.toBeNull()
      if (isRect(entity)) {
        if (entity.text) expect(node!.textContent, entity.id).toContain(entity.text)
        entity.parts?.forEach((part) => expect(node!.querySelector(`[data-card-part="${part}"]`), `${entity.id}/${part}`).not.toBeNull())
        if (entity.glyph) expect(node!.querySelector('svg[data-presentation-glyph]'), entity.id).not.toBeNull()
      } else {
        expect(node!.querySelector('path[d]')!.getAttribute('d'), entity.id).toMatch(/^M [\d.]+ [\d.]+ [LQ]/)
      }
    }
  })
})

describe('one accumulating scene (M-61)', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('step %i -> next only adds entities and never moves or resizes existing ones', (n) => {
    const now = byId(n)
    const later = byId(n + 1)
    for (const [id, entity] of now) expect(later.get(id), `${id} kept`).toEqual(entity)
    expect(later.size).toBeGreaterThan(now.size)
  })

  it('keeps DOM nodes and the single scene instance while navigating through all nine steps', () => {
    mockViewport(1280, 800)
    const view = render(<Presentation steps={STEPS} />)
    const scene = view.container.querySelector('[data-presentation-scene]')
    const nodes = new Map<string, Element>()
    for (let n = 1; n <= 9; n++) {
      for (const entity of entitiesAt(n)) {
        const node = view.container.querySelector(`[data-presentation-entity="${entity.id}"]`)!
        expect(node, `${entity.id} at ${n}`).not.toBeNull()
        if (nodes.has(entity.id)) expect(node, `${entity.id} remounted at ${n}`).toBe(nodes.get(entity.id))
        nodes.set(entity.id, node)
      }
      expect(view.container.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
      expect(view.container.querySelector('[data-presentation-scene]')).toBe(scene)
      if (n < 9) fireEvent.keyDown(document.body, { key: 'ArrowRight' })
    }
  })
})

/** Rectangle covered by an entity, including a curve's control-point extent. */
function extent(e: Entity) {
  if (isRect(e)) return { x1: e.x, y1: e.y, x2: e.x + e.w, y2: e.y + e.h }
  const pts = [e.from, e.to]
  if (e.bend) {
    const [x1, y1] = e.from
    const [x2, y2] = e.to
    const len = Math.hypot(x2 - x1, y2 - y1)
    pts.push([(x1 + x2) / 2 + (-(y2 - y1) / len) * e.bend, (y1 + y2) / 2 + ((x2 - x1) / len) * e.bend])
  }
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) }
}
const intersects = (a: ReturnType<typeof extent>, b: ReturnType<typeof extent>) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2
const inside = (inner: ReturnType<typeof extent>, outer: ReturnType<typeof extent>) =>
  inner.x1 >= outer.x1 && inner.y1 >= outer.y1 && inner.x2 <= outer.x2 && inner.y2 <= outer.y2

describe('sample design geometry (M-56)', () => {
  const canvas = { x1: 0, y1: 0, x2: 880, y2: 380 }

  it('keeps every entity extent, including curves and the reveal frame, inside the 880 x 380 canvas', () => {
    for (const e of ENTITIES) expect(inside(extent(e), canvas), e.id).toBe(true)
  })

  it('leaves room for each entity text, and only the intended entities overlap', () => {
    for (const e of ENTITIES.filter(isRect)) {
      const chars = Math.max(...[e.text, e.sub, ...(e.parts ?? [])].map((t) => t?.length ?? 0))
      const glyph = e.glyph ? 22 : 0
      expect(chars * 7 + glyph, `${e.id} text fits ${e.w}px`).toBeLessThanOrEqual(e.w)
    }
    const rects = ENTITIES.filter(isRect)
    const overlaps = new Set<string>()
    for (const [i, a] of rects.entries()) {
      for (const b of rects.slice(i + 1)) if (intersects(extent(a), extent(b))) overlaps.add([a.id, b.id].sort().join('|'))
    }
    const intentional = new Set(['card-2|edited-ring', 'verify|verify-pass'])
    const unexpected = [...overlaps].filter((pair) => !intentional.has(pair) && !pair.split('|').includes('reveal'))
    expect(unexpected).toEqual([])
  })

  it('keeps the closing frame around everything else', () => {
    const frame = extent(rect('reveal'))
    for (const e of ENTITIES.filter((x) => x.id !== 'reveal')) expect(inside(extent(e), frame), e.id).toBe(true)
  })
})

describe('normative relationships of the scene (C-01)', () => {
  it('connects you and skill with a two-way arrow and a question chip above it', () => {
    const you = rect('you')
    const skill = rect('skill')
    const link = arrow('conversation')
    expect(link.head).toBe('both')
    expect(link.from[0]).toBeGreaterThanOrEqual(you.x + you.w - 1)
    expect(link.to[0]).toBeLessThanOrEqual(skill.x + 1)
    expect(link.from[1]).toBeGreaterThan(you.y)
    expect(link.from[1]).toBeLessThan(you.y + you.h)
    const q = rect('question')
    expect(q.y + q.h).toBeLessThanOrEqual(link.from[1])
    expect(q.x).toBeGreaterThan(link.from[0])
    expect(q.x + q.w).toBeLessThan(link.to[0])
  })

  it('places the tray under the conversation with a first card that shows title, caption and visual', () => {
    const tray = arrow('tray')
    expect(tray.from[1]).toBeGreaterThan(rect('skill').y + rect('skill').h)
    const card = rect('card-1')
    expect(card.parts).toEqual(['title', 'caption', 'visual'])
    expect(card.y + card.h).toBeLessThanOrEqual(tray.from[1])
    expect(card.since).toBe(3)
  })

  it('draws the morph on the link between consecutive cards, not inside a card', () => {
    const cards = ['card-1', 'card-2', 'card-3'].map(rect)
    for (const [i, id] of ['link-1', 'link-2'].entries()) {
      const link = arrow(id)
      expect(link.from[0]).toBe(cards[i].x + cards[i].w)
      expect(link.to[0]).toBe(cards[i + 1].x)
      const chip = rect(`${id}-chip`)
      expect(chip.text).toBe('morph')
      expect(chip.x).toBeGreaterThanOrEqual(link.from[0] - 4)
      expect(chip.x + chip.w).toBeLessThanOrEqual(link.to[0] + 4)
      for (const card of cards) expect(intersects(extent(chip), extent(card)), `${id} chip vs ${card.id}`).toBe(false)
    }
    expect(cards.every((c) => c.y === cards[0].y && c.h === cards[0].h)).toBe(true) // the same tray row
  })

  it('docks the depth control on you and marks unspecified steps with a dashed ghost in the tray row', () => {
    const you = rect('you')
    const depth = rect('depth')
    expect(depth.text).toBe('partial ↔ full')
    expect(depth.x).toBeGreaterThanOrEqual(you.x)
    expect(depth.x + depth.w).toBeLessThanOrEqual(you.x + you.w)
    expect(depth.y - (you.y + you.h)).toBeLessThanOrEqual(12)
    const ghost = rect('ghost')
    expect(ghost.dashed).toBe(true)
    expect([ghost.y, ghost.h]).toEqual([rect('card-1').y, rect('card-1').h])
  })

  it('plugs the labelled scene-kit socket into the bottom edge of the unframed tray', () => {
    const socket = rect('scene-kit')
    const plug = arrow('scene-kit-plug')
    const tray = arrow('tray')
    expect(socket.text).toMatch(/scene kit/)
    expect(plug.from[1]).toBe(socket.y)
    expect(plug.to[1]).toBe(tray.from[1])
    expect(plug.from[0]).toBeGreaterThan(socket.x)
    expect(plug.from[0]).toBeLessThan(socket.x + socket.w)
    expect(ENTITIES.filter((e) => e.kind === 'frame' && e.since < 9)).toEqual([])
  })

  it('chains the verify node after the cards in the same row, resolving to a green pass check', () => {
    const verify = rect('verify')
    const cards = [rect('card-1'), rect('card-2'), rect('card-3'), rect('ghost')]
    expect([verify.y, verify.h]).toEqual([cards[0].y, cards[0].h])
    for (const c of cards) expect(verify.x).toBeGreaterThan(c.x + c.w - 1)
    const chain = arrow('chain')
    expect(chain.to[0]).toBe(verify.x)
    expect(chain.from[0]).toBe(rect('ghost').x + rect('ghost').w)
    expect(verify.sub).toBe('build + render')
    const pass = rect('verify-pass')
    expect(pass.state).toBe('pass')
    expect(pass.glyph).toBe('check')
    expect(inside(extent(pass), extent(verify))).toBe(true)
  })

  it('reaches the modify arc from the conversation down to a flagged card', () => {
    const skill = rect('skill')
    const modify = arrow('modify')
    const card = rect('card-2')
    expect(modify.from[1]).toBe(skill.y + skill.h)
    expect(modify.from[0]).toBeGreaterThanOrEqual(skill.x)
    expect(modify.from[0]).toBeLessThanOrEqual(skill.x + skill.w)
    expect(modify.to[1]).toBe(card.y)
    expect(modify.to[0]).toBeGreaterThan(card.x)
    expect(modify.to[0]).toBeLessThan(card.x + card.w)
    expect(modify.bend).toBeTruthy()
    expect(inside(extent(card), extent(rect('edited-ring')))).toBe(true)
    expect(rect('edited-flag').text).toBe('edited')
  })

  it('closes with a labelled frame that appears only at step 9', () => {
    const frame = rect('reveal')
    expect(frame.since).toBe(9)
    expect(rect('reveal-label').text).toMatch(/looking at/)
    expect(entitiesAt(8).some((e) => e.id === 'reveal')).toBe(false)
  })
})

describe('presentation-owned styling (M-44, M-52)', () => {
  const css = read('src/presentations/how-to-make-a-presentation/style.css')
  const rule = (selector: string) => {
    const match = css.match(new RegExp(`(?:^|\\n)${selector.replace(/[[\]().]/g, '\\$&')}\\s*\\{([^}]*)\\}`))
    return Object.fromEntries((match?.[1] ?? '').split(';').map((d) => d.split(':').map((s) => s.trim())).filter((d) => d[0]))
  }

  it('is loaded by the presentation entry and owned by its folder', () => {
    expect(read('src/presentations/how-to-make-a-presentation/Talk.tsx')).toMatch(/import '\.\/style\.css'/)
  })

  it('makes the active progress dot and ToC entry visibly different from inactive ones', () => {
    const baseDot = rule('[data-presentation-progress-item]')
    const activeDot = rule('[data-presentation-progress-item][data-presentation-active]')
    expect(activeDot.background).toBeTruthy()
    expect(activeDot.background).not.toBe(baseDot.background)
    expect(activeDot.transform).toMatch(/scale/)
    const baseToc = rule('[data-presentation-toc-item]')
    const activeToc = rule('[data-presentation-toc-item][data-presentation-active]')
    expect(activeToc['border-left-color']).not.toBe(baseToc['border-left'])
    expect(activeToc.color).not.toBe(baseToc.color)
    expect(activeToc['font-weight']).toBeTruthy()
  })

  it('styles the attribution to be legible and not browser-default', () => {
    const attribution = rule('[data-presentation-attribution]')
    expect(parseFloat(attribution['font-size'])).toBeGreaterThanOrEqual(0.75)
    expect(attribution.color).toBeTruthy()
  })
})
