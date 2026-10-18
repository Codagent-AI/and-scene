import { act, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Presentation } from '../presentation-kit'
import { ENTITIES } from '../presentations/how-to-make-a-presentation/entities'
import { OUTLINE } from '../presentations/how-to-make-a-presentation/outline'
import { STEPS } from '../presentations/how-to-make-a-presentation/steps'
import { PRESENTATIONS } from '../presentations'
import { validateSteps } from '../presentation-kit'

// Normative rows of presentation-verification, "Committed reference sample", typed out separately from the sample.
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

const css = readFileSync(resolve(process.cwd(), 'src/presentations/how-to-make-a-presentation/styles.css'), 'utf8')

describe('reference sample data', () => {
  it('has the nine normative steps in order, character for character', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(NORMATIVE.map((row) => [...row]))
    expect(OUTLINE.map((s) => [s.era, s.title, s.caption])).toEqual(NORMATIVE.map((row) => [...row]))
  })

  it('has unique ids and puts all steps in one persistent scene group', () => {
    expect(() => validateSteps(STEPS)).not.toThrow()
    expect(new Set(STEPS.map((s) => s.groupKey)).size).toBe(1)
    expect(new Set(STEPS.map((s) => s.Scene)).size).toBe(1)
    expect(STEPS.map((s) => s.payload.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('is registered with the full presentation title, lazily loaded', async () => {
    const entry = PRESENTATIONS.find((p) => p.slug === 'how-to-make-a-presentation')!
    expect(entry.title).toBe('How to Use This Skill to Make a Presentation')
    const module = await entry.load()
    expect(typeof module.default).toBe('function')
  })
})

const root = () => document.querySelector('[data-presentation-root]')!
const press = (key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
const ids = () => [...document.querySelectorAll('[data-presentation-entity]')].map((e) => e.getAttribute('data-presentation-entity')!)
const spec = (id: string) => ENTITIES.find((e) => e.id === id)!
const rectOf = (id: string) => {
  const s = spec(id)
  if (!('at' in s)) throw new Error(`${id} has no rect`)
  return { x: s.at.x, y: s.at.y, w: s.at.w ?? 0, h: s.at.h ?? 0 }
}

/** Renders the sample once and records the DOM at each of its nine steps. */
function walkSample() {
  render(<Presentation steps={STEPS} title="sample" />)
  const frames: { ids: string[]; nodes: Map<string, HTMLElement>; geometry: Map<string, string>; text: Map<string, string>; flags: Map<string, string | null> }[] = []
  for (let step = 0; step < 9; step += 1) {
    if (step > 0) press('ArrowRight')
    expect(root().getAttribute('data-step-index')).toBe(String(step))
    const nodes = new Map<string, HTMLElement>()
    const geometry = new Map<string, string>()
    const text = new Map<string, string>()
    const flags = new Map<string, string | null>()
    document.querySelectorAll<HTMLElement>('[data-presentation-entity]').forEach((node) => {
      const id = node.getAttribute('data-presentation-entity')!
      nodes.set(id, node)
      geometry.set(id, `${node.style.left}|${node.style.top}|${node.style.width}|${node.style.height}`)
      text.set(id, node.textContent ?? '')
      flags.set(id, node.getAttribute('data-presentation-flag'))
    })
    frames.push({ ids: ids(), nodes, geometry, text, flags })
  }
  return frames
}

describe('reference sample scene', () => {
  const frames = walkSample()
  const at = (step: number) => new Set(frames[step - 1].ids)
  // Nodes recorded while walking: detached after cleanup, but their attributes and children persist.
  const node = (step: number, id: string) => frames[step - 1].nodes.get(id)!

  it('accumulates: entity sets only grow and continuing entities keep node, position, and size', () => {
    for (let i = 1; i < 9; i += 1) {
      const before = frames[i - 1]
      const after = frames[i]
      for (const id of before.ids) {
        expect(after.ids, `${id} survives step ${i + 1}`).toContain(id)
        expect(after.nodes.get(id), `${id} keeps its DOM node`).toBe(before.nodes.get(id))
        expect(after.geometry.get(id), `${id} does not move`).toBe(before.geometry.get(id))
        expect(after.text.get(id), `${id} is not relabeled`).toBe(before.text.get(id))
      }
    }
    expect(frames[8].ids.length).toBeGreaterThan(frames[0].ids.length)
  })

  it('1: you and a prompt bubble', () => {
    expect([...at(1)].sort()).toEqual(['prompt', 'you'])
    expect(frames[0].text.get('you')).toBe('you')
    expect(frames[0].text.get('prompt')).toBe('prompt')
  })

  it('2: skill, a two-way you↔skill arrow, and a question chip above it', () => {
    expect([...at(2)]).toEqual(expect.arrayContaining(['skill', 'conversation', 'question']))
    const arrow = spec('conversation')
    if (arrow.kind !== 'arrow') throw new Error('conversation must be an arrow')
    expect(arrow.bidirectional).toBe(true)
    expect(node(2, 'conversation').querySelectorAll('path[marker-start], path[marker-end]')).toHaveLength(1)
    expect(node(2, 'conversation').querySelector('path[marker-start]')).not.toBeNull()
    expect(arrow.from[0]).toBeGreaterThanOrEqual(rectOf('you').x + rectOf('you').w)
    expect(arrow.to[0]).toBeLessThanOrEqual(rectOf('skill').x)
    expect(rectOf('question').y + rectOf('question').h).toBeLessThanOrEqual(arrow.from[1])
    expect(frames[1].text.get('question')).toContain('question')
  })

  it('3: a tray under the conversation with one step card showing title, caption, and visual; morph on links, not in cards', () => {
    for (const id of ['tray', 'card-1']) expect(at(3).has(id)).toBe(true)
    expect(at(3).has('card-2')).toBe(false)
    expect(rectOf('tray').y).toBeGreaterThan(rectOf('prompt').y + rectOf('prompt').h)
    const parts = [...node(3, 'card-1').querySelectorAll('[data-presentation-part]')].map((p) => p.textContent)
    expect(parts).toEqual(['step 1', 'title', 'caption', 'visual'])
    for (let i = 1; i <= 4; i += 1) expect(frames[8].text.get(`card-${i}`)).not.toMatch(/morph/)
  })

  it('4: more cards land with links labeled morph between them; nothing already on screen moves', () => {
    for (const id of ['card-2', 'card-3', 'card-4', 'link-1-2', 'link-2-3', 'link-3-4']) expect(at(4).has(id)).toBe(true)
    for (let i = 1; i <= 3; i += 1) {
      const left = rectOf(`card-${i}`)
      const right = rectOf(`card-${i + 1}`)
      const label = rectOf(`link-${i}-${i + 1}-label`)
      expect(label.x).toBeGreaterThanOrEqual(left.x + left.w)
      expect(label.x + label.w).toBeLessThanOrEqual(right.x)
      expect(frames[3].text.get(`link-${i}-${i + 1}-label`)).toBe('morph')
    }
  })

  it('5: a dashed ghost card and a partial↔full control docked beside you', () => {
    expect(at(5).has('ghost')).toBe(true)
    expect(node(5, 'ghost').className).toContain('ghost')
    expect(css).toMatch(/\.ghost\s*\{[^}]*border-style:\s*dashed/)
    expect(frames[4].text.get('depth')).toBe('partial ↔ full')
    const you = rectOf('you')
    const depth = rectOf('depth')
    expect(depth.x - (you.x + you.w)).toBeLessThan(80)
    expect(Math.abs(depth.y - (you.y + you.h))).toBeLessThan(40)
  })

  it('6: the scene-kit socket plugs into the bottom edge of an unframed tray', () => {
    expect(at(6).has('scene-kit')).toBe(true)
    expect(frames[5].text.get('scene-kit')).toMatch(/scene kit/)
    const trayBottom = rectOf('card-1').y + rectOf('card-1').h
    const plug = spec('kit-plug')
    if (plug.kind !== 'arrow') throw new Error('plug must be an arrow')
    expect(plug.to[1]).toBeGreaterThanOrEqual(trayBottom - 2)
    expect(plug.to[1]).toBeLessThanOrEqual(trayBottom + 6)
    expect(plug.from[1]).toBe(rectOf('scene-kit').y)
    expect(plug.from[0]).toBeGreaterThanOrEqual(rectOf('scene-kit').x)
    expect(at(6).has('reveal-frame')).toBe(false)
    expect(ENTITIES.filter((e) => e.kind === 'frame' && e.since <= 8)).toHaveLength(0)
  })

  it('7: verify is chained after the cards in the same row and resolves to a green pass', () => {
    const verify = rectOf('verify')
    const cards = [1, 2, 3, 4].map((i) => rectOf(`card-${i}`))
    expect(verify.y).toBe(cards[0].y)
    expect(verify.x).toBeGreaterThan(Math.max(...cards.map((c) => c.x + c.w)))
    expect(frames[6].text.get('verify')).toMatch(/verify.*build.*render/)
    expect(node(7, 'verify').getAttribute('data-presentation-state')).toBe('pass')
    expect(at(6).has('verify')).toBe(false)
    const pass = rectOf('verify-pass')
    expect(pass.x).toBeGreaterThanOrEqual(verify.x)
    expect(pass.x + pass.w).toBeLessThanOrEqual(verify.x + verify.w)
    expect(frames[6].text.get('verify-pass')).toBe('✓')
    expect(css).toMatch(/\.pass\s*\{[^}]*background:\s*var\(--pass\)/)
    expect(css).toMatch(/--pass:\s*#55c38a/)
  })

  it('8: a modify arc from the conversation down into the route, with the edited card flagged', () => {
    const arc = spec('modify')
    if (arc.kind !== 'arrow') throw new Error('modify must be an arrow')
    expect(arc.via).toBeDefined()
    expect(arc.from[0]).toBeGreaterThanOrEqual(rectOf('skill').x + rectOf('skill').w - 2)
    expect(arc.from[1]).toBeLessThanOrEqual(rectOf('skill').y + rectOf('skill').h)
    const route = rectOf('route')
    expect(arc.to[1]).toBeGreaterThan(route.y)
    expect(arc.to[1]).toBeLessThan(route.y + route.h)
    expect(frames[7].text.get('route')).toBe('route')
    expect(node(8, 'card-2').getAttribute('data-presentation-flag')).toBe('edited')
    expect(node(8, 'card-2').getAttribute('data-presentation-emphasis')).toBe('true')
    expect(frames[7].text.get('edited')).toBe('edited')
    expect(frames[6].flags.get('card-2')).toBeNull()
    expect(frames[7].flags.get('card-2')).toBe('edited')
  })

  it('9: a labeled outer frame encloses the whole diagram', () => {
    const frame = rectOf('reveal-frame')
    expect(frames[8].text.get('reveal-label')).toMatch(/example of the skill/)
    for (const entity of ENTITIES) {
      if (entity.id === 'reveal-frame') continue
      const points =
        'at' in entity
          ? [[entity.at.x, entity.at.y], [entity.at.x + (entity.at.w ?? 0), entity.at.y + (entity.at.h ?? 0)]]
          : [entity.from, entity.to, ...(entity.via ? [[(entity.from[0] + 2 * entity.via[0] + entity.to[0]) / 4, (entity.from[1] + 2 * entity.via[1] + entity.to[1]) / 4]] : [])]
      for (const [x, y] of points) {
        expect(x, `${entity.id} x`).toBeGreaterThan(frame.x)
        expect(x, `${entity.id} x`).toBeLessThan(frame.x + frame.w)
        expect(y, `${entity.id} y`).toBeGreaterThan(frame.y)
        expect(y, `${entity.id} y`).toBeLessThan(frame.y + frame.h)
      }
    }
  })

  it('keeps every entity inside the 880 x 380 canvas', () => {
    for (const entity of ENTITIES) {
      if (!('at' in entity)) continue
      expect(entity.at.x).toBeGreaterThanOrEqual(0)
      expect(entity.at.y).toBeGreaterThanOrEqual(0)
      expect(entity.at.x + (entity.at.w ?? 0)).toBeLessThanOrEqual(880)
      expect(entity.at.y + (entity.at.h ?? 0)).toBeLessThanOrEqual(380)
    }
  })
})

describe('sample styling', () => {
  it('owns its look in presentation-local CSS and styles active chrome and attribution', () => {
    expect(css).toMatch(/\[data-presentation-progress-dot\]\[data-presentation-active\]\s*\{[^}]*background:/)
    expect(css).toMatch(/\[data-presentation-progress-dot\]\s*\{[^}]*background:\s*transparent/)
    expect(css).toMatch(/\[data-presentation-toc-entry\]\[data-presentation-active\]\s*\{[^}]*font-weight:\s*700/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*font-size:\s*0\.8125rem/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*font-family:/)
    expect(css).toMatch(/\[data-presentation-attribution\]\s*\{[^}]*color:\s*var\(--muted\)/)
    const talk = readFileSync(resolve(process.cwd(), 'src/presentations/how-to-make-a-presentation/Talk.tsx'), 'utf8')
    expect(talk).toContain("import './styles.css'")
    expect(talk).not.toMatch(/\bas (any|unknown|Step)/)
  })
})
