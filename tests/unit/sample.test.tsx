import { fireEvent, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

// Shorten the newcomer fade so the nine-step traversal stays fast; real timings are asserted in stage.test.tsx.
vi.mock('../../src/presentation-kit/constants', async (original) => ({ ...(await original<object>()), ENTER_DELAY: 0.03, ENTER_T: 0.05 }))
import { presentations } from '../../src/presentations'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { OUTLINE } from '../../src/presentations/how-to-make-a-presentation/outline'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { key, setViewport, stepIndex } from './helpers'

// Independent oracle transcribed from the presentation-verification spec table.
const ORACLE = [
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

describe('reference sample outline (L-49, L-50, I-24)', () => {
  it('matches the nine normative eras, titles and captions in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(ORACLE.map((o) => [...o]))
    expect(OUTLINE.map((s) => [s.era, s.title, s.caption])).toEqual(ORACLE.map((o) => [...o]))
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
  })
  it('is registered under its canonical slug and title', () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
  })
  it('puts every step in one persistent scene group', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })
})

type Geo = { l: number; t: number; w: number; h: number }
const px = (v: string) => Number.parseFloat(v)
const geo = (el: HTMLElement): Geo => ({ l: px(el.style.left), t: px(el.style.top), w: px(el.style.width), h: px(el.style.height) })
const PAD = 8
const body = (el: HTMLElement): Geo => {
  const g = geo(el)
  return el.hasAttribute('data-presentation-arrow') ? { l: g.l + PAD, t: g.t + PAD, w: g.w - 2 * PAD, h: g.h - 2 * PAD } : g
}

describe('reference sample scene (L-49, I-25)', () => {
  function playthrough() {
    setViewport(1400, 900)
    const { container } = render(<Talk />)
    const sample = (name: string) => [...container.querySelectorAll<HTMLElement>(`[data-sample="${name}"]`)]
    const one = (name: string) => {
      const found = sample(name)
      expect(found, name).toHaveLength(1)
      return found[0]!
    }
    return { container, sample, one }
  }

  it('builds the story step by step with each named entity and relation', () => {
    const { container, sample, one } = playthrough()
    const next = () => key('ArrowRight')
    const caption = () => container.querySelector('[data-presentation-caption]')?.textContent

    // 1: you + prompt only
    expect(caption()).toBe(ORACLE[0]![2])
    expect(one('you').textContent).toBe('you')
    expect(one('prompt')).toBeTruthy()
    expect(sample('skill')).toHaveLength(0)

    // 2: skill, two-way arrow, question chip above it
    next()
    expect(one('skill').textContent).toBe('skill')
    const convo = one('conversation')
    expect(convo.querySelectorAll('[data-presentation-arrow-head]')).toHaveLength(2)
    const q = geo(one('question'))
    expect(q.t + q.h).toBeLessThanOrEqual(body(convo).t + body(convo).h / 2)
    const you = body(one('you'))
    const skill = body(one('skill'))
    expect(body(convo).l).toBeGreaterThanOrEqual(you.l + you.w)
    expect(body(convo).l + body(convo).w).toBeLessThanOrEqual(skill.l)

    // 3: tray below the conversation; first card shows its parts; morph info lives on the link
    next()
    const tray = geo(one('tray'))
    expect(tray.t).toBeGreaterThan(Math.max(you.t + you.h, skill.t + skill.h))
    const cards3 = sample('step-card')
    expect(cards3).toHaveLength(1)
    expect([...cards3[0]!.querySelectorAll('[data-sample-part]')].map((p) => p.getAttribute('data-sample-part'))).toEqual(['title', 'caption', 'visual'])
    expect(cards3[0]!.textContent).not.toMatch(/morph/i)
    expect(one('link-label').textContent).toBe('morphs')
    expect(cards3[0]!.contains(one('link-label'))).toBe(false)
    expect(one('link')).toBeTruthy()
    const seenBefore = new Map([...container.querySelectorAll<HTMLElement>('[data-sample]')].map((e) => [e.dataset.sample! + e.dataset.presentationEntity, { node: e, g: geo(e) }]))

    // 4: more cards; everything already on screen stays put
    next()
    expect(sample('step-card')).toHaveLength(4)
    expect(sample('link')).toHaveLength(3)
    for (const [k, { node, g }] of seenBefore) {
      if (node.dataset.sample === 'link') continue
      const now = [...container.querySelectorAll<HTMLElement>('[data-sample]')].find((e) => e.dataset.sample! + e.dataset.presentationEntity === k)
      expect(now, k).toBe(node)
      expect(geo(now!), k).toEqual(g)
    }

    // 5: dashed ghost card, partial<->full control docked on you
    next()
    const ghost = one('ghost')
    expect(ghost.className).toContain('hmp-ghost')
    const control = geo(one('depth-control'))
    expect(one('depth-control').textContent).toBe('partial ↔ full')
    expect(control.l).toBeGreaterThanOrEqual(you.l)
    expect(control.l + control.w).toBeLessThanOrEqual(you.l + you.w)
    expect(you.t - (control.t + control.h)).toBeLessThanOrEqual(10)

    // 6: scene-kit socket plugs into the bottom edge of the unframed tray
    next()
    expect(one('scene-kit').textContent).toBe('shared scene kit')
    const plug = body(one('socket-plug'))
    expect(plug.t).toBe(tray.t + tray.h)
    expect(plug.t + plug.h).toBe(geo(one('scene-kit')).t)
    expect(container.querySelectorAll('[data-presentation-frame]')).toHaveLength(0)
    expect(one('tray').hasAttribute('data-presentation-frame')).toBe(false)
    expect(sample('outer-frame')).toHaveLength(0)
    const css = readFileSync('src/presentations/how-to-make-a-presentation/presentation.css', 'utf8')
    const trayRule = /\.hmp-tray\s*\{([^}]*)\}/.exec(css)![1]!.replace(/\/\*[\s\S]*?\*\//g, '')
    const decls = Object.fromEntries(trayRule.split(';').map((d) => d.split(':').map((x) => x.trim())).filter((d) => d[0]))
    for (const [prop, value] of Object.entries(decls)) if (/^border/.test(prop!) && prop !== 'border-radius') expect(value, prop).toBe('0')
    expect(decls.border).toBe('0')
    expect(trayRule).not.toMatch(/outline|box-shadow/)

    // 7: verify chained after the cards in the same row, resolving to a green pass check
    next()
    const verify = geo(one('verify'))
    const cards = sample('step-card').map(geo)
    expect(verify.t).toBe(cards[0]!.t)
    expect(verify.l).toBeGreaterThan(Math.max(...cards.map((c) => c.l + c.w), geo(ghost).l + geo(ghost).w))
    expect(one('build-chip').textContent).toBe('build')
    expect(one('render-chip').textContent).toBe('render')
    expect(one('pass-check').textContent).toBe('✓')
    expect(one('pass-check').dataset.state).toBe('pass')
    expect(one('verify-link')).toBeTruthy()

    // 8: modify arc from the conversation down into the route; edited card flagged
    next()
    const arc = body(one('modify-arc'))
    const skillBottom = skill.t + skill.h
    const CURVE = 40 // the arc's box is padded by its bow
    expect(arc.t + CURVE).toBeGreaterThanOrEqual(skillBottom)
    expect(arc.l + arc.w).toBeGreaterThanOrEqual(skill.l)
    const flagged = geo(one('edited-flag'))
    const target = cards[2]!
    expect(flagged).toEqual(target)
    expect(arc.t + arc.h).toBeGreaterThanOrEqual(target.t - 2)
    expect(one('edited-chip').textContent).toBe('edited')

    // 9: labeled outer frame encloses the whole diagram
    next()
    const frame = geo(one('outer-frame'))
    expect(one('frame-label').textContent).toBe('made with this skill')
    for (const el of container.querySelectorAll<HTMLElement>('[data-presentation-entity]')) {
      if (el.dataset.sample === 'outer-frame') continue
      const g = el.hasAttribute('data-presentation-arrow') ? body(el) : geo(el)
      expect(g.l, el.dataset.sample).toBeGreaterThanOrEqual(frame.l)
      expect(g.t, el.dataset.sample).toBeGreaterThanOrEqual(frame.t)
      expect(g.l + g.w, el.dataset.sample).toBeLessThanOrEqual(frame.l + frame.w)
      expect(g.t + g.h, el.dataset.sample).toBeLessThanOrEqual(frame.t + frame.h)
    }
  })

  it('shows a matching nonempty caption per browse step and restores state with next then prev (L-48, I-47)', () => {
    const { container } = playthrough()
    const caption = () => container.querySelector('[data-presentation-caption]')?.textContent
    for (let i = 0; i < 9; i++) {
      expect(stepIndex(container)).toBe(i)
      expect(caption()).toBe(ORACLE[i]![2])
      if (i < 8) {
        key('ArrowRight')
        key('ArrowLeft')
        expect(caption()).toBe(ORACLE[i]![2])
        key('ArrowRight')
      }
    }
  })

  it('opens in browse mode with the title in the header and a ToC listing the five eras', () => {
    const { container } = playthrough()
    expect(container.querySelector('[data-presentation-mode]')?.getAttribute('data-presentation-mode')).toBe('browse')
    expect([...container.querySelectorAll('[data-presentation-toc-entry]')].map((e) => e.textContent)).toEqual(['the ask', 'the gathering', 'the build', 'the loop', 'the reveal'])
    fireEvent.click(container.querySelectorAll('[data-presentation-toc-entry]')[3] as Element)
    expect(stepIndex(container)).toBe(7)
  })
})

describe('sample-wide continuity (L-8, L-49, I-6, I-25)', () => {
  it('keeps every earlier entity and its introducing wrapper in place, fully opaque and unmoved, across all nine steps', async () => {
    setViewport(1400, 900)
    const { container } = render(<Talk />)
    const nodes = () => [...container.querySelectorAll<HTMLElement>('[data-presentation-entity]')]
    const wrappers = () => [...container.querySelectorAll<HTMLElement>('[data-sample-group]')]
    const snapshot = new Map<string, { node: HTMLElement; geo: Geo }>()
    const wrapperSeen = new Map<string, HTMLElement>()
    for (let step = 1; step <= 9; step++) {
      if (step > 1) key('ArrowRight')
      // Earlier entities and wrappers: same node, same coordinates, never dipping below fully opaque.
      for (const [id, { node, geo: g }] of snapshot) {
        const now = nodes().find((n) => n.dataset.presentationEntity === id)
        expect(now, `${id} at step ${step}`).toBe(node)
        if (id !== 'hmp/link-0' && id !== 'hmp/link-label-0') expect(geo(now!), `${id} at step ${step}`).toEqual(g)
      }
      for (const [group, wrapper] of wrapperSeen) {
        const now = wrappers().find((w) => w.dataset.sampleGroup === group)
        expect(now, `${group} at step ${step}`).toBe(wrapper)
        expect(wrapper.style.opacity, `${group} wrapper at step ${step}`).toBe('1')
      }
      // The newcomer group of this step starts hidden and fades in after the persisting ones settle.
      const fresh = wrappers().filter((w) => !wrapperSeen.has(w.dataset.sampleGroup!))
      expect(fresh.length).toBeGreaterThan(0)
      for (const w of fresh) await waitFor(() => expect(w.style.opacity).toBe('1'), { timeout: 3000 })
      for (const w of fresh) wrapperSeen.set(w.dataset.sampleGroup!, w)
      for (const n of nodes()) if (!snapshot.has(n.dataset.presentationEntity!)) snapshot.set(n.dataset.presentationEntity!, { node: n, geo: geo(n) })
    }
    expect([...wrapperSeen.keys()]).toEqual(['you', 'skill', 'tray', 'link-0', 'more-cards', 'depth', 'socket', 'verify', 'modify', 'reveal'].filter((g) => wrapperSeen.has(g)))
  })

  it('morphs only the first link when the next card lands (its end moves, everything else is fixed)', () => {
    setViewport(1400, 900)
    const { container } = render(<Talk />)
    key('ArrowRight')
    key('ArrowRight')
    const link = container.querySelector<HTMLElement>('[data-presentation-entity="hmp/link-0"]')!
    const before = geo(link)
    key('ArrowRight')
    const after = geo(container.querySelector<HTMLElement>('[data-presentation-entity="hmp/link-0"]')!)
    expect(container.querySelector('[data-presentation-entity="hmp/link-0"]')).toBe(link)
    expect([after.l, after.t, after.h]).toEqual([before.l, before.t, before.h])
    expect(after.w).toBeGreaterThan(before.w)
  })
})
