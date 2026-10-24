// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { E, INTRODUCED_AT, type EntityName } from '../../src/presentations/how-to-make-a-presentation/entities'
import { SampleScene } from '../../src/presentations/how-to-make-a-presentation/SampleScene'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import Talk from '../../src/presentations/how-to-make-a-presentation/Talk'
import { setViewport } from './helpers'

// Independent transcription of the normative table in
// specs/presentation-verification/spec.md ("Committed reference sample").
const NORMATIVE = [
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

const ids = (container: ParentNode) =>
  [...container.querySelectorAll('[data-presentation-entity]')].map((el) => el.getAttribute('data-presentation-entity')!)

const sceneAt = (n: number) => render(<SampleScene payload={{ step: n }} step={STEPS[n - 1]} index={n - 1} />).container

const byId = (container: ParentNode, id: string) => container.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)

describe('reference sample narration', () => {
  it('has exactly the nine normative steps, in order', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(NORMATIVE.map((row) => [...row]))
  })

  it('has unique step ids and one shared scene group', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    STEPS.forEach((s, i) => expect(s.payload.step).toBe(i + 1))
  })

  it('the verify script outline file matches the normative table', () => {
    const outline = JSON.parse(readFileSync('scripts/sample-outline.json', 'utf8'))
    expect(outline).toEqual(NORMATIVE.map(([era, title, caption]) => ({ era, title, caption })))
  })
})

describe('Talk', () => {
  beforeEach(() => setViewport(1280, 800))

  it('opens in browse mode with the first title and caption, and every step shows a caption', () => {
    render(<Talk />)
    const q = (s: string) => document.querySelector(s)!
    expect(q('[data-presentation-root]').getAttribute('data-presentation-mode')).toBe('browse')
    expect(document.title).toBe('How to Use This Skill to Make a Presentation')
    for (const [era, title, caption] of NORMATIVE) {
      expect(q('[data-presentation-marker-era]').textContent).toBe(era)
      expect(q('[data-presentation-title]').textContent).toBe(title)
      expect(q('[data-presentation-caption]').textContent).toBe(caption)
      fireEvent.click(q('[data-presentation-next]'))
    }
  })
})

describe('reference sample scene', () => {
  const names = Object.keys(E) as EntityName[]

  it('all entity ids share one local namespace and are unique', () => {
    expect(new Set(Object.values(E)).size).toBe(names.length)
    expect(Object.values(E).every((id) => id.startsWith('howto/'))).toBe(true)
  })

  it('each step shows exactly the entities introduced at or before it', () => {
    for (let n = 1; n <= 9; n++) {
      const expected = names.filter((name) => INTRODUCED_AT[name] <= n).map((name) => E[name])
      expect(ids(sceneAt(n)).sort()).toEqual([...expected].sort())
      document.body.innerHTML = ''
    }
  })

  it('introduces the named entities at the step the table names', () => {
    const introduced = (n: number) => names.filter((name) => INTRODUCED_AT[name] === n)
    expect(introduced(1)).toEqual(['you', 'prompt'])
    expect(introduced(2)).toEqual(expect.arrayContaining(['skill', 'convo', 'question']))
    expect(introduced(3)).toEqual(expect.arrayContaining(['tray', 'card1', 'link1', 'morph1']))
    expect(introduced(4)).toEqual(expect.arrayContaining(['card2', 'card3']))
    expect(introduced(5)).toEqual(expect.arrayContaining(['ghost', 'control']))
    expect(introduced(6)).toEqual(expect.arrayContaining(['socket']))
    expect(introduced(7)).toEqual(expect.arrayContaining(['verify', 'check']))
    expect(introduced(8)).toEqual(expect.arrayContaining(['modify', 'ring', 'flag']))
    expect(introduced(9)).toEqual(expect.arrayContaining(['frame', 'frameLabel']))
  })

  it('entities accumulate: earlier entities persist with the same id and declared position', () => {
    const position = (el: HTMLElement) => [el.style.left, el.style.top, el.style.width, el.style.height]
    const snapshots: Record<string, string[]>[] = []
    for (let n = 1; n <= 9; n++) {
      const c = sceneAt(n)
      const snap: Record<string, string[]> = {}
      for (const id of ids(c)) {
        const el = byId(c, id)!
        snap[id] = el.getAttribute('data-presentation-node') === 'arrow' ? [el.querySelector('path[d]:not([d^="M 0 0 L"])')?.getAttribute('d') ?? ''] : position(el)
      }
      snapshots.push(snap)
      document.body.innerHTML = ''
    }
    for (let n = 1; n < 9; n++) {
      for (const [id, pos] of Object.entries(snapshots[n - 1])) {
        expect(snapshots[n]).toHaveProperty([id])
        if (!id.includes('/')) continue
        expect(snapshots[n][id]).toEqual(pos)
      }
    }
  })

  it('step 3: first card carries title, caption and visual; morph is labelled on the link, not in a card', () => {
    const c = sceneAt(3)
    const card = byId(c, E.card1)!
    expect([...card.querySelectorAll('[data-card-part]')].map((p) => p.getAttribute('data-card-part'))).toEqual(['title', 'caption', 'visual'])
    expect(card.textContent).not.toMatch(/morph/i)
    expect(byId(c, E.morph1)!.textContent).toBe('morph')
    expect(byId(c, E.link1)).not.toBeNull()
  })

  it('step 2: two-way arrow joins you and skill with the question chip above it', () => {
    const c = sceneAt(2)
    const arrow = byId(c, E.convo)!
    expect(arrow.querySelector('[marker-start]')).not.toBeNull()
    expect(arrow.querySelector('[marker-end]')).not.toBeNull()
    const chipBottom = parseFloat(byId(c, E.question)!.style.top) + parseFloat(byId(c, E.question)!.style.height)
    expect(chipBottom).toBeLessThanOrEqual(80) // arrow runs along y=80
  })

  it('tray sits under the conversation and is never framed', () => {
    const c = sceneAt(9)
    const tray = byId(c, E.tray)!
    expect(parseFloat(tray.style.top)).toBeGreaterThan(parseFloat(byId(c, E.you)!.style.top) + parseFloat(byId(c, E.you)!.style.height))
    expect(tray.getAttribute('data-presentation-node')).toBe('box')
    expect(tray.hasAttribute('data-tray')).toBe(true)
  })

  it('step 5: dashed ghost card and a partial/full control docked on you', () => {
    const c = sceneAt(5)
    expect(byId(c, E.ghost)!.hasAttribute('data-ghost')).toBe(true)
    expect(byId(c, E.control)!.textContent).toBe('partial ↔ full')
    expect(byId(c, E.control)!.getAttribute('data-docked-on')).toBe('you')
    const you = byId(c, E.you)!
    expect(parseFloat(byId(c, E.control)!.style.top)).toBe(parseFloat(you.style.top) + parseFloat(you.style.height) + 4)
  })

  it('step 6: the labelled socket plugs into the bottom edge of the tray', () => {
    const c = sceneAt(6)
    const tray = byId(c, E.tray)!
    const bottom = parseFloat(tray.style.top) + parseFloat(tray.style.height)
    const socket = byId(c, E.socket)!
    expect(socket.textContent).toBe('shared scene kit')
    expect(parseFloat(socket.style.top)).toBeGreaterThan(bottom)
    const plug = byId(c, E.plug)!.querySelector('path[d]:not([d^="M 0 0 L"])')!.getAttribute('d')!
    expect(plug).toBe(`M 395 ${parseFloat(socket.style.top)} Q 395 ${(parseFloat(socket.style.top) + bottom) / 2} 395 ${bottom}`)
  })

  it('step 7: verify node is chained after the cards in the same row, with a pass check', () => {
    const c = sceneAt(7)
    const verify = byId(c, E.verify)!
    for (const card of [E.card1, E.card2, E.card3, E.ghost]) {
      expect(byId(c, card)!.style.top).toBe(verify.style.top)
      expect(parseFloat(byId(c, card)!.style.left)).toBeLessThan(parseFloat(verify.style.left))
    }
    expect(byId(c, E.verifyLink)).not.toBeNull()
    expect(byId(c, E.check)!.getAttribute('data-state')).toBe('pass')
    expect(byId(c, E.check)!.getAttribute('aria-label')).toMatch(/build and render passed/)
  })

  it('step 8: a modify arc runs from the conversation down to the edited card, which is flagged', () => {
    const c = sceneAt(8)
    const d = byId(c, E.modify)!.querySelector('path[d]:not([d^="M 0 0 L"])')!.getAttribute('d')!
    const [x1, y1, , , x2, y2] = d.replace(/[MQ]/g, '').trim().split(/\s+/).map(Number)
    expect(y1).toBe(80)
    expect(x1).toBeGreaterThan(190)
    expect(x1).toBeLessThan(690)
    const card = byId(c, E.card2)!
    expect(y2).toBe(parseFloat(card.style.top))
    expect(x2).toBeGreaterThan(parseFloat(card.style.left))
    expect(x2).toBeLessThan(parseFloat(card.style.left) + parseFloat(card.style.width))
    expect(byId(c, E.flag)!.textContent).toBe('edited')
    expect(byId(c, E.ring)!.style.left).toBe(`${parseFloat(card.style.left) - 6}px`)
  })

  it('step 9: the labelled reveal frame surrounds every other entity', () => {
    const c = sceneAt(9)
    const frame = byId(c, E.frame)!
    const [fl, ft] = [parseFloat(frame.style.left), parseFloat(frame.style.top)]
    const [fr, fb] = [fl + parseFloat(frame.style.width), ft + parseFloat(frame.style.height)]
    expect(byId(c, E.frameLabel)!.textContent).toBe('made with the skill it describes')
    for (const id of ids(c)) {
      const el = byId(c, id)!
      if (el === frame || el.getAttribute('data-presentation-node') === 'arrow') continue
      const [l, t] = [parseFloat(el.style.left), parseFloat(el.style.top)]
      expect(l).toBeGreaterThanOrEqual(fl)
      expect(t).toBeGreaterThanOrEqual(ft)
      expect(l + parseFloat(el.style.width)).toBeLessThanOrEqual(fr)
      expect(t + parseFloat(el.style.height)).toBeLessThanOrEqual(fb)
    }
  })

  it('every entity fits inside the 880 x 380 design canvas', () => {
    for (let n = 1; n <= 9; n++) {
      const c = sceneAt(n)
      for (const id of ids(c)) {
        const el = byId(c, id)!
        if (el.getAttribute('data-presentation-node') === 'arrow') continue
        expect(parseFloat(el.style.left)).toBeGreaterThanOrEqual(0)
        expect(parseFloat(el.style.top)).toBeGreaterThanOrEqual(0)
        expect(parseFloat(el.style.left) + parseFloat(el.style.width)).toBeLessThanOrEqual(880)
        expect(parseFloat(el.style.top) + parseFloat(el.style.height)).toBeLessThanOrEqual(380)
      }
      document.body.innerHTML = ''
    }
  })
})

describe('continuity while navigating the nine-step scene', () => {
  beforeEach(() => setViewport(1280, 800))

  const next = () => fireEvent.keyDown(document.body, { key: 'ArrowRight' })
  const prev = () => fireEvent.keyDown(document.body, { key: 'ArrowLeft' })
  const node = (id: string) => document.querySelector<HTMLElement>(`[data-presentation-entity="${id}"]`)!
  const fade = (id: string) => {
    const wrapper = node(id).closest<HTMLElement>('[data-presentation-appear]')
    return Number((wrapper ?? node(id)).style.opacity || 1)
  }
  const delayOf = (id: string) => node(id).closest('[data-presentation-appear]')?.getAttribute('data-presentation-appear-delay')

  it('keeps continuing entities on the same nodes, fully opaque and with the same delay, step after step', async () => {
    render(<Talk />)
    const you = node(E.you)
    const prompt = node(E.prompt)
    next()
    const skill = node(E.skill)
    expect(fade(E.skill)).toBeLessThan(1) // a newcomer starts transparent
    await waitFor(() => expect(fade(E.skill)).toBeGreaterThanOrEqual(0.999), { timeout: 3000 })
    const delay = delayOf(E.skill)
    for (let step = 3; step <= 9; step++) {
      next()
      for (const [id, el] of [[E.you, you], [E.prompt, prompt], [E.skill, skill]] as const) expect(node(id), `${id} at step ${step}`).toBe(el)
      expect(fade(E.skill), `skill opacity at step ${step}`).toBeGreaterThanOrEqual(0.999)
      expect(delayOf(E.skill)).toBe(delay)
      expect(fade(E.you)).toBe(1)
    }
  })

  it('keeps the remaining entities untouched when stepping back, and lets departing ones finish exiting', async () => {
    render(<Talk />)
    for (let i = 0; i < 8; i++) next()
    await waitFor(() => expect(fade(E.frame)).toBeGreaterThanOrEqual(0.999), { timeout: 3000 })
    const you = node(E.you)
    const skill = node(E.skill)
    const frame = node(E.frame)
    prev()
    expect(frame.isConnected).toBe(true) // exit still pending
    for (let i = 0; i < 3; i++) prev()
    expect(node(E.you)).toBe(you)
    expect(node(E.skill)).toBe(skill)
    expect(fade(E.skill)).toBeGreaterThanOrEqual(0.999)
    await waitFor(() => expect(frame.isConnected).toBe(false), { timeout: 3000 })
  })

  it('never restarts a continuing entity’s fade under rapid forward and backward navigation', () => {
    render(<Talk />)
    const you = node(E.you)
    next()
    const skill = node(E.skill)
    let previous = fade(E.skill)
    const press = [...Array(7).fill(next), ...Array(5).fill(prev), ...Array(3).fill(next)] as (() => void)[] // 2 -> 9 -> 4 -> 7
    for (const action of press) {
      action()
      expect(node(E.you)).toBe(you)
      expect(node(E.skill)).toBe(skill)
      const now = fade(E.skill)
      expect(now).toBeGreaterThanOrEqual(previous) // opacity never drops back
      previous = now
    }
    expect(document.querySelector('[data-presentation-root]')!.getAttribute('data-step-index')).toBe('6')
  })
})
