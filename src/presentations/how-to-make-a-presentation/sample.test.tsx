/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { presentations } from '../index'
import Talk from './Talk'
import { STEPS } from './steps'

const here = (f: string) => readFileSync(new URL(f, import.meta.url), 'utf8')
const talkSource = here('./Talk.tsx')
const talkCss = here('./talk.css').replace(/\/\*[\s\S]*?\*\//g, '')

// Independent literal copy of the nine-row table in specs/presentation-verification/spec.md.
const TABLE = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  [
    'the gathering',
    'Answers become steps',
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  ],
  [
    'the gathering',
    'The deck grows',
    'Same shapes, new beats. Every answer extends the story without redrawing it.',
  ],
  [
    'the gathering',
    'You set the depth',
    'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  ],
  [
    'the build',
    'It assembles the scene',
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  ],
  [
    'the build',
    'It checks its own work',
    'Before saying done, it builds and renders every step — and fixes what breaks.',
  ],
  [
    'the loop',
    'Changed your mind? Loop it.',
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  ],
  ["the reveal", "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

// Entities each beat introduces, per the table's "Scene content" column (literal ids).
const NEW_AT: string[][] = [
  ['you', 'prompt'],
  ['skill', 'convo-arrow', 'question-chip'],
  ['tray', 'card-1', 'link-1-2', 'morph-chip'],
  ['card-2', 'card-3', 'card-4', 'link-2-3', 'link-3-4'],
  ['ghost', 'depth'],
  ['socket', 'kit-label'],
  ['verify', 'verify-build', 'verify-render', 'verify-pass', 'link-ghost-verify'],
  ['modify-arc', 'flag'],
  ['frame'],
]

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  })
})
afterEach(cleanup)

const root = () => document.querySelector<HTMLElement>('[data-presentation-root]')!
const q = (sel: string) => document.querySelector<HTMLElement>(sel)
const present = () =>
  new Set(Array.from(document.querySelectorAll('[data-presentation-id]')).map((n) => n.getAttribute('data-presentation-id')!))
const next = () => act(() => void fireEvent.click(q('[data-presentation-next]')!))
const prev = () => act(() => void fireEvent.click(q('[data-presentation-prev]')!))
/** Declared geometry: inline left/top plus width/height (style for boxes, attributes for svg arrows). */
const rect = (el: HTMLElement) => ({
  l: el.style.left,
  t: el.style.top,
  w: el.style.width || el.getAttribute('width') || '',
  h: el.style.height || el.getAttribute('height') || '',
})

/** Mount the real sample and collect, per step, the live DOM nodes by entity id. */
function walk() {
  render(<Talk />)
  const snaps: Map<string, HTMLElement>[] = []
  const snap = () =>
    new Map(
      Array.from(document.querySelectorAll<HTMLElement>('[data-presentation-id]')).map((n) => [
        n.getAttribute('data-presentation-id')!,
        n,
      ]),
    )
  snaps.push(snap())
  for (let i = 1; i < TABLE.length; i++) {
    next()
    snaps.push(snap())
  }
  return snaps
}

describe('reference sample metadata', () => {
  it('has the nine normative steps in order with unique ids', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(TABLE.map((r) => [...r]))
    const ids = STEPS.map((s) => s.id)
    expect(new Set(ids).size).toBe(9)
    expect(ids.every((id) => id.length > 0)).toBe(true)
  })

  it('is registered and uses one shared scene group', async () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')!
    expect(entry.title).toBe('How to Use This Skill to Make a Presentation')
    expect(typeof entry.load).toBe('function')
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(STEPS[0].groupKey).toBeTruthy()
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })
})

describe('browse traversal', () => {
  it('shows each caption/title/index going forward and back', () => {
    render(<Talk />)
    expect(root().dataset.presentationMode).toBe('browse')
    expect(root().dataset.stepCount).toBe('9')
    const check = (i: number) => {
      expect(root().dataset.stepIndex).toBe(String(i))
      expect(root().dataset.stepId).toBe(STEPS[i].id)
      expect(q('[data-presentation-title]')!.textContent).toBe(TABLE[i][1])
      expect(q('[data-presentation-caption]')!.textContent).toBe(TABLE[i][2])
    }
    check(0)
    for (let i = 1; i < 9; i++) {
      next()
      check(i)
    }
    expect(q('[data-presentation-next]')).toHaveProperty('disabled', true)
    for (let i = 7; i >= 0; i--) {
      prev()
      check(i)
    }
    expect(q('[data-presentation-prev]')).toHaveProperty('disabled', true)
  })
})

describe('scene content and persistence', () => {
  it('shows exactly the accumulated entities each beat names', () => {
    const snaps = walk()
    let expected = new Set<string>()
    snaps.forEach((snap, i) => {
      expected = new Set([...expected, ...NEW_AT[i]])
      for (const id of expected) expect(snap.has(id), `step ${i + 1} shows ${id}`).toBe(true)
      // nothing named by a later beat leaks in early
      for (const later of NEW_AT.slice(i + 1).flat()) expect(snap.has(later)).toBe(false)
    })
  })

  it('accumulates: every adjacent state is a superset with identical geometry and DOM nodes', () => {
    const snaps = walk()
    for (let i = 1; i < snaps.length; i++) {
      for (const [id, el] of snaps[i - 1]) {
        const now = snaps[i].get(id)
        expect(now, `${id} still present at step ${i + 1}`).toBeDefined()
        expect(now, `${id} is the same DOM node (not remounted)`).toBe(el)
        expect(rect(now!)).toEqual(rect(el))
      }
    }
    // geometry never differs between the step an entity appears and the final step
    const last = snaps[8]
    snaps.forEach((snap) => {
      for (const [id, el] of snap) expect(rect(last.get(id)!)).toEqual(rect(el))
    })
  })

  it('draws the specific compositions the table asks for', () => {
    const snaps = walk()
    const [s1, s2, s3, , s5, s6, s7, s8] = snaps
    expect(s1.get('you')!.textContent).toBe('you')
    expect(s1.get('prompt')!.textContent).toBe('prompt')
    expect(s2.get('skill')!.textContent).toBe('skill')
    expect(s2.get('convo-arrow')!.dataset.presentationTwoWay).toBe('true')
    // step 3: card shows title/caption/visual; morph info sits on the link between cards
    const parts = Array.from(s3.get('card-1')!.querySelectorAll('[data-card-part]')).map((p) => p.getAttribute('data-card-part'))
    expect(parts).toEqual(['title', 'caption', 'visual'])
    expect(s3.get('card-1')!.querySelector('[data-presentation-node]')).toBeNull()
    const link = s3.get('link-1-2')!
    const chip = s3.get('morph-chip')!
    const cx = parseFloat(chip.style.left) + parseFloat(chip.style.width) / 2
    const lx = parseFloat(link.style.left) + 10
    expect(cx).toBeGreaterThan(lx)
    expect(cx).toBeLessThan(lx + parseFloat(rect(link).w) - 10)
    // step 5: ghost card is unspecified, depth control docks on `you`
    expect(s5.get('ghost')!.textContent).toBe('unspecified')
    expect(s5.get('depth')!.textContent).toContain('partial ↔ full')
    const you = rect(s5.get('you')!)
    const depth = rect(s5.get('depth')!)
    expect(parseFloat(depth.t)).toBe(parseFloat(you.t) + parseFloat(you.h) + 2)
    expect(depth.l).toBe(you.l)
    // step 6: socket touches the tray's bottom edge; the tray is not framed
    const tray = rect(s6.get('tray')!)
    expect(parseFloat(s6.get('socket')!.style.top)).toBe(parseFloat(tray.t) + parseFloat(tray.h))
    expect(s6.get('kit-label')!.textContent).toMatch(/kit/)
    expect(s6.has('frame')).toBe(false)
    // step 7: verify chained after the cards in the same row, build+render checks, green pass
    const row = (id: string) => parseFloat(s7.get(id)!.style.top)
    expect(row('verify')).toBe(row('card-4'))
    expect(parseFloat(s7.get('verify')!.style.left)).toBeGreaterThan(parseFloat(s7.get('card-4')!.style.left))
    expect(s7.get('verify-build')!.textContent).toBe('build')
    expect(s7.get('verify-render')!.textContent).toBe('render')
    expect(s7.has('verify-pass')).toBe(true)
    // step 8: modify arc reaches from the conversation row down into the tray; card flagged
    const arc = s8.get('modify-arc')!
    expect(parseFloat(arc.style.top)).toBeLessThan(parseFloat(tray.t))
    expect(parseFloat(arc.style.top) + parseFloat(rect(arc).h)).toBeGreaterThan(parseFloat(tray.t))
    expect(s8.get('card-3')!.dataset.presentationEmphasis).toBe('true')
    expect(STEPS[6].payload.emphasized).toEqual([])
    expect(STEPS[7].payload.emphasized).toEqual(['card-3'])
    expect(s8.get('flag')).toBeDefined()
  })

  it('final step frames the whole diagram with a self-referential label', () => {
    const snaps = walk()
    expect(root().dataset.stepIndex).toBe('8')
    expect(q('[data-presentation-title]')!.textContent).toBe("You're looking at one")
    const frame = snaps[8].get('frame')!
    expect(frame.dataset.presentationNode).toBe('frame')
    expect(frame.textContent).toBe('this talk, built by the skill')
    const f = {
      l: parseFloat(frame.style.left),
      t: parseFloat(frame.style.top),
      r: parseFloat(frame.style.left) + parseFloat(frame.style.width),
      b: parseFloat(frame.style.top) + parseFloat(frame.style.height),
    }
    expect(f.r).toBeLessThanOrEqual(880)
    expect(f.b).toBeLessThanOrEqual(380)
    for (const [id, el] of snaps[8]) {
      if (id === 'frame') continue
      const g = rect(el)
      const l = parseFloat(g.l)
      const t = parseFloat(g.t)
      expect(l, id).toBeGreaterThan(f.l)
      expect(t, id).toBeGreaterThan(f.t)
      expect(l + parseFloat(g.w), id).toBeLessThan(f.r)
      expect(t + parseFloat(g.h), id).toBeLessThan(f.b)
    }
    for (const id of NEW_AT.flat()) expect(present().has(id)).toBe(true)
  })
})

/** Declarations of the rule whose selector list contains exactly `selector`. */
function declarations(selector: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of talkCss.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const sels = m[1].split(',').map((s: string) => s.trim().replace(/\s+/g, ' '))
    if (!sels.includes(selector)) continue
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':')
      if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).trim()
    }
  }
  return out
}

describe('presentation-owned chrome styling', () => {
  it('Talk imports talk.css', () => {
    expect(talkSource).toMatch(/import\s+['"]\.\/talk\.css['"]/)
  })

  it.each([
    ['progress', '[data-presentation-progress-item]'],
    ['toc', '[data-presentation-toc-item]'],
  ])('%s active state is visibly different from inactive', (_n, hook) => {
    const base = declarations(`[data-presentation-root] ${hook}`)
    const active = declarations(`[data-presentation-root] ${hook}[data-presentation-active='true']`)
    expect(Object.keys(active).length).toBeGreaterThanOrEqual(2)
    const differing = Object.keys(active).filter((k) => active[k] !== base[k])
    expect(differing.length).toBeGreaterThanOrEqual(2)
  })

  it('attribution has deliberate legible styling', () => {
    const d = declarations('[data-presentation-root] [data-presentation-attribution]')
    expect(parseFloat(d['font-size'])).toBeGreaterThanOrEqual(12)
    expect(d['color']).toBeTruthy()
    expect(d['color']).not.toMatch(/0000ee|^blue$/i)
    expect(d['text-decoration']).toBe('none')
  })
})
