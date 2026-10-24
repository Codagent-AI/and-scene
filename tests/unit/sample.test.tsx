import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit/index.ts'
import { GEOMETRY, OVERLAYS } from '../../src/presentations/how-to-make-a-presentation/entities.ts'
import type { EntityId } from '../../src/presentations/how-to-make-a-presentation/entities.ts'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/SampleScene.tsx'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/index.ts'
import { presentations } from '../../src/presentations/index.ts'
import { DESIGN_H, DESIGN_W, MIN_SCALE, STAGE_LAYOUT, WIDE_VIEWPORT, computeFitScale } from '../../src/presentation-kit/index.ts'
import config from '../../scripts/verify.config.mjs'
import { key, setViewport, stepIndex } from './helpers.tsx'

const ROOT = path.resolve(__dirname, '../..')
const SAMPLE_DIR = path.join(ROOT, 'src/presentations/how-to-make-a-presentation')
const SampleSource = readFileSync(path.join(SAMPLE_DIR, 'SampleScene.tsx'), 'utf8')
const q = (sel: string) => document.querySelector(sel) as HTMLElement | null
const visible = (i: number) => new Set<EntityId>(STEPS[i].payload.visible)

beforeEach(() => setViewport(1400, 900))

describe('reference sample narration', () => {
  it('registers the sample under its slug and title', () => {
    const entry = presentations.find((p) => p.slug === config.slug)
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(typeof entry?.load).toBe('function')
  })

  it('implements the nine canonical steps in order, with unique stable ids', () => {
    expect(STEPS).toHaveLength(9)
    STEPS.forEach((step, i) => {
      expect({ era: step.era, title: step.title, caption: step.caption }).toEqual(config.outline![i])
      expect(step.Scene).toBe(SampleScene)
      expect(step.groupKey).toBe('sample')
    })
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })

  it('walks all nine steps forward and back through rendered controls', () => {
    render(<Presentation steps={STEPS} title="x" initialMode="browse" />)
    for (let i = 0; i < 9; i++) {
      expect(stepIndex()).toBe(i)
      expect(q('[data-presentation-header] [data-presentation-title]')?.textContent).toBe(config.outline![i].title)
      expect(q('[data-presentation-caption]')?.textContent).toBe(config.outline![i].caption)
      if (i < 8) fireEvent.click(q('[data-presentation-next]')!)
    }
    for (let i = 8; i >= 0; i--) {
      expect(stepIndex()).toBe(i)
      expect(q('[data-presentation-caption]')?.textContent).toBe(config.outline![i].caption)
      if (i > 0) fireEvent.click(q('[data-presentation-prev]')!)
    }
  })
})

describe('reference sample scene', () => {
  it('accumulates entities: each step keeps everything before it and adds something', () => {
    for (let i = 1; i < 9; i++) {
      const prev = visible(i - 1)
      const cur = visible(i)
      for (const id of prev) expect(cur.has(id), `step ${i} keeps ${id}`).toBe(true)
      expect(cur.size, `step ${i} adds`).toBeGreaterThan(prev.size)
    }
  })

  it('draws the specified entities at each beat', () => {
    expect([...visible(0)]).toEqual(['you', 'prompt'])
    expect(visible(1).has('skill') && visible(1).has('you-skill') && visible(1).has('question')).toBe(true)
    // the question chip sits above the two-way arrow
    expect(GEOMETRY.question.y + GEOMETRY.question.h).toBeLessThanOrEqual(GEOMETRY['you-skill'].y)
    expect(visible(2).has('tray') && visible(2).has('card-1')).toBe(true)
    expect(visible(2).has('card-2')).toBe(false)
    // what morphs is drawn on the link between consecutive cards, not inside them
    for (const n of [1, 2, 3]) {
      const chip = GEOMETRY[`morph-${n}` as EntityId]
      const left = GEOMETRY[`card-${n}` as EntityId]
      const right = GEOMETRY[`card-${n + 1}` as EntityId]
      expect(chip.x).toBeGreaterThanOrEqual(left.x + left.w)
      expect(chip.x + chip.w).toBeLessThanOrEqual(right.x)
    }
    for (const id of ['card-2', 'card-3', 'card-4', 'link-2', 'link-3'] as EntityId[]) expect(visible(3).has(id)).toBe(true)
    expect(visible(4).has('ghost') && visible(4).has('control')).toBe(true)
    // the partial/full control docks on "you"
    expect(GEOMETRY.control.x).toBe(GEOMETRY.you.x)
    expect(GEOMETRY.control.y).toBeGreaterThanOrEqual(GEOMETRY.you.y + GEOMETRY.you.h)
    // scene-kit socket plugs into the bottom edge of the tray; the tray itself is not framed
    expect(visible(5).has('socket') && visible(5).has('plug')).toBe(true)
    expect(visible(5).has('frame')).toBe(false)
    const cardsBottom = GEOMETRY['card-1'].y + GEOMETRY['card-1'].h
    expect(GEOMETRY.socket.y).toBeGreaterThanOrEqual(cardsBottom)
    expect(GEOMETRY.plug.y + GEOMETRY.plug.h).toBe(cardsBottom + 2)
    // verify chained after the cards, in the same tray row, resolving to a pass check
    expect(visible(6).has('verify') && visible(6).has('verify-link') && visible(6).has('verify-check')).toBe(true)
    expect(visible(5).has('verify')).toBe(false)
    expect(GEOMETRY.verify.y).toBe(GEOMETRY['card-1'].y)
    expect(GEOMETRY.verify.x).toBeGreaterThan(GEOMETRY.ghost.x + GEOMETRY.ghost.w)
    // modify arc from the conversation down into the route; the edited card is flagged
    for (const id of ['route', 'modify', 'flag'] as EntityId[]) expect(visible(7).has(id)).toBe(true)
    expect(GEOMETRY.modify.y).toBeLessThanOrEqual(GEOMETRY.skill.y + GEOMETRY.skill.h + 4)
    expect(GEOMETRY.modify.y + GEOMETRY.modify.h).toBeLessThanOrEqual(GEOMETRY.route.y)
    // outer frame around the whole diagram
    expect(visible(8).has('frame')).toBe(true)
    const frame = GEOMETRY.frame
    for (const id of visible(7)) {
      const g = GEOMETRY[id]
      expect(g.x).toBeGreaterThanOrEqual(frame.x)
      expect(g.y + Math.min(g.h, 0)).toBeGreaterThanOrEqual(frame.y)
      expect(g.x + g.w).toBeLessThanOrEqual(frame.x + frame.w)
      expect(g.y + Math.max(g.h, 0)).toBeLessThanOrEqual(frame.y + frame.h)
    }
  })

  it('renders exactly the visible entities of every step, with unchanged geometry for retained ones', () => {
    render(<Presentation steps={STEPS} title="x" />)
    const nodes = new Map<string, HTMLElement>()
    for (let i = 0; i < 9; i++) {
      const ids = [...document.querySelectorAll('[data-presentation-id]')].map((e) => e.getAttribute('data-presentation-id'))
      expect(new Set(ids), `step ${i}`).toEqual(new Set(STEPS[i].payload.visible))
      for (const id of ids as EntityId[]) {
        const el = q(`[data-presentation-id="${id}"]`)!
        if (nodes.has(id)) expect(el, `${id} persists as one node`).toBe(nodes.get(id))
        nodes.set(id, el)
        const g = GEOMETRY[id]
        if (el.getAttribute('data-presentation-node') !== 'arrow') {
          expect([el.style.left, el.style.top]).toEqual([`${g.x}px`, `${g.y}px`])
        }
      }
      if (i < 8) key('ArrowRight')
    }
    key('ArrowLeft')
    const back = [...document.querySelectorAll('[data-presentation-id]')].map((e) => e.getAttribute('data-presentation-id'))
    expect(back).toContain('frame') // exit animation still running, then gone
  })
})

describe('reference sample composition (geometry contract)', () => {
  const rects = (ids: Iterable<EntityId>) =>
    [...ids].filter((id) => GEOMETRY[id].w > 0 && GEOMETRY[id].h > 0 && !OVERLAYS.includes(id)).map((id) => ({ id, ...GEOMETRY[id] }))

  it('fits every entity inside the 880 x 380 canvas', () => {
    for (const [id, g] of Object.entries(GEOMETRY)) {
      expect(g.x, id).toBeGreaterThanOrEqual(0)
      expect(g.x + g.w, id).toBeLessThanOrEqual(880)
      expect(Math.min(g.y, g.y + g.h), id).toBeGreaterThanOrEqual(0)
      expect(Math.max(g.y, g.y + g.h), id).toBeLessThanOrEqual(380)
    }
  })

  it('has no accidental overlap between entities at any step; overlays are the only intentional ones', () => {
    for (let i = 0; i < 9; i++) {
      const list = rects(visible(i))
      for (let a = 0; a < list.length; a++) {
        for (let b = a + 1; b < list.length; b++) {
          const w = Math.min(list[a].x + list[a].w, list[b].x + list[b].w) - Math.max(list[a].x, list[b].x)
          const h = Math.min(list[a].y + list[a].h, list[b].y + list[b].h) - Math.max(list[a].y, list[b].y)
          expect(w > 0 && h > 0, `step ${i}: ${list[a].id} overlaps ${list[b].id}`).toBe(false)
        }
      }
    }
    for (const id of OVERLAYS) {
      const node = SampleSource.includes(`'${id}'`)
      expect(node).toBe(true)
    }
  })

  const css = readFileSync(path.join(SAMPLE_DIR, 'talk.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  /** font-size declared by the first matching rule for a selector fragment. */
  const sizeFor = (fragment: string) => {
    const rule = [...css.matchAll(/([^{}@]+)\{([^{}]*)\}/g)].find(([, sel, body]) => sel.includes(fragment) && /font-size:/.test(body))
    return rule ? parseFloat(/font-size:\s*([\d.]+)px/.exec(rule[2])?.[1] ?? '13') : undefined
  }
  const fontSize = (el: Element) => {
    for (let n: Element | null = el; n; n = n.parentElement) {
      for (const cls of ['ghost', 'actor', 'question-chip', 'depth-control', 'morph-chip', 'card']) {
        if (n.classList.contains(cls)) return sizeFor(`.${cls}`) ?? 13
      }
      if (n.hasAttribute('data-presentation-frame-label')) return sizeFor('frame-label') ?? 13
    }
    return sizeFor("[data-presentation-node='label']") ?? 13
  }
  const AVERAGE_GLYPH_EM = 0.62 // conservative average advance for proportional sans text
  const CHROME_PADDING = 14 // border + padding allowance inside an entity

  it('keeps every text run, including nested card text and the frame label, inside its entity at the CSS font sizes', () => {
    render(<Presentation steps={[{ ...STEPS[8] }]} title="x" />)
    let checked = 0
    for (const el of document.querySelectorAll<HTMLElement>('[data-presentation-scene] *')) {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent ?? '').join('').trim()
      if (!own) continue
      const entity = el.closest('[data-presentation-id]') as HTMLElement
      const id = entity.getAttribute('data-presentation-id') as EntityId
      const hasIcon = entity.querySelector(':scope > svg') !== null
      const room = GEOMETRY[id].w - CHROME_PADDING - (hasIcon && el === entity ? 22 : 0)
      const need = own.length * fontSize(el) * AVERAGE_GLYPH_EM
      expect(need, `${id} "${own}" needs ~${Math.round(need)}px of ${room}px`).toBeLessThanOrEqual(room)
      checked++
    }
    expect(checked).toBeGreaterThan(20) // labels, chips, nested card parts, the frame label
  })

  it('fits the stacked lines of every step card inside the card', () => {
    const lines = 4 // number, title, caption, visual
    const size = sizeFor('.card') ?? 11
    const need = lines * size * 1.2 + 16 + 12 // line boxes + card padding + visual-part padding
    for (const n of [1, 2, 3, 4]) expect(need, `card-${n}`).toBeLessThanOrEqual(GEOMETRY[`card-${n}` as EntityId].h)
  })

  const VIEWPORTS: [number, number][] = [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [768, 1024], [390, 844], [320, 568]]
  const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  type Rect = { x: number; y: number; w: number; h: number }

  it.each(['browse', 'present'] as const)('keeps the scaled canvas clear of every chrome region at desktop and narrow viewports (%s)', (mode) => {
    const layout = STAGE_LAYOUT[mode]
    for (const [vw, vh] of VIEWPORTS) {
      const scale = computeFitScale(vw, vh, mode)
      const toc = mode === 'browse' && vw >= WIDE_VIEWPORT ? layout.toc : 0
      const w = DESIGN_W * scale
      const h = DESIGN_H * scale
      // the stage is centred in the row between header and footer, right of the ToC
      const canvas: Rect = { x: toc + (vw - toc - w) / 2, y: layout.top + (vh - layout.top - layout.bottom - h) / 2, w, h }
      const chrome: Record<string, Rect> = {
        header: { x: 0, y: 0, w: vw, h: layout.top },
        footer: { x: 0, y: vh - layout.bottom, w: vw, h: layout.bottom },
        toc: { x: 0, y: layout.top, w: toc, h: vh - layout.top - layout.bottom },
        attribution: { x: vw - 200, y: vh - 40, w: 200, h: 40 },
      }
      for (const [name, rect] of Object.entries(chrome)) {
        if (rect.w > 0) expect(intersects(canvas, rect), `${mode} ${vw}x${vh}: canvas vs ${name}`).toBe(false)
      }
      if (scale > MIN_SCALE) {
        expect(canvas.x, `${vw}x${vh}`).toBeGreaterThanOrEqual(toc)
        expect(canvas.x + canvas.w, `${vw}x${vh}`).toBeLessThanOrEqual(vw)
      }
    }
  })

  it('stays legible on a phone: the narrow-viewport scale keeps the smallest text near its authored size ratio', () => {
    const scale = computeFitScale(390, 844, 'browse')
    expect(scale).toBeGreaterThan(0.38)
    expect((sizeFor('.card') ?? 11) * scale).toBeGreaterThan(4) // cards are summaries there, titles carry the meaning
    expect((sizeFor("[data-presentation-node='label']") ?? 13) * scale).toBeGreaterThan(5)
  })
})

describe('presentation-owned styling', () => {
  const css = readFileSync(path.join(SAMPLE_DIR, 'talk.css'), 'utf8')
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
    selector: sel.trim(),
    decls: Object.fromEntries([...body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map(([, p, v]) => [p, v.trim()])),
  }))
  const find = (needle: string) => rules.filter((r) => r.selector.split(',').some((s) => s.trim().endsWith(needle)))

  it('is imported by the presentation entry, not by the kit', () => {
    const talk = readFileSync(path.join(SAMPLE_DIR, 'Talk.tsx'), 'utf8')
    expect(talk).toMatch(/import\s+'\.\/talk\.css'/)
    expect(talk).toContain('className="how-to"')
    expect(css).toMatch(/^\.how-to /m)
  })

  it('makes the active progress and ToC entries differ from inactive ones', () => {
    for (const hook of ['progress-item', 'toc-item']) {
      const base = Object.assign({}, ...find(`[data-presentation-${hook}]`).map((r) => r.decls))
      const active = Object.assign({}, ...find(`[data-presentation-${hook}][data-presentation-active='true']`).map((r) => r.decls))
      const changed = Object.keys(active).filter((p) => active[p] !== base[p])
      expect(changed.length, hook).toBeGreaterThanOrEqual(2)
    }
    expect(css).not.toMatch(/@media[^{]*\{[^@]*data-presentation-active/)
  })

  it('makes the attribution legible: sized, coloured, placed off the corner', () => {
    const attribution = Object.assign({}, ...find('[data-presentation-attribution]').map((r) => r.decls))
    expect(parseFloat(attribution['font-size'])).toBeGreaterThanOrEqual(11)
    expect(attribution.color).toBeTruthy()
    expect(attribution.margin).toBeTruthy()
    expect(attribution['text-decoration']).toBe('none')
  })
})
