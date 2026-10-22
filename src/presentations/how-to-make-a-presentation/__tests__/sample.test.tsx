import { act, cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { validateSteps } from '../../../presentation-kit/index.ts'
import { ENTITIES, ID } from '../entities.ts'
import type { EntityId } from '../entities.ts'
import { STEPS } from '../steps/index.ts'
import Talk from '../Talk.tsx'

// Independent literal copy of the normative outline (verification spec, "Committed reference sample").
const OUTLINE = [
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

// Entities each step introduces, written independently of the step files.
const NEW_PER_STEP: EntityId[][] = [
  [ID.you, ID.prompt],
  [ID.skill, ID.conversation, ID.question],
  [ID.tray, ID.card1],
  [ID.card2, ID.card3, ID.link12, ID.link23],
  [ID.ghost, ID.link3Ghost, ID.depth],
  [ID.kit],
  [ID.verify, ID.linkGhostVerify, ID.verifyBuild, ID.verifyRender, ID.verifyPass],
  [ID.modify, ID.edited],
  [ID.frame],
]

beforeEach(() => {
  Object.assign(window, { innerWidth: 1280, innerHeight: 800 })
})
afterEach(cleanup)

const root = () => document.querySelector('[data-presentation-root]') as HTMLElement
const next = () => fireEvent.keyDown(window, { key: 'ArrowRight' })
const entityIds = () => [...document.querySelectorAll('[data-presentation-entity]')].map((e) => e.getAttribute('data-presentation-entity'))
const rectOf = (id: EntityId) => {
  const def = ENTITIES[id]
  if (def.kind === 'link') {
    const [a, b] = [def.from, def.to]
    return { x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]), h: Math.abs(a[1] - b[1]) }
  }
  return { x: def.x, y: def.y, w: def.w, h: def.h }
}
const overlaps = (a: ReturnType<typeof rectOf>, b: ReturnType<typeof rectOf>) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const contains = (outer: ReturnType<typeof rectOf>, inner: ReturnType<typeof rectOf>) =>
  outer.x <= inner.x && outer.y <= inner.y && outer.x + outer.w >= inner.x + inner.w && outer.y + outer.h >= inner.y + inner.h

describe('sample outline', () => {
  it('has the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(OUTLINE.map((o) => [...o]))
  })

  it('is a valid step list with unique stable ids', () => {
    expect(validateSteps(STEPS)).toEqual([])
  })

  it('puts every step in one persistent scene group', () => {
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
  })

  it('opens in browse mode', () => {
    render(<Talk />)
    expect(root().dataset.presentationMode).toBe('browse')
  })
})

describe('captions and navigation in the rendered sample', () => {
  it('shows every step caption and moves one step per control press', () => {
    render(<Talk />)
    for (let i = 0; i < 9; i += 1) {
      expect(document.querySelector('[data-presentation-caption]')?.textContent).toBe(OUTLINE[i][2])
      expect(document.querySelector('[data-presentation-title]')?.textContent).toBe(OUTLINE[i][1])
      expect(root().dataset.stepIndex).toBe(String(i))
      if (i < 8) fireEvent.click(document.querySelector('[data-presentation-next]') as HTMLElement)
    }
    for (let i = 8; i > 0; i -= 1) {
      fireEvent.click(document.querySelector('[data-presentation-prev]') as HTMLElement)
      expect(root().dataset.stepIndex).toBe(String(i - 1))
    }
  })
})

describe('entities accumulate and never rearrange', () => {
  it('introduces exactly the specified entities at each step', () => {
    let seen: EntityId[] = []
    STEPS.forEach((step, i) => {
      seen = [...seen, ...NEW_PER_STEP[i]]
      expect([...step.payload.visible].sort()).toEqual([...seen].sort())
    })
  })

  it('shows those entities in the rendered scene, with stable ids and unchanged geometry', () => {
    render(<Talk />)
    const geometry = new Map<string, string>()
    let shown = new Set<string>()
    for (let i = 0; i < 9; i += 1) {
      const nodes = [...document.querySelectorAll<HTMLElement>('[data-presentation-entity]')]
      const nowShown = new Set(nodes.map((n) => n.getAttribute('data-presentation-entity') as string))
      for (const id of shown) expect(nowShown.has(id), `${id} persists into step ${i}`).toBe(true)
      for (const n of nodes) {
        const id = n.getAttribute('data-presentation-entity') as string
        if (n instanceof HTMLElement && n.style.left !== '') {
          const geo = [n.style.left, n.style.top, n.style.width, n.style.height].join('|')
          expect(geometry.get(id) ?? geo, `${id} moved at step ${i}`).toBe(geo)
          geometry.set(id, geo)
        }
      }
      shown = nowShown
      next()
    }
    expect(shown.size).toBeGreaterThanOrEqual(Object.keys(ID).length)
  })

  it('uses ids from its own namespace for every entity', () => {
    render(<Talk />)
    for (let i = 0; i < 9; i += 1) next()
    for (const id of entityIds()) expect(Object.values(ID)).toContain(id?.replace(':label', ''))
    expect(Object.values(ID).every((id) => id.startsWith('how-to:'))).toBe(true)
  })

  it('does not remount the persistent scene between steps', async () => {
    render(<Talk />)
    const scene = document.querySelector('[data-presentation-scene]')
    next()
    await act(async () => {})
    expect(document.querySelector('[data-presentation-scene]')).toBe(scene)
  })
})

describe('scene composition contracts', () => {
  it('anchors the conversation on top with the question chip above the two-way you↔skill link', () => {
    const link = ENTITIES[ID.conversation]
    if (link.kind !== 'link') throw new Error('conversation must be a link')
    expect(link.bidirectional).toBe(true)
    expect(rectOf(ID.you).x + rectOf(ID.you).w).toBeLessThanOrEqual(link.from[0])
    expect(rectOf(ID.skill).x).toBeGreaterThanOrEqual(link.to[0])
    const chip = rectOf(ID.question)
    expect(chip.y + chip.h).toBeLessThanOrEqual(link.from[1])
    expect(chip.x).toBeGreaterThan(link.from[0])
    expect(chip.x + chip.w).toBeLessThan(link.to[0])
    expect(rectOf(ID.tray).y).toBeGreaterThan(rectOf(ID.you).y + rectOf(ID.you).h)
  })

  it('lands step cards in the tray, each carrying title, caption and visual, with morphs only on links', () => {
    const tray = rectOf(ID.tray)
    for (const id of [ID.card1, ID.card2, ID.card3, ID.ghost, ID.verify]) expect(contains(tray, rectOf(id))).toBe(true)
    render(<Talk />)
    for (let i = 0; i < 4; i += 1) next()
    const cards = [...document.querySelectorAll('[data-sample="card"]')]
    expect(cards).toHaveLength(3)
    for (const card of cards) {
      expect([...card.querySelectorAll('[data-sample-part]')].map((p) => p.getAttribute('data-sample-part'))).toEqual(['title', 'caption', 'visual'])
      expect(card.textContent).not.toMatch(/morph/i)
    }
    const labels = [...document.querySelectorAll('[data-sample="link-label"]')]
    expect(labels.map((l) => l.textContent)).toEqual(['morphs', 'morphs'])
    for (const [label, link] of [[labels[0], ID.link12], [labels[1], ID.link23]] as const) {
      expect(label.getAttribute('data-presentation-entity')).toBe(`${link}:label`)
    }
    const gap12 = { x: rectOf(ID.card1).x + rectOf(ID.card1).w, w: rectOf(ID.card2).x - rectOf(ID.card1).x - rectOf(ID.card1).w }
    const link = rectOf(ID.link12)
    expect(link.x).toBe(gap12.x)
    expect(link.w).toBe(gap12.w)
  })

  it('marks unspecified steps with a ghost card and docks the partial↔full control on "you"', () => {
    expect(ENTITIES[ID.ghost].variant).toBe('ghost')
    expect(overlaps(rectOf(ID.depth), rectOf(ID.you))).toBe(true)
    expect(ENTITIES[ID.depth]).toMatchObject({ kind: 'chip', text: 'partial ↔ full', overlap: true })
    const css = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'talk.css'), 'utf8')
    expect(css).toMatch(/\[data-sample="ghost"\]\s*\{[^}]*border-style:\s*dashed/)
  })

  it('plugs the scene-kit socket into the tray bottom edge without framing the tray', () => {
    const tray = rectOf(ID.tray)
    const kit = rectOf(ID.kit)
    expect(kit.y).toBeLessThan(tray.y + tray.h)
    expect(kit.y + kit.h).toBeGreaterThan(tray.y + tray.h)
    expect(ENTITIES[ID.kit]).toMatchObject({ label: 'shared scene kit', overlap: true })
    expect(STEPS[5].payload.visible).not.toContain(ID.frame)
  })

  it('chains verify after the cards in the same tray row, resolving build + render to a pass', () => {
    const verify = rectOf(ID.verify)
    expect(verify.y).toBe(rectOf(ID.card3).y)
    expect(verify.x).toBeGreaterThan(rectOf(ID.card3).x)
    expect(contains(verify, rectOf(ID.verifyPass))).toBe(true)
    expect(contains(verify, rectOf(ID.verifyBuild))).toBe(true)
    expect(ENTITIES[ID.verifyBuild]).toMatchObject({ text: 'build' })
    expect(ENTITIES[ID.verifyRender]).toMatchObject({ text: 'render' })
    expect(ENTITIES[ID.verifyPass]).toMatchObject({ variant: 'pass', symbol: '✓' })
    expect(ENTITIES[ID.verifyPass].delay).toBeGreaterThan(ENTITIES[ID.verifyBuild].delay ?? 0)
  })

  it('reaches a modify arc from the conversation down into the tray and flags the edited card', () => {
    const arc = ENTITIES[ID.modify]
    if (arc.kind !== 'link') throw new Error('modify must be a link')
    expect(arc.bend).not.toBe(0)
    expect(arc.bend).toBeDefined()
    const [fx, fy] = arc.from
    const you = rectOf(ID.you)
    expect(fx).toBeGreaterThanOrEqual(you.x)
    expect(fy).toBeLessThanOrEqual(you.y + you.h)
    expect(arc.to[1]).toBeGreaterThanOrEqual(rectOf(ID.tray).y)
    expect(contains(rectOf(ID.edited), rectOf(ID.card2))).toBe(true)
  })

  it('draws the closing reveal frame around the whole diagram', () => {
    const frame = rectOf(ID.frame)
    for (const id of Object.values(ID)) {
      if (id !== ID.frame) expect(contains(frame, rectOf(id)), id).toBe(true)
    }
    expect(ENTITIES[ID.frame]).toMatchObject({ kind: 'frame', overlap: true })
    expect((ENTITIES[ID.frame] as { label: string }).label.length).toBeGreaterThan(0)
  })
})

describe('presentation-owned styling', () => {
  const css = fs.readFileSync(path.resolve(import.meta.dirname, '..', 'talk.css'), 'utf8')
  const rule = (selector: string) => {
    const start = css.indexOf(selector + ' {')
    if (start < 0) return ''
    return css.slice(start, css.indexOf('}', start))
  }

  it('makes the active progress dot and table-of-contents entry distinct with several properties', () => {
    for (const selector of ['[data-presentation-progress-dot][data-presentation-active="true"]', '[data-presentation-toc-entry][data-presentation-active="true"]']) {
      const body = rule(selector)
      expect(body, selector).not.toBe('')
      const props = ['background', 'border-color', 'color', 'font-weight', 'transform'].filter((p) => body.includes(`${p}:`))
      expect(props.length, selector).toBeGreaterThanOrEqual(2)
    }
  })

  it('styles the attribution legibly with an explicit size, colour, font and no default underline', () => {
    const body = rule('[data-presentation-attribution]')
    expect(body).toMatch(/font-size:\s*(1[1-9]|[2-9]\d)px/)
    expect(body).toMatch(/color:/)
    expect(body).toMatch(/font-family:/)
    expect(body).toMatch(/text-decoration:\s*none/)
  })

  it('targets only hooks the kit really renders', () => {
    const kit = path.resolve(import.meta.dirname, '../../../presentation-kit')
    const kitSource = fs
      .readdirSync(kit, { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.tsx?$/.test(f) && !f.includes('__tests__'))
      .map((f) => fs.readFileSync(path.join(kit, f), 'utf8'))
      .join('\n')
    const hooks = new Set([...css.matchAll(/\[(data-presentation-[a-z-]+)/g)].map((m) => m[1]))
    for (const hook of hooks) expect(kitSource, hook).toContain(hook)
  })

  it('keeps the sample styles in the presentation folder, not in the kit', () => {
    expect(fs.existsSync(path.resolve(import.meta.dirname, '..', 'talk.css'))).toBe(true)
  })
})
