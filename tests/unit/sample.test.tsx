import fs from 'node:fs'
import path from 'node:path'
import { act, fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from '../../src/presentations/index.ts'
import { APPEARS_AT, ENTITY_IDS, entitiesAt, LINKS, RECTS, type EntityId, type Rect } from '../../src/presentations/how-to-make-a-presentation/entities.ts'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/SampleScene.tsx'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/index.ts'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk.tsx'
import reference from '../fixtures/reference-sample.json'

const root = path.resolve(import.meta.dirname, '../..')
const sampleDir = path.join(root, 'src/presentations/how-to-make-a-presentation')

const renderStep = (n: number) => render(<SampleScene payload={{ step: n }} stepIndex={n - 1} />).container
const entity = (c: ParentNode, id: string) => c.querySelector<HTMLElement | SVGElement>(`[data-presentation-entity="${id}"]`)
const textOf = (c: ParentNode, id: string) => entity(c, id)?.textContent?.trim()
const right = (r: Rect) => r.x + r.w
const bottom = (r: Rect) => r.y + r.h
const intersects = (a: Rect, b: Rect) => a.x < right(b) && b.x < right(a) && a.y < bottom(b) && b.y < bottom(a)
const inside = (inner: Rect, outer: Rect) => inner.x >= outer.x && inner.y >= outer.y && right(inner) <= right(outer) && bottom(inner) <= bottom(outer)
const rect = (id: EntityId) => (RECTS as Record<string, Rect>)[id]
const link = (id: EntityId) => (LINKS as Record<string, { from: readonly [number, number]; to: readonly [number, number]; bidirectional?: boolean }>)[id]

describe('registration and outline', () => {
  it('is registered under its slug with the sample title', () => {
    const entry = PRESENTATIONS.find((p) => p.slug === reference.slug)
    expect(entry?.title).toBe(reference.title)
    expect(typeof entry?.load).toBe('function')
  })

  it('implements exactly the nine normative steps, in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((s) => ({ era: s.era, title: s.title, caption: s.caption }))).toEqual(reference.steps)
  })

  it('has unique stable ids, a valid Scene and a caption for every step', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    for (const step of STEPS) {
      expect(step.caption.length).toBeGreaterThan(0)
      expect(typeof step.Scene).toBe('function')
    }
  })

  it('is one scene group whose payload is the only thing that changes', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload?.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('loads a default-exported Talk and stores no manual step numbers or casts at the boundary', () => {
    expect(typeof Talk).toBe('function')
    const src = fs.readFileSync(path.join(sampleDir, 'Talk.tsx'), 'utf8')
    expect(src).not.toMatch(/\bas\s+(any|unknown|never)\b|<any>/)
  })
})

describe('entity accumulation', () => {
  it('only ever adds entities: each step is a superset of the previous', () => {
    for (let n = 2; n <= 9; n++) {
      const earlier = new Set(entitiesAt(n - 1))
      expect([...earlier].every((id) => entitiesAt(n).includes(id))).toBe(true)
    }
    expect(entitiesAt(9)).toHaveLength(ENTITY_IDS.length)
    expect(Math.max(...Object.values(APPEARS_AT))).toBe(9)
  })

  it('keeps every earlier entity at the same position and size in the rendered DOM', () => {
    const geometry = (n: number) => {
      const c = renderStep(n)
      const out = new Map<string, string>()
      for (const el of c.querySelectorAll<HTMLElement>('[data-presentation-entity]')) {
        const { left, top, width, height } = el.style
        out.set(el.getAttribute('data-presentation-entity')!, [left, top, width, height].join('|'))
      }
      document.body.innerHTML = ''
      return out
    }
    let before = geometry(1)
    for (let n = 2; n <= 9; n++) {
      const now = geometry(n)
      for (const [id, g] of before) expect(now.get(id), `${id} at step ${n}`).toBe(g)
      before = now
    }
  })

  it('never remounts or redraws continuing entities while navigating the whole talk', () => {
    render(<Talk />)
    const root = document.querySelector('[data-presentation-root]')!
    const seen = new Map<string, Element>()
    for (let n = 1; n <= 9; n++) {
      for (const el of root.querySelectorAll('[data-presentation-entity]')) {
        const id = el.getAttribute('data-presentation-entity')!
        if (seen.has(id)) expect(seen.get(id), `${id} at step ${n}`).toBe(el)
        else seen.set(id, el)
      }
      expect(root.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
      if (n < 9) act(() => void fireEvent.keyDown(window, { key: 'ArrowRight' }))
    }
    expect(seen.size).toBe(ENTITY_IDS.length)
  })
})

describe('scene content per step', () => {
  it('1: a you entity and a prompt bubble, nothing else', () => {
    const c = renderStep(1)
    expect(textOf(c, 'you')).toBe('you')
    expect(textOf(c, 'prompt')).toBe('prompt')
    expect(c.querySelectorAll('[data-presentation-entity]')).toHaveLength(2)
  })

  it('2: skill, a two-way you↔skill arrow, and a question chip above it', () => {
    const c = renderStep(2)
    expect(textOf(c, 'skill')).toBe('skill')
    const arrow = link('convoArrow')
    expect(arrow.bidirectional).toBe(true)
    expect(arrow.from[0]).toBeGreaterThanOrEqual(right(rect('you')))
    expect(arrow.to[0]).toBeLessThanOrEqual(rect('skill').x)
    expect(arrow.from[1]).toBe(arrow.to[1])
    expect(arrow.from[1]).toBeGreaterThan(rect('you').y)
    expect(arrow.from[1]).toBeLessThan(bottom(rect('you')))
    const chip = rect('questionChip')
    expect(textOf(c, 'questionChip')).toBe('question')
    expect(bottom(chip)).toBeLessThanOrEqual(arrow.from[1])
    expect(chip.x).toBeGreaterThanOrEqual(arrow.from[0])
    expect(right(chip)).toBeLessThanOrEqual(arrow.to[0])
    const path = entity(c, 'convoArrow')!.querySelector('path')!
    expect(path.getAttribute('d') ?? '').toBeDefined()
  })

  it('3: a tray under the conversation holds the first card with title, caption and visual parts', () => {
    const c = renderStep(3)
    const tray = rect('tray')
    expect(tray.y).toBeGreaterThanOrEqual(bottom(rect('you')))
    expect(tray.y).toBeGreaterThanOrEqual(bottom(rect('prompt')))
    expect(inside(rect('card1'), tray)).toBe(true)
    const parts = Array.from(entity(c, 'card1')!.querySelectorAll('[data-part]')).map((p) => [p.getAttribute('data-part'), p.textContent])
    expect(parts).toEqual([['title', 'title'], ['caption', 'caption'], ['visual', 'visual']])
    expect(entity(c, 'card2')).toBeNull()
    expect(entity(c, 'chip12')).toBeNull()
  })

  it('4: more cards land; what morphs is labeled on the link between consecutive cards, not inside them', () => {
    const c = renderStep(4)
    for (const id of ['card2', 'card3'] as const) {
      expect(inside(rect(id), rect('tray'))).toBe(true)
      expect(entity(c, id)!.querySelectorAll('[data-part]')).toHaveLength(3)
    }
    for (const [from, to, l, chip] of [['card1', 'card2', 'link12', 'chip12'], ['card2', 'card3', 'link23', 'chip23']] as const) {
      expect(link(l).from[0]).toBe(right(rect(from)))
      expect(link(l).to[0]).toBe(rect(to).x)
      const mid = (link(l).from[0] + link(l).to[0]) / 2
      expect(rect(chip).x + rect(chip).w / 2).toBe(mid)
      expect(textOf(c, chip)).toBe('morph')
      expect(entity(c, from)!.contains(entity(c, chip))).toBe(false)
      expect(entity(c, to)!.contains(entity(c, chip))).toBe(false)
    }
    expect(c.querySelector('[data-kind="ghost"]')).toBeNull()
  })

  it('5: a dashed ghost card marks unspecified steps and a partial↔full control docks on you', () => {
    const c = renderStep(5)
    expect(entity(c, 'ghost')!.getAttribute('data-kind')).toBe('ghost')
    expect(inside(rect('ghost'), rect('tray'))).toBe(true)
    expect(textOf(c, 'control')).toBe('partial ↔ full')
    expect(intersects(rect('control'), rect('you'))).toBe(true)
    expect(rect('control').y).toBeLessThan(rect('you').y)
    const css = fs.readFileSync(path.join(sampleDir, 'how-to.css'), 'utf8')
    expect(css).toMatch(/\.how-to-card\[data-kind='ghost'\]\s*\{[^}]*border-style:\s*dashed/)
  })

  it('6: the scene-kit socket plugs into the bottom edge of the unframed tray and names the kit', () => {
    const c = renderStep(6)
    const tray = rect('tray')
    const socket = rect('socket')
    expect(socket.y).toBeLessThan(bottom(tray))
    expect(bottom(socket)).toBeGreaterThan(bottom(tray))
    expect(socket.x).toBeGreaterThanOrEqual(tray.x)
    expect(right(socket)).toBeLessThanOrEqual(right(tray))
    expect(textOf(c, 'socket')).toBe('shared scene kit')
    expect(c.querySelector('[data-presentation-frame]')).toBeNull()
    expect(entity(c, 'tray')!.getAttribute('data-presentation-frame')).toBeNull()
  })

  it('7: verify is chained after the cards in the tray row, with build and render resolving to a green pass check', () => {
    const c = renderStep(7)
    const verify = rect('verify')
    expect(verify.y).toBe(rect('card1').y)
    for (const id of ['card1', 'card2', 'card3', 'ghost'] as const) expect(verify.x).toBeGreaterThan(right(rect(id)))
    expect(inside(verify, rect('tray'))).toBe(true)
    expect(link('linkVerify').from[0]).toBe(right(rect('ghost')))
    expect(link('linkVerify').to[0]).toBe(verify.x)
    const parts = Array.from(entity(c, 'verify')!.querySelectorAll('[data-part]')).map((p) => p.textContent)
    expect(parts).toEqual(['verify', 'build', 'render'])
    const pass = entity(c, 'passChip')!
    expect(pass.getAttribute('data-state')).toBe('pass')
    expect(pass.querySelector('svg')).not.toBeNull()
    expect(inside(rect('passChip'), verify)).toBe(true)
  })

  it('8: a modify arc reaches from the conversation down to the cards; the edited card is flagged', () => {
    const c = renderStep(8)
    const arc = link('modifyArc')
    expect(entity(c, 'modifyArc')!.getAttribute('data-kind')).toBe('modify')
    expect(arc.from[1]).toBeLessThanOrEqual(bottom(rect('skill')) + 1)
    expect(arc.from[0]).toBeGreaterThanOrEqual(rect('skill').x)
    expect(arc.to[1]).toBe(rect('card2').y)
    expect(arc.to[0]).toBeGreaterThan(rect('card2').x)
    expect(arc.to[0]).toBeLessThan(right(rect('card2')))
    expect(textOf(c, 'modifyChip')).toBe('modify')
    expect(textOf(c, 'flag')).toBe('edited')
    expect(entity(c, 'flag')!.getAttribute('data-target')).toBe('card2')
    expect(intersects(rect('flag'), rect('card2'))).toBe(true)
  })

  it('9: a labeled outer frame draws around the whole diagram', () => {
    const c = renderStep(9)
    const frame = rect('frame')
    expect(entity(c, 'frame')!.hasAttribute('data-presentation-frame')).toBe(true)
    for (const id of ENTITY_IDS) {
      if (id === 'frame') continue
      const r = (RECTS as Record<string, Rect>)[id]
      if (r) expect(inside(r, frame), `${id} inside frame`).toBe(true)
      const l = (LINKS as Record<string, { from: readonly [number, number]; to: readonly [number, number] }>)[id]
      if (l) for (const [x, y] of [l.from, l.to]) expect(inside({ x, y, w: 0, h: 0 }, frame), `${id} endpoint`).toBe(true)
    }
    expect(textOf(c, 'frameLabel')).toBe('built by the skill')
    expect(inside(rect('frameLabel'), frame)).toBe(true)
  })

  it('keeps every normative entity inside the 880 × 380 design canvas', () => {
    for (const id of ENTITY_IDS) {
      const r = (RECTS as Record<string, Rect>)[id]
      if (r) expect(inside(r, { x: 0, y: 0, w: 880, h: 380 }), id).toBe(true)
    }
  })
})

describe('presentation-owned styling', () => {
  const css = fs.readFileSync(path.join(sampleDir, 'how-to.css'), 'utf8')
  const rule = (selector: string) => {
    const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)
    return css.match(re)?.[1] ?? ''
  }

  it('styles the sample through plain presentation-local CSS imported by Talk', () => {
    expect(fs.readFileSync(path.join(sampleDir, 'Talk.tsx'), 'utf8')).toMatch(/import '\.\/how-to\.css'/)
    expect(fs.readdirSync(sampleDir).filter((f) => f.endsWith('.css'))).toEqual(['how-to.css'])
  })

  it('makes the active progress dot and ToC entry visibly distinct from inactive ones', () => {
    const dot = rule('.how-to [data-presentation-dot]')
    const active = rule('.how-to [data-presentation-dot][data-presentation-active]')
    expect(active).toMatch(/background:\s*var\(--accent\)/)
    expect(active).toMatch(/width:\s*32px/)
    expect(dot).toMatch(/background:\s*transparent/)
    const toc = rule('.how-to [data-presentation-toc-entry]')
    const tocActive = rule('.how-to [data-presentation-toc-entry][data-presentation-active]')
    expect(tocActive).toMatch(/background:/)
    expect(tocActive).toMatch(/font-weight:\s*700/)
    expect(toc).toMatch(/background:\s*transparent/)
  })

  it('makes the attribution legible and keeps responsive rules for narrow viewports', () => {
    const attribution = rule('.how-to [data-presentation-attribution]')
    expect(attribution).toMatch(/font-size:\s*1[3-9]px/)
    expect(attribution).toMatch(/color:\s*var\(--accent\)/)
    expect(css).toMatch(/@media \(max-width:\s*640px\)/)
  })
})
