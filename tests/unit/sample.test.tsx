import { act, fireEvent, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk.tsx'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/steps.ts'
import { presentations } from '../../src/presentations/index.ts'
import { setViewport } from './fixtures.tsx'

vi.mock('motion/react', async () => (await import('./motion-mock.tsx')).motionMock)

// Independently recorded normative outline (specs/presentation-verification).
const SPEC = [
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

const NEW_AT = [
  ['you', 'prompt'],
  ['skill', 'askArrow', 'questionChip'],
  ['tray', 'routeLabel', 'card1', 'link1', 'link1Chip'],
  ['card2', 'card3', 'link2', 'link2Chip'],
  ['ghostCard', 'depthControl'],
  ['sceneKit'],
  ['verify', 'link3', 'verifyPass'],
  ['modifyArc', 'modifyLabel', 'editedRing', 'editedChip'],
  ['outerFrame', 'revealLabel'],
]

const q = (sel: string) => document.querySelector(sel) as HTMLElement
const ent = (name: string) => q(`[data-presentation-entity="how-to-${name}"]`)
const root = () => q('[data-presentation-root]')
const next = () =>
  act(() => {
    fireEvent.keyDown(window, { key: 'ArrowRight' })
  })

interface Rect {
  x: number
  y: number
  w: number
  h: number
}
const rect = (name: string): Rect => {
  const s = ent(name).style
  return { x: parseFloat(s.left), y: parseFloat(s.top), w: parseFloat(s.width), h: parseFloat(s.height) }
}
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

beforeEach(() => setViewport(1280, 800))

describe('reference sample outline', () => {
  it('has exactly the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(SPEC.map((s) => [...s]))
    expect(STEPS.map((s) => s.id)).toHaveLength(new Set(STEPS.map((s) => s.id)).size)
  })

  it('matches the outline file used by verification', () => {
    const outline = JSON.parse(
      readFileSync(path.join(__dirname, '../../src/presentations/how-to-make-a-presentation/outline.json'), 'utf8'),
    )
    expect(outline).toEqual(SPEC.map(([era, title, caption]) => ({ era, title, caption })))
  })

  it('is registered under its slug with its title', () => {
    const e = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(e?.title).toBe('How to Use This Skill to Make a Presentation')
  })

  it('declares a single persistent group sharing one Scene', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })
})

describe('reference sample rendering', () => {
  it('shows every step caption and title in browse mode and traverses next/previous', () => {
    render(<Talk />)
    expect(root().dataset.presentationMode).toBe('browse')
    for (let i = 0; i < 9; i++) {
      expect(q('[data-presentation-title]').textContent).toBe(SPEC[i][1])
      expect(q('[data-presentation-caption]').textContent).toBe(SPEC[i][2])
      expect(q('[data-presentation-caption]').dataset.presentationEra).toBe(SPEC[i][0])
      if (i < 8) next()
    }
    for (let i = 8; i > 0; i--) {
      fireEvent.click(q('[data-presentation-prev]'))
      expect(q('[data-presentation-title]').textContent).toBe(SPEC[i - 1][1])
    }
    expect(root().dataset.stepIndex).toBe('0')
  })

  it('accumulates entities per step without rearranging or re-creating earlier ones', () => {
    render(<Talk />)
    const dom = new Map<string, Element>()
    const geom = new Map<string, string>()
    const seen: string[] = []
    for (let i = 0; i < 9; i++) {
      const expected = [...seen, ...NEW_AT[i]]
      const present = [...document.querySelectorAll('[data-presentation-entity]')]
        .map((e) => e.getAttribute('data-presentation-entity')!.replace('how-to-', ''))
        .sort()
      expect(present, `step ${i + 1}`).toEqual([...expected].sort())
      for (const name of expected) {
        const el = ent(name)
        const g = el.getAttribute('style')!
        if (dom.has(name)) {
          expect(el, `${name} instance at step ${i + 1}`).toBe(dom.get(name))
          expect(g, `${name} geometry at step ${i + 1}`).toBe(geom.get(name))
        } else {
          dom.set(name, el)
          geom.set(name, g)
        }
      }
      seen.push(...NEW_AT[i])
      if (i < 8) next()
    }
  })

  it('keeps each entity under the same Appear wrapper node, so its entry never replays', () => {
    render(<Talk />)
    const wrappers = new Map<string, Element | null>()
    const names = ['you', 'prompt']
    for (const n of names) wrappers.set(n, ent(n).closest('[data-presentation-appear]'))
    for (let i = 0; i < 8; i++) {
      next()
      for (const n of names) {
        expect(wrappers.get(n)).not.toBeNull()
        expect(ent(n).closest('[data-presentation-appear]'), `${n} at step ${i + 2}`).toBe(wrappers.get(n))
      }
    }
  })

  it('draws each scene beat as specified', () => {
    render(<Talk />)
    // 1 - you + prompt
    expect(ent('you').textContent).toBe('you')
    expect(ent('prompt').textContent).toBe('prompt')
    next()
    // 2 - skill, two-way arrow, question chip above it
    expect(ent('skill').textContent).toBe('skill')
    expect(ent('askArrow').querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
    expect(rect('questionChip').y + rect('questionChip').h).toBeLessThanOrEqual(42)
    expect(ent('questionChip').textContent).toContain('question')
    next()
    // 3 - tray under the conversation; first card carries title/caption/visual; morph info sits on the link
    const tray = rect('tray')
    expect(tray.y).toBeGreaterThan(rect('you').y + rect('you').h)
    const parts = [...ent('card1').querySelectorAll('[data-part]')].map((p) => p.getAttribute('data-part'))
    expect(parts).toEqual(expect.arrayContaining(['title', 'caption', 'visual']))
    const link = ent('link1Chip')
    expect(link).not.toBeNull()
    expect(rect('link1Chip').x).toBeGreaterThanOrEqual(rect('card1').x + rect('card1').w)
    expect(ent('card1').textContent).not.toMatch(/morph/i)
    next()
    // 4 - more cards in the tray
    expect(ent('card2').getAttribute('data-kind')).toBe('step-card')
    expect(ent('card3').getAttribute('data-kind')).toBe('step-card')
    next()
    // 5 - dashed ghost card + partial<->full control docked on "you"
    expect(ent('ghostCard').getAttribute('data-kind')).toBe('ghost-card')
    expect(ent('depthControl').textContent).toContain('partial')
    expect(overlaps(rect('depthControl'), rect('you'))).toBe(true)
    expect(ent('depthControl').hasAttribute('data-presentation-allow-overlap')).toBe(true)
    next()
    // 6 - scene-kit socket plugs into the tray's bottom edge; the tray is not framed
    expect(ent('sceneKit').textContent).toContain('scene kit')
    const t = rect('tray')
    expect(rect('sceneKit').y).toBeLessThanOrEqual(t.y + t.h)
    expect(rect('sceneKit').y + rect('sceneKit').h).toBeGreaterThan(t.y + t.h)
    expect(document.querySelectorAll('[data-presentation-node="frame"]')).toHaveLength(0)
    next()
    // 7 - verify chained after the cards in the same row, with a green pass check
    expect(rect('verify').y).toBe(rect('card1').y)
    expect(rect('verify').x).toBeGreaterThan(rect('card3').x + rect('card3').w)
    expect(ent('verify').textContent).toMatch(/build/)
    expect(ent('verify').textContent).toMatch(/render/)
    expect(ent('verifyPass').getAttribute('data-state')).toBe('pass')
    next()
    // 8 - modify arc from the conversation down into the route; edited card flagged
    expect(ent('modifyArc')).not.toBeNull()
    const ring = rect('editedRing')
    const card2 = rect('card2')
    expect(ring.x).toBeLessThan(card2.x)
    expect(ring.x + ring.w).toBeGreaterThan(card2.x + card2.w)
    expect(ring.y).toBeLessThan(card2.y)
    expect(ent('editedChip').textContent).toBe('edited')
    next()
    // 9 - an outer frame around the whole diagram, labelled
    const frame = rect('outerFrame')
    for (const e of document.querySelectorAll('[data-presentation-entity]')) {
      const id = e.getAttribute('data-presentation-entity')!.replace('how-to-', '')
      if (id === 'outerFrame' || e.tagName.toLowerCase() === 'svg') continue
      const r = rect(id)
      expect(r.x, id).toBeGreaterThanOrEqual(frame.x)
      expect(r.y, id).toBeGreaterThanOrEqual(frame.y)
      expect(r.x + r.w, id).toBeLessThanOrEqual(frame.x + frame.w)
      expect(r.y + r.h, id).toBeLessThanOrEqual(frame.y + frame.h)
    }
    expect(ent('revealLabel').textContent).toBeTruthy()
  })

  it('keeps all coordinates inside the 880 x 380 design canvas', () => {
    render(<Talk />)
    for (let i = 0; i < 9; i++) {
      for (const e of document.querySelectorAll('[data-presentation-entity]')) {
        if (e.tagName.toLowerCase() === 'svg') continue
        const s = (e as HTMLElement).style
        expect(parseFloat(s.left) + parseFloat(s.width)).toBeLessThanOrEqual(880)
        expect(parseFloat(s.top) + parseFloat(s.height)).toBeLessThanOrEqual(380)
      }
      if (i < 8) next()
    }
  })

  it('does not wrap the sample at its boundaries', () => {
    render(<Talk />)
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
    })
    expect(root().dataset.stepIndex).toBe('0')
    for (let i = 0; i < 12; i++) next()
    expect(root().dataset.stepIndex).toBe('8')
  })
})
