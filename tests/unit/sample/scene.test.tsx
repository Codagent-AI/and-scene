import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Talk from '../../../src/presentations/how-to-make-a-presentation/Talk.tsx'
import {
  CANVAS,
  ENTITIES,
  ID,
  stageEntities,
  type ArrowEntity,
  type BoxEntity,
} from '../../../src/presentations/how-to-make-a-presentation/entities.ts'
import { Scene } from '../../../src/presentations/how-to-make-a-presentation/steps/Scene.tsx'
import { STEPS } from '../../../src/presentations/how-to-make-a-presentation/steps/index.ts'
import type { Rect } from '../../../src/presentation-kit/index.ts'
import { act, fireEvent } from '@testing-library/react'
import { setViewport } from '../helpers/fixtures.tsx'

vi.mock('motion/react', async () => (await import('../helpers/motionMock.tsx')).motionModule)

const meta = { id: 'x', index: 0, count: 9, era: '', title: '', caption: '' }
const mount = (stage: number) => render(<Scene payload={{ stage }} step={meta} />)
const ids = (stage: number) => stageEntities(stage).map((e) => e.id)
const box = (id: string) => ENTITIES.find((e) => e.id === id) as BoxEntity
const arrow = (id: string) => ENTITIES.find((e) => e.id === id) as ArrowEntity
const right = (r: Rect) => r.x + r.w
const bottom = (r: Rect) => r.y + r.h
const inside = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x && inner.y >= outer.y && right(inner) <= right(outer) && bottom(inner) <= bottom(outer)
const overlap = (a: Rect, b: Rect) => Math.min(right(a), right(b)) > Math.max(a.x, b.x) && Math.min(bottom(a), bottom(b)) > Math.max(a.y, b.y)
const css = readFileSync('src/presentations/how-to-make-a-presentation/talk.css', 'utf8')
const domOf = (c: HTMLElement) => [...c.querySelectorAll('[data-layout-id]')].map((e) => e.getAttribute('data-layout-id')!)

describe('one grouped evolving scene (L-58)', () => {
  it('shares one Scene and group across all nine steps', () => {
    expect(STEPS).toHaveLength(9)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.stage)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('only accumulates entities and keeps ids unique', () => {
    expect(new Set(ENTITIES.map((e) => e.id)).size).toBe(ENTITIES.length)
    for (let stage = 1; stage < 9; stage++) {
      expect(ids(stage + 1)).toEqual(expect.arrayContaining(ids(stage)))
      expect(ids(stage + 1).length).toBeGreaterThan(ids(stage).length)
    }
  })

  it('renders continuing entities with unchanged coordinates and sizes', () => {
    const style = (c: HTMLElement) =>
      Object.fromEntries([...c.querySelectorAll<HTMLElement>('[data-layout-id]')].map((e) => [e.dataset.layoutId, e.style.cssText]))
    const first = style(mount(5).container)
    const later = style(mount(9).container)
    for (const [id, css] of Object.entries(first)) expect(later[id], id).toBe(css)
  })

  it('anchors the conversation row above a lower tray', () => {
    for (const id of [ID.you, ID.prompt, ID.skill]) expect(bottom(box(id).rect)).toBeLessThan(box(ID.tray).rect.y)
    expect(box(ID.you).rect.y).toBeLessThan(20)
  })

  it('renders only entities introduced by each step, in registry order', () => {
    for (let stage = 1; stage <= 9; stage++) {
      const { container, unmount } = mount(stage)
      const withLayoutId = domOf(container)
      expect(withLayoutId.sort()).toEqual(ids(stage).filter((id) => ENTITIES.find((e) => e.id === id)!.kind !== 'arrow').sort())
      unmount()
    }
  })

  it('wraps every entity in Appear with a key stable across steps', () => {
    const { container, rerender } = mount(3)
    const before = container.querySelector('[data-role="card"]')!.closest('[data-presentation-appear]')
    rerender(<Scene payload={{ stage: 4 }} step={meta} />)
    expect(container.querySelector('[data-role="card"]')!.closest('[data-presentation-appear]')).toBe(before)
  })
})

describe('step intent (L-59..L-62)', () => {
  it('step 1: you and a prompt bubble', () => {
    expect(ids(1)).toEqual([ID.you, ID.prompt])
    const { container } = mount(1)
    expect(container.querySelector('[data-role="you"]')!.textContent).toBe('you')
    expect(container.querySelector('[data-role="prompt"]')).not.toBeNull()
  })

  it('step 2: skill, two-way arrow between you and skill, question chip above it', () => {
    expect(ids(2).slice(2)).toEqual([ID.skill, ID.talk, ID.question])
    const a = arrow(ID.talk)
    expect(a.bidirectional).toBe(true)
    expect(a.from.x).toBe(right(box(ID.you).rect))
    expect(a.to.x).toBe(box(ID.skill).rect.x)
    expect(a.from.y).toBe(a.to.y)
    const chip = box(ID.question).rect
    expect(bottom(chip)).toBeLessThanOrEqual(a.from.y)
    expect(chip.x).toBeGreaterThan(a.from.x)
    expect(right(chip)).toBeLessThan(a.to.x)
    const { container } = mount(2)
    expect(container.querySelector('[data-role="skill"]')!.textContent).toBe('skill')
    expect(container.querySelector('[data-presentation-arrow-tail]')).not.toBeNull()
    expect(container.querySelector('[data-role="question"]')).not.toBeNull()
  })

  it('step 3: tray, first card with title/caption/visual, morph label on the link after it', () => {
    expect(ids(3).slice(5)).toEqual([ID.tray, ID.card1, ID.link1])
    const { container } = mount(3)
    const parts = [...container.querySelectorAll('[data-role="card"] [data-part]')].map((p) => p.getAttribute('data-part'))
    expect(parts).toEqual(['index', 'title', 'caption', 'visual'])
    const link = box(ID.link1).rect
    const c1 = box(ID.card1).rect
    expect(overlap(link, c1)).toBe(false) // the morph note sits on the link, not inside the card
    expect(link.x + link.w / 2).toBeGreaterThan(right(c1))
  })

  it('step 4: more cards land in the tray; links between consecutive cards carry what morphs', () => {
    const added = ids(4).filter((id) => !ids(3).includes(id))
    expect(added).toEqual([ID.card2, ID.link2, ID.card3, ID.link3, ID.card4])
    const cards = [ID.card1, ID.card2, ID.card3, ID.card4].map((id) => box(id).rect)
    const tray = box(ID.tray).rect
    cards.forEach((c, i) => {
      expect(inside(c, tray)).toBe(true)
      if (i > 0) expect(c.y).toBe(cards[0].y)
    })
    const links = [ID.link1, ID.link2, ID.link3].map((id) => box(id).rect)
    links.forEach((l, i) => {
      expect(l.x).toBeGreaterThan(cards[i].x)
      expect(l.x + l.w / 2).toBeLessThan(cards[i + 1].x + cards[i + 1].w)
      expect(l.x + l.w / 2).toBeGreaterThan(right(cards[i]))
      expect(l.x + l.w / 2).toBeLessThan(cards[i + 1].x)
    })
  })

  it('step 5: a dashed ghost card and the partial-full control docked on you', () => {
    expect(ids(5).filter((id) => !ids(4).includes(id))).toEqual([ID.ghost, ID.depth])
    expect(css).toMatch(/\[data-role='ghost'\][^}]*border-style:\s*dashed/)
    const ghost = box(ID.ghost).rect
    expect(ghost.y).toBe(box(ID.card1).rect.y)
    expect(ghost.x).toBeGreaterThan(right(box(ID.card4).rect))
    const you = box(ID.you).rect
    const control = box(ID.depth).rect
    expect(control.x).toBeGreaterThanOrEqual(you.x)
    expect(right(control)).toBeLessThanOrEqual(right(you))
    expect(control.y - bottom(you)).toBeLessThan(12)
    expect(box(ID.depth).text).toBe('partial ↔ full')
  })

  it('step 6: the kit socket plugs into the bottom edge of an unframed tray', () => {
    expect(ids(6).filter((id) => !ids(5).includes(id))).toEqual([ID.socket])
    const socket = box(ID.socket)
    const tray = box(ID.tray).rect
    expect(socket.rect.y).toBeLessThanOrEqual(bottom(tray))
    expect(bottom(socket.rect)).toBeGreaterThan(bottom(tray))
    expect(socket.overlap).toBe(true)
    expect(socket.text).toMatch(/scene kit/)
    expect(css).not.toMatch(/\[data-role='tray'\][^}]*border(?!-radius)/)
  })

  it('step 7: verify is chained after the cards in the same row, with build, render and a green pass', () => {
    expect(ids(7).filter((id) => !ids(6).includes(id))).toEqual([ID.verify, ID.verifyLink])
    const v = box(ID.verify).rect
    const card = box(ID.card1).rect
    expect(v.y).toBe(card.y)
    expect(v.x).toBeGreaterThan(right(box(ID.ghost).rect))
    expect(inside(v, box(ID.tray).rect)).toBe(true)
    const chain = arrow(ID.verifyLink)
    expect(chain.to.x).toBeLessThanOrEqual(v.x)
    expect(chain.from.x).toBeGreaterThanOrEqual(right(box(ID.ghost).rect))
    const { container } = mount(7)
    const verify = container.querySelector('[data-role="verify"]')!
    expect([...verify.querySelectorAll('[data-part]')].map((p) => p.textContent?.trim())).toEqual(['verify', 'build', 'render', 'pass'])
    expect(verify.querySelector('[data-part="pass"] svg')).not.toBeNull()
    expect(css).toMatch(/\[data-role='verify'\] \[data-part='pass'\][^}]*color:\s*#34d399/)
  })

  it('step 8: a modify arc from the conversation into the route, and the edited card flagged', () => {
    expect(ids(8).filter((id) => !ids(7).includes(id))).toEqual([ID.route, ID.modify, ID.edited])
    const arc = arrow(ID.modify)
    expect(inside({ x: arc.from.x, y: arc.from.y, w: 0, h: 0 }, { ...box(ID.you).rect, x: 0, w: right(box(ID.you).rect) })).toBe(true)
    expect(arc.via).toBeDefined()
    const route = box(ID.route).rect
    expect(Math.abs(arc.to.y - (route.y + route.h / 2))).toBeLessThan(route.h / 2)
    expect(arc.to.x).toBeLessThanOrEqual(route.x)
    const flag = box(ID.edited)
    const card2 = box(ID.card2).rect
    expect(inside(flag.rect, card2)).toBe(true)
    expect(flag.overlap).toBe(true)
    expect(flag.text).toBe('edited')
    expect(box(ID.route).text).toMatch(/^\//)
  })

  it('step 9: a labelled frame around the whole existing diagram', () => {
    expect(ids(9).filter((id) => !ids(8).includes(id))).toEqual([ID.frame, ID.frameLabel])
    const frame = box(ID.frame).rect
    for (const e of ENTITIES) {
      if (e.id === ID.frame) continue
      const rects = e.kind === 'arrow' ? [{ x: Math.min(e.from.x, e.to.x), y: Math.min(e.from.y, e.to.y), w: 0, h: 0 }, { x: Math.max(e.from.x, e.to.x), y: Math.max(e.from.y, e.to.y), w: 0, h: 0 }] : [e.rect]
      for (const r of rects) expect(inside(r, frame), e.id).toBe(true)
    }
    expect(box(ID.frameLabel).text).toMatch(/built with the skill/)
  })
})

describe('composition geometry (L-9, L-54)', () => {
  const canvas: Rect = { x: 0, y: 0, w: CANVAS.width, h: CANVAS.height }

  it('fits every entity inside the 880 x 380 canvas', () => {
    expect(CANVAS).toEqual({ width: 880, height: 380 })
    for (const e of ENTITIES) {
      if (e.kind === 'arrow') {
        for (const p of [e.from, e.to, ...(e.via ? [e.via] : [])]) {
          expect(p.x).toBeGreaterThanOrEqual(0)
          expect(p.x).toBeLessThanOrEqual(CANVAS.width)
          expect(p.y).toBeGreaterThanOrEqual(0)
          expect(p.y).toBeLessThanOrEqual(CANVAS.height)
        }
      } else {
        expect(inside(e.rect, canvas), e.id).toBe(true)
      }
    }
  })

  it('has text-bearing entities overlap only where an overlap is marked', () => {
    const text = ENTITIES.filter((e): e is BoxEntity => e.kind !== 'arrow' && e.kind !== 'frame')
    const overlapping: [BoxEntity, BoxEntity][] = []
    for (let i = 0; i < text.length; i++) {
      for (let j = i + 1; j < text.length; j++) {
        if (text[i].stage <= 9 && overlap(text[i].rect, text[j].rect)) overlapping.push([text[i], text[j]])
      }
    }
    for (const [a, b] of overlapping) expect(a.overlap || b.overlap, `${a.id} x ${b.id}`).toBe(true)
  })

  it('marks the intentional overlaps with the allow-overlap hook', () => {
    const { container } = mount(8)
    const marked = [...container.querySelectorAll('[data-presentation-allow-overlap]')].map((e) => e.getAttribute('data-role'))
    expect(marked.sort()).toEqual(['edited', 'socket'])
  })

  it('styles active chrome and attribution locally with concrete differences', () => {
    const dot = css.match(/\[data-presentation-dot\]\s*\{([^}]*)\}/)![1]
    const activeDot = css.match(/\[data-presentation-dot\]\[data-presentation-active='true'\]\s*\{([^}]*)\}/)![1]
    expect(activeDot).toMatch(/background:\s*var\(--accent\)/)
    expect(dot).toMatch(/background:\s*transparent/)
    expect(activeDot).toMatch(/width:\s*22px/)
    expect(dot).toMatch(/width:\s*14px/)
    const toc = css.match(/\[data-presentation-toc-entry\]\[data-presentation-active='true'\]\s*\{([^}]*)\}/)![1]
    expect(toc).toMatch(/font-weight:\s*700/)
    expect(toc).toMatch(/background:\s*var\(--panel\)/)
    const attribution = css.match(/\[data-presentation-attribution\]\s*\{([^}]*)\}/)![1]
    expect(Number(attribution.match(/font-size:\s*(\d+)px/)![1])).toBeGreaterThanOrEqual(11)
    expect(attribution).toMatch(/text-decoration:\s*none/)
  })

  it('imports its look from presentation-owned CSS, not the kit', () => {
    expect(readFileSync('src/presentations/how-to-make-a-presentation/Talk.tsx', 'utf8')).toMatch(/import '\.\/talk\.css'/)
  })
})

describe('Talk opening mode (L-57)', () => {
  it('opens in browse mode and walks through nine steps', () => {
    setViewport(1280, 720)
    const { container } = render(<Talk />)
    const root = container.querySelector<HTMLElement>('[data-presentation-root]')!
    expect(root.dataset.presentationMode).toBe('browse')
    expect(root.dataset.stepCount).toBe('9')
    for (let i = 1; i < 9; i++) act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
    expect(root.dataset.stepIndex).toBe('8')
  })
})
