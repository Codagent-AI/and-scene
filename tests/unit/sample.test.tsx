// @vitest-environment jsdom
import { act, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../../src/presentation-kit'
import { presentations } from '../../src/presentations'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { EDGES, ENTITIES } from '../../src/presentations/how-to-make-a-presentation/entities'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { key } from './helpers/fixtures'

// Independent transcription of the canonical sample table (era, title, caption).
const EXPECTED = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

const NEW_AT: Record<number, string[]> = {
  1: ['you', 'prompt'],
  2: ['skill', 'link', 'question'],
  3: ['tray', 'step-card-1'],
  4: ['step-card-2', 'step-card-3', 'link-1-2', 'link-2-3', 'morph-label-1-2', 'morph-label-2-3'],
  5: ['ghost-card', 'link-3-ghost', 'depth-control'],
  6: ['scene-kit'],
  7: ['verify', 'verify-check', 'link-ghost-verify'],
  8: ['modify', 'route', 'edited-flag'],
  9: ['frame', 'frame-label'],
}

const entityEls = () => [...document.querySelectorAll<HTMLElement | SVGElement>('[data-presentation-entity]')]
const idsOnScreen = () => entityEls().map((e) => e.getAttribute('data-presentation-entity')!).sort()
const el = (id: string) => document.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)!
const next = () => act(() => void key('ArrowRight'))

interface Box { x: number; y: number; w: number; h: number }
const box = (id: string): Box => {
  const e = ENTITIES.find((d) => d.id === id)!
  const dom = el(id)
  // geometry rendered into the DOM must be exactly what the data declares
  expect([dom.style.left, dom.style.top, dom.style.width, dom.style.height]).toEqual([`${e.x}px`, `${e.y}px`, `${e.width}px`, `${e.height}px`])
  return { x: e.x, y: e.y, w: e.width, h: e.height }
}
const right = (b: Box) => b.x + b.w
const bottom = (b: Box) => b.y + b.h
const inside = (p: readonly [number, number], b: Box) => p[0] >= b.x && p[0] <= right(b) && p[1] >= b.y && p[1] <= bottom(b)

const css = readFileSync(join(__dirname, '../../src/presentations/how-to-make-a-presentation/talk.css'), 'utf8')
const rule = (selector: string) => {
  const m = new RegExp(`${selector.replace(/[.[\]()'=]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)
  expect(m, `css rule ${selector}`).not.toBeNull()
  return m![1]
}

describe('sample metadata', () => {
  it('has the title, nine steps and five eras in order with exact strings', () => {
    expect(STEPS).toHaveLength(9)
    STEPS.forEach((s, i) => expect([s.era, s.title, s.caption]).toEqual(EXPECTED[i]))
    expect([...new Set(STEPS.map((s) => s.era))]).toEqual(['the ask', 'the gathering', 'the build', 'the loop', 'the reveal'])
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(presentations.find((p) => p.slug === 'how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('is one scene group so a single scene persists', () => {
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
  })
})

describe('sample rendering', () => {
  it('shows each step title and caption in order, next/previous navigate, boundaries hold', () => {
    render(<Presentation steps={STEPS} title="x" />)
    const at = (i: number) => {
      expect(document.querySelector('[data-presentation-title]')?.textContent).toBe(EXPECTED[i][1])
      expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe(EXPECTED[i][2])
      expect(document.querySelector('[data-step-index]')?.getAttribute('data-step-index')).toBe(String(i))
    }
    act(() => void key('ArrowLeft'))
    at(0)
    for (let i = 1; i < 9; i++) {
      next()
      at(i)
    }
    next()
    at(8)
    for (let i = 7; i >= 0; i--) {
      act(() => void key('ArrowLeft'))
      at(i)
    }
  })

  it('Talk opens in browse mode', () => {
    render(<Talk />)
    expect(document.querySelector('[data-presentation-root]')?.getAttribute('data-presentation-mode')).toBe('browse')
  })

  it('accumulates entities exactly as scripted, never removing or moving earlier ones', () => {
    render(<Presentation steps={STEPS} title="x" />)
    const firstNodes = new Map<string, Element>()
    const geometry = new Map<string, string>()
    const seen: string[] = []
    for (let n = 1; n <= 9; n++) {
      seen.push(...NEW_AT[n])
      expect(idsOnScreen()).toEqual([...seen].sort())
      for (const e of entityEls()) {
        const id = e.getAttribute('data-presentation-entity')!
        if (id.startsWith('link') || id === 'modify') continue // arrows carry path data, not box geometry
        const g = `${e.style.left},${e.style.top},${e.style.width},${e.style.height}`
        expect(geometry.get(id) ?? g, `${id} geometry at step ${n}`).toBe(g)
        geometry.set(id, g)
        expect(firstNodes.get(id) ?? e, `${id} node identity at step ${n}`).toBe(e)
        firstNodes.set(id, e)
      }
      if (n < 9) next()
    }
    expect(document.querySelectorAll('[data-presentation-scene]')).toHaveLength(1)
  })

  it('step 1-2: you and prompt, then skill, a two-way link and a question chip above it', () => {
    render(<Presentation steps={STEPS} title="x" />)
    expect(el('you').textContent).toBe('you')
    expect(el('prompt').textContent).not.toBe('')
    next()
    expect(el('skill').textContent).toBe('skill')
    const link = EDGES.find((e) => e.id === 'link')!
    expect(link.bidirectional).toBe(true)
    expect(el('link').querySelector('path[marker-end]')?.getAttribute('marker-start')).toContain('link-head')
    expect(el('link').querySelector('path[marker-end]')?.getAttribute('marker-end')).toContain('link-head')
    expect(link.from[0]).toBe(right(box('you')))
    expect(link.to[0]).toBe(box('skill').x)
    expect(bottom(box('question'))).toBeLessThan(link.from[1]) // chip sits above the link
    expect(el('question').textContent).not.toBe('')
  })

  it('step 3-4: tray below the conversation; cards carry title/caption/visual; morphs sit on links', () => {
    render(<Presentation steps={STEPS} title="x" />)
    next(); next()
    const tray = box('tray')
    expect(tray.y).toBeGreaterThanOrEqual(Math.max(bottom(box('you')), bottom(box('skill'))))
    const card = el('step-card-1')
    expect(['.card-title', '.card-caption', '.card-visual'].map((s) => card.querySelector(s)?.textContent)).toEqual([
      'title', 'caption', expect.stringContaining('visual'),
    ])
    expect(document.querySelector('[data-presentation-entity^="morph-label"]')).toBeNull()
    next()
    const [c1, c2, c3] = ['step-card-1', 'step-card-2', 'step-card-3'].map(box)
    for (const [l, a, b] of [['morph-label-1-2', c1, c2], ['morph-label-2-3', c2, c3]] as const) {
      const label = box(l)
      expect(el(l).closest('[data-presentation-entity^="step-card"]')).toBeNull() // not inside a card
      expect(label.x).toBeGreaterThanOrEqual(right(a))
      expect(right(label)).toBeLessThanOrEqual(b.x)
    }
    for (const c of [c1, c2, c3]) {
      expect(c.y).toBe(c1.y)
      expect(c.y).toBeGreaterThanOrEqual(tray.y)
      expect(bottom(c)).toBeLessThanOrEqual(bottom(tray))
    }
  })

  it('step 5: dashed ghost card and a depth control docked on you', () => {
    render(<Presentation steps={STEPS} title="x" />)
    for (let i = 0; i < 4; i++) next()
    const you = box('you')
    const depth = box('depth-control')
    expect(depth.x).toBeGreaterThanOrEqual(you.x)
    expect(right(depth)).toBeLessThanOrEqual(right(you))
    expect(depth.y - bottom(you)).toBeLessThanOrEqual(8) // adjacent to / docked on you
    expect(depth.y).toBeGreaterThanOrEqual(bottom(you) - 1)
    expect(el('depth-control').textContent).toMatch(/partial.*full/)
    expect(el('ghost-card').className).toContain('ghost')
    expect(rule('.talk-sample .card.ghost')).toMatch(/border-style:\s*dashed/)
    expect(box('ghost-card').y).toBe(box('step-card-1').y)
  })

  it('step 6: the scene-kit socket plugs into the bottom edge of an unframed tray', () => {
    render(<Presentation steps={STEPS} title="x" />)
    for (let i = 0; i < 5; i++) next()
    const tray = box('tray')
    const socket = box('scene-kit')
    expect(socket.y).toBeLessThan(bottom(tray))
    expect(bottom(socket)).toBeGreaterThan(bottom(tray))
    expect(socket.x).toBeGreaterThanOrEqual(tray.x)
    expect(right(socket)).toBeLessThanOrEqual(right(tray))
    expect(el('scene-kit').textContent).toMatch(/scene kit/)
    expect(rule('.talk-sample .tray')).not.toMatch(/border(?!-radius)|outline|box-shadow/)
    expect(document.querySelector('[data-presentation-entity="frame"]')).toBeNull()
  })

  it('step 7: verify is chained after the step cards in their row with a green pass check', () => {
    render(<Presentation steps={STEPS} title="x" />)
    for (let i = 0; i < 6; i++) next()
    const verify = box('verify')
    const cards = ['step-card-1', 'step-card-2', 'step-card-3', 'ghost-card'].map(box)
    expect(verify.y).toBe(cards[0].y)
    expect(verify.x).toBeGreaterThan(Math.max(...cards.map(right)))
    expect(el('verify').textContent).toMatch(/verify/)
    expect(el('verify').textContent).toMatch(/build \+ render/)
    const edge = EDGES.find((e) => e.id === 'link-ghost-verify')!
    expect(edge.from[0]).toBe(right(cards[3]))
    expect(edge.to[0]).toBe(verify.x)
    const check = box('verify-check')
    expect(check.x).toBeGreaterThanOrEqual(verify.x)
    expect(right(check)).toBeLessThanOrEqual(right(verify))
    expect(el('verify-check').querySelector('svg[data-presentation-icon]')).not.toBeNull()
    const green = /--green:\s*#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(css)!.slice(1).map((h) => parseInt(h, 16))
    expect(green[1]).toBeGreaterThan(green[0])
    expect(green[1]).toBeGreaterThan(green[2])
    expect(rule('.talk-sample .chip.pass')).toMatch(/var\(--green\)/)
  })

  it('step 8: a modify arc from the conversation into the route; the edited card is flagged', () => {
    render(<Presentation steps={STEPS} title="x" />)
    for (let i = 0; i < 7; i++) next()
    const arc = EDGES.find((e) => e.id === 'modify')!
    expect(arc.bend).toBeTruthy() // an arc, not a straight line
    expect(inside(arc.from, box('skill')) || inside(arc.from, box('you'))).toBe(true)
    expect(inside(arc.to, box('route'))).toBe(true)
    expect(arc.to[1]).toBeGreaterThan(arc.from[1]) // reaches down
    const flag = box('edited-flag')
    const edited = box('step-card-2')
    expect(flag.x).toBeLessThan(right(edited))
    expect(right(flag)).toBeGreaterThan(edited.x)
    expect(flag.y).toBeLessThan(bottom(edited))
    expect(bottom(flag)).toBeGreaterThan(edited.y)
    expect(el('edited-flag').hasAttribute('data-presentation-allow-overlap')).toBe(true)
  })

  it('step 9: a labeled frame encloses everything already on screen without rebuilding it', () => {
    render(<Presentation steps={STEPS} title="x" />)
    for (let i = 0; i < 8; i++) next()
    const frame = box('frame')
    expect(el('frame-label').textContent?.trim()).not.toBe('')
    for (const e of ENTITIES.filter((d) => d.id !== 'frame')) {
      const b = box(e.id)
      expect(b.x, e.id).toBeGreaterThan(frame.x)
      expect(b.y, e.id).toBeGreaterThan(frame.y)
      expect(right(b), e.id).toBeLessThan(right(frame))
      expect(bottom(b), e.id).toBeLessThan(bottom(frame))
    }
    for (const edge of EDGES) {
      for (const p of [edge.from, edge.to]) expect(inside(p, frame)).toBe(true)
    }
    expect(el('frame').querySelectorAll('[data-presentation-entity]')).toHaveLength(0)
    expect(rule('.talk-sample .reveal-frame')).toMatch(/border/)
    expect(Object.keys(NEW_AT)).toHaveLength(9)
  })
})

describe('sample chrome styling', () => {
  const declared = (block: string, prop: string) => new RegExp(`(?:^|[\\s;])${prop}:\\s*([^;]+)`).exec(block)?.[1].trim()

  it('styles the active progress and ToC hooks differently from inactive ones', () => {
    const baseDot = rule("[data-presentation-progress-item]")
    const activeDot = rule("[data-presentation-progress-item][data-presentation-active='true']")
    expect(declared(activeDot, 'background')).toBeDefined()
    expect(declared(activeDot, 'background')).not.toBe(declared(baseDot, 'background'))
    expect(declared(activeDot, 'width')).not.toBe(declared(baseDot, 'width'))
    const baseToc = rule('[data-presentation-toc-entry]')
    const activeToc = rule("[data-presentation-toc-entry][data-presentation-active='true']")
    expect(declared(activeToc, 'background')).not.toBe(declared(baseToc, 'background'))
    expect(declared(activeToc, 'color')).not.toBe(declared(baseToc, 'color'))
  })

  it('makes the attribution legible instead of browser-default', () => {
    const block = rule('[data-presentation-attribution]')
    expect(parseFloat(declared(block, 'font-size')!)).toBeGreaterThanOrEqual(11)
    expect(declared(block, 'color')).toBeDefined()
    expect(declared(block, 'text-decoration')).toBe('none')
  })

  it('keeps the look in presentation-owned CSS only', () => {
    const talk = readFileSync(join(__dirname, '../../src/presentations/how-to-make-a-presentation/Talk.tsx'), 'utf8')
    expect(talk).toMatch(/import '\.\/talk\.css'/)
  })
})
