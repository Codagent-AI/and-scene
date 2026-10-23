import { fireEvent, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { presentations } from '../../src/presentations'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { E } from '../../src/presentations/how-to-make-a-presentation/entities'
import { setViewport } from '../helpers/fixtures'
import { ROOT, specOutline } from '../helpers/spec-outline'

beforeEach(() => setViewport(1440))

const SLUG = 'how-to-make-a-presentation'

describe('reference sample outline', () => {
  it('has the nine normative steps (era, title, caption) in order', () => {
    const expected = specOutline()
    expect(expected).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => ({ era, title, caption }))).toEqual(expected)
  })

  it('keeps verify.config.json in step with the canonical table', () => {
    const config = JSON.parse(readFileSync(path.join(ROOT, 'verify.config.json'), 'utf8'))
    expect(config.reference.slug).toBe(SLUG)
    expect(config.reference.steps).toEqual(specOutline())
  })

  it('is registered under its slug with the canonical title', () => {
    const entry = presentations.find((p) => p.slug === SLUG)
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('shares one scene group and stable ids', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })
})

type Box = { left: number; top: number; width: number; height: number }
const entities = () => {
  const map = new Map<string, { el: Element; box: Box }>()
  for (const el of document.querySelectorAll<HTMLElement>('[data-presentation-entity]')) {
    const st = el.style
    map.set(el.getAttribute('data-presentation-entity')!, {
      el,
      box: { left: parseFloat(st.left), top: parseFloat(st.top), width: parseFloat(st.width), height: parseFloat(st.height) },
    })
  }
  return map
}
const next = () => fireEvent.keyDown(window, { key: 'ArrowRight' })
const get = (m: ReturnType<typeof entities>, id: string) => m.get(id)!

describe('reference sample renders as one accumulating scene', () => {
  const expectedNew: Record<number, string[]> = {
    0: [E.you, E.prompt],
    1: [E.skill, E.talk, E.question],
    2: [E.tray, E.card1],
    3: [E.card2, E.card3, E.card4, E.link1, E.link2, E.link3],
    4: [E.ghost, E.control],
    5: [E.socket],
    6: [E.verify, E.link4, E.pass],
    7: [E.modify, E.edited, E.editedFlag],
    8: [E.frame, E.reveal],
  }

  it('shows each step\'s caption and title, navigates next and previous, and adds exactly the intended entities', () => {
    const { container } = render(<Talk />)
    const snapshots: ReturnType<typeof entities>[] = []
    const outline = specOutline()
    for (let i = 0; i < 9; i++) {
      expect(container.querySelector('[data-presentation-caption]')!.textContent).toBe(outline[i].caption)
      expect(container.querySelector('[data-presentation-title]')!.textContent).toBe(outline[i].title)
      expect(container.querySelector('[data-presentation-era]')!.textContent).toBe(outline[i].era)
      snapshots.push(entities())
      if (i < 8) next()
    }
    // previous returns to the earlier content
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(container.querySelector('[data-presentation-title]')!.textContent).toBe(outline[7].title)

    const seen = new Set<string>()
    snapshots.forEach((snap, i) => {
      for (const id of expectedNew[i]) {
        expect(snap.has(id), `step ${i + 1} has ${id}`).toBe(true)
        expect(seen.has(id), `${id} is new at step ${i + 1}`).toBe(false)
      }
      const nowSeen = new Set([...seen, ...expectedNew[i]])
      for (const id of snap.keys()) {
        if (id.endsWith('-label')) continue // link labels travel with their link
        expect(nowSeen.has(id), `unexpected entity ${id} at step ${i + 1}`).toBe(true)
      }
      for (const id of seen) expect(snap.has(id), `${id} persists at step ${i + 1}`).toBe(true)
      expectedNew[i].forEach((id) => seen.add(id))
    })
  })

  it('never moves, resizes or redraws a continuing entity (same node, same coordinates)', () => {
    render(<Talk />)
    const first = entities()
    for (let i = 0; i < 8; i++) {
      next()
      const now = entities()
      for (const [id, prev] of first) {
        expect(now.get(id)?.el, `${id} keeps its node`).toBe(prev.el)
        expect(now.get(id)?.box).toEqual(prev.box)
      }
      for (const [id, v] of now) if (!first.has(id)) first.set(id, v)
    }
  })

  it('draws every scene-intent cell', () => {
    const { container } = render(<Talk />)
    for (let i = 0; i < 8; i++) next()
    const m = entities()
    const b = (id: string) => get(m, id).box
    const bottom = (id: string) => b(id).top + b(id).height
    const right = (id: string) => b(id).left + b(id).width

    // conversation row anchors the top; you on the left, skill on the right
    expect(b(E.you).left).toBeLessThan(b(E.skill).left)
    expect(b(E.you).top).toBe(b(E.skill).top)
    // two-way arrow with a question chip above it
    const talk = container.querySelector(`[data-presentation-entity="${E.talk}"]`)!
    expect(talk.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
    expect(bottom(E.question)).toBeLessThanOrEqual(58)
    // tray under the conversation; step cards sit inside it
    expect(b(E.tray).top).toBeGreaterThan(Math.max(bottom(E.you), bottom(E.skill)))
    for (const c of [E.card1, E.card2, E.card3, E.card4]) {
      expect(b(c).left).toBeGreaterThanOrEqual(b(E.tray).left)
      expect(right(c)).toBeLessThanOrEqual(right(E.tray))
      const parts = [...get(m, c).el.querySelectorAll('[data-part]')].map((p) => p.getAttribute('data-part'))
      expect(parts).toEqual(['title', 'caption', 'visual'])
    }
    // what morphs is drawn on the links between consecutive cards, not inside them
    const cards = [E.card1, E.card2, E.card3, E.card4]
    ;[E.link1, E.link2, E.link3].forEach((link, i) => {
      const labelEl = get(m, `${link}-label`)
      expect(labelEl.el.textContent).toBe('morph')
      expect(labelEl.box.left).toBeGreaterThanOrEqual(right(cards[i]))
      expect(right(`${link}-label`)).toBeLessThanOrEqual(b(cards[i + 1]).left)
      for (const c of cards) expect(get(m, c).el.textContent).not.toContain('morph')
    })
    // ghost card marks unspecified steps; the partial<->full control docks on "you"
    expect(get(m, E.ghost).el.getAttribute('data-presentation-kind')).toBe('ghost')
    expect(b(E.control).left).toBe(b(E.you).left)
    expect(b(E.control).top - bottom(E.you)).toBeLessThanOrEqual(12)
    expect(get(m, E.control).el.textContent).toBe('partial ↔ full')
    // the scene-kit socket plugs into the tray's bottom edge; the tray is not framed
    expect(b(E.socket).top).toBeLessThan(bottom(E.tray))
    expect(bottom(E.socket)).toBeGreaterThan(bottom(E.tray))
    expect(get(m, E.socket).el.textContent).toContain('scene kit')
    expect(get(m, E.tray).el.getAttribute('data-presentation-kind')).toBe('tray')
    expect(get(m, E.tray).el.getAttribute('data-presentation-kind')).not.toBe('frame')
    // verify is chained after the cards in the same row, with a green pass check on it
    expect(b(E.verify).top).toBe(b(E.card1).top)
    for (const c of [...cards, E.ghost]) expect(b(E.verify).left).toBeGreaterThan(right(c))
    // a drawn connection runs from the last tray slot into verify
    const chain = container.querySelector(`[data-presentation-entity="${E.link4}"] [data-presentation-arrow-shaft]`)!.getAttribute('d')!
    const [cx1, cy1, , , cx2, cy2] = chain.match(/-?\d+(\.\d+)?/g)!.map(Number)
    expect(cx1).toBeGreaterThanOrEqual(right(E.ghost))
    expect(cx2).toBeLessThanOrEqual(b(E.verify).left)
    expect(cx2 - cx1).toBeGreaterThan(20)
    expect(cy1).toBe(cy2)
    expect(cy1).toBeGreaterThan(b(E.verify).top)
    expect(cy1).toBeLessThan(bottom(E.verify))
    expect(get(m, E.link4Label).el.textContent).toBe('check')
    expect(get(m, E.verify).el.textContent).toContain('build')
    expect(get(m, E.verify).el.textContent).toContain('render')
    expect(get(m, E.pass).el.textContent).toBe('pass')
    expect(get(m, E.pass).box.left).toBeGreaterThanOrEqual(b(E.verify).left)
    expect(right(E.pass)).toBeLessThanOrEqual(right(E.verify))
    // modify arc reaches from the conversation down to the flagged edited card
    const d = container.querySelector(`[data-presentation-entity="${E.modify}"] [data-presentation-arrow-shaft]`)!.getAttribute('d')!
    const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
    const [sx, sy, , , ex, ey] = nums
    expect(sy).toBeLessThanOrEqual(bottom(E.skill) + 8)
    expect(sy).toBeLessThan(ey)
    expect(ex).toBeGreaterThanOrEqual(b(E.card3).left)
    expect(ex).toBeLessThanOrEqual(right(E.card3))
    expect(sx).toBeGreaterThanOrEqual(b(E.skill).left)
    expect(get(m, E.card3).el.getAttribute('data-presentation-emphasis')).toBe('true')
    for (const c of [E.card1, E.card2, E.card4]) expect(get(m, c).el.hasAttribute('data-presentation-emphasis')).toBe(false)
    expect(get(m, E.editedFlag).el.textContent).toBe('edited')
    // not flagged before the loop step
    next()
    // reveal: an outer frame draws around the whole diagram, labeled
    const after = entities()
    const frame = get(after, E.frame).box
    for (const [id, v] of after) {
      if (id === E.frame || id === E.talk || id === E.modify || id.startsWith('htm-link-') && !id.endsWith('-label')) continue
      expect(v.box.left, id).toBeGreaterThanOrEqual(frame.left)
      expect(v.box.left + v.box.width, id).toBeLessThanOrEqual(frame.left + frame.width)
      expect(v.box.top, id).toBeGreaterThanOrEqual(frame.top)
      expect(v.box.top + v.box.height, id).toBeLessThanOrEqual(frame.top + frame.height)
    }
    expect(get(after, E.reveal).el.textContent).toContain('skill')
  })

  it('fades in only the entities a step introduces, never wrapping or re-fading continuing ones', async () => {
    const { container } = render(<Talk />)
    const opacity = (id: string) => (container.querySelector(`[data-presentation-entity="${id}"]`) as HTMLElement).style.opacity
    expect(container.querySelector('[data-presentation-appear]')).toBeNull()
    expect(opacity(E.you)).toBe('0') // step 1 newcomers start hidden
    for (let i = 0; i < 3; i++) {
      // let this step's newcomers finish fading in, then advance
      for (const id of expectedNew[i]) await waitFor(() => expect(opacity(id)).toBe('1'), { timeout: 10000 })
      const previous = [...entities().keys()]
      next()
      for (const id of previous) expect(opacity(id), `${id} continues without a fade`).toBe('1')
      for (const id of expectedNew[i + 1]) expect(opacity(id), `${id} enters hidden`).toBe('0')
    }
    expect(container.querySelector('[data-presentation-appear]')).toBeNull()
  }, 30000)

  it('flags the edited card only from the loop step on', () => {
    render(<Talk />)
    for (let i = 0; i < 6; i++) next()
    expect(entities().get(E.card3)!.el.hasAttribute('data-presentation-emphasis')).toBe(false)
    next()
    expect(entities().has(E.edited)).toBe(true)
  })

  it('opens in browse mode', () => {
    const { container } = render(<Talk />)
    expect(container.querySelector('[data-presentation-root]')!.getAttribute('data-presentation-mode')).toBe('browse')
  })
})
