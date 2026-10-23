import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps'
import { ENTITIES, type EntityId } from '../../src/presentations/how-to-make-a-presentation/entities'
import { presentations } from '../../src/presentations'

const ROOT = join(import.meta.dirname, '..', '..')
const SAMPLE_DIR = join(ROOT, 'src', 'presentations', 'how-to-make-a-presentation')

/** The nine normative steps: era, title, caption, in order. */
const NORMATIVE: Array<[string, string, string]> = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  [
    'the gathering',
    'Answers become steps',
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  ],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  [
    'the build',
    'It assembles the scene',
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  ],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

describe('reference sample outline', () => {
  it('has nine steps with the normative eras, titles, and captions, in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(NORMATIVE)
  })

  it('gives every step a unique, non-empty stable id', () => {
    const ids = STEPS.map((s) => s.id)
    expect(ids.every((id) => id.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is registered and its entry module exists', () => {
    const entry = presentations.find((p) => p.slug === 'how-to-make-a-presentation')
    expect(entry?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(existsSync(join(SAMPLE_DIR, 'Talk.tsx'))).toBe(true)
  })
})

describe('reference sample accumulates one scene', () => {
  it('every step keeps everything on screen from the previous step, and only newcomers are added', () => {
    for (let i = 1; i < STEPS.length; i += 1) {
      const before = new Set(STEPS[i - 1].payload.visible)
      const now = new Set(STEPS[i].payload.visible)
      for (const id of before) expect(now.has(id), `step ${i + 1} dropped ${id}`).toBe(true)
      const newcomers = STEPS[i].payload.visible.filter((id) => !before.has(id))
      expect([...STEPS[i].payload.added].sort()).toEqual(newcomers.sort())
    }
  })

  it('wraps only newcomers: continuing entities are never in the added list', () => {
    for (let i = 1; i < STEPS.length; i += 1) {
      const before = new Set(STEPS[i - 1].payload.visible)
      for (const id of STEPS[i].payload.added) expect(before.has(id), `step ${i + 1} re-adds ${id}`).toBe(false)
    }
  })

  it('every visible entity is in the catalog, with fixed geometry shared by all steps', () => {
    for (const step of STEPS) {
      for (const id of step.payload.visible) expect(ENTITIES[id], id).toBeDefined()
    }
  })

  it('the tray is a plain region: the scene kit socket sits on its bottom edge', () => {
    const tray = ENTITIES.tray as { geometry: { y: number; h: number } }
    const socket = ENTITIES.socket as { geometry: { y: number } }
    expect(socket.geometry.y).toBe(tray.geometry.y + tray.geometry.h)
  })

  it('the reveal frame encloses every other entity', () => {
    const frame = (ENTITIES['reveal-frame'] as { geometry: { x: number; y: number; w: number; h: number } }).geometry
    for (const [id, entity] of Object.entries(ENTITIES) as Array<[EntityId, { geometry?: { x: number; y: number; w: number; h: number } }]>) {
      if (id === 'reveal-frame' || !entity.geometry) continue
      const g = entity.geometry
      expect(g.x >= frame.x && g.y >= frame.y, id).toBe(true)
      expect(g.x + g.w <= frame.x + frame.w && g.y + g.h <= frame.y + frame.h, id).toBe(true)
    }
  })

  it('the tray stays unframed in the sample styles', () => {
    const css = readFileSync(join(SAMPLE_DIR, 'talk.css'), 'utf8')
    const block = css.slice(css.indexOf('.talk-tray {'), css.indexOf('}', css.indexOf('.talk-tray {')))
    expect(block).toMatch(/border:\s*none/)
  })

  it('the sample declares the entity variants it uses so the styles and scene agree', () => {
    const css = readFileSync(join(SAMPLE_DIR, 'talk.css'), 'utf8')
    const variants = new Set(Object.values(ENTITIES).map((e) => e.variant))
    for (const variant of variants) expect(css, variant).toContain(`talk-${variant}`)
  })
})
