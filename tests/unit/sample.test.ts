import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildOutline } from '../../src/presentation-kit/index.ts'
import { E } from '../../src/presentations/how-to-make-a-presentation/entities.ts'
import { STEPS } from '../../src/presentations/how-to-make-a-presentation/steps/index.ts'
import { findPresentation, presentations } from '../../src/presentations/index.ts'
import { resolveRoute } from '../../src/route.ts'

const root = path.resolve(import.meta.dirname, '../..')

// Normative: openspec/changes/create-and-scene/specs/presentation-verification/spec.md
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

describe('reference sample', () => {
  it('has the nine normative steps in order', () => {
    expect(STEPS.map((s) => [s.era, s.title, s.caption])).toEqual(NORMATIVE.map((n) => [...n]))
  })

  it('gives every step a unique id, a caption, and the shared grouped scene', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(9)
    expect(STEPS.every((s) => s.caption.length > 0)).toBe(true)
    expect(new Set(STEPS.map((s) => `${s.groupKey}:${s.Scene.name}`)).size).toBe(1)
  })

  it('derives numbers 1..9 and four eras in the specified order', () => {
    const { entries, eras } = buildOutline(STEPS)
    expect(entries.map((e) => e.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(eras.map((e) => e.label)).toEqual(['the ask', 'the gathering', 'the build', 'the loop', 'the reveal'])
  })

  it('accumulates entities: nothing on screen is ever removed or re-added', () => {
    for (let i = 1; i < STEPS.length; i++) {
      const prev = STEPS[i - 1].payload.shown as string[]
      const cur = STEPS[i].payload.shown as string[]
      expect(cur.slice(0, prev.length), `step ${i + 1}`).toEqual(prev)
      expect(new Set(cur).size).toBe(cur.length)
      expect(STEPS[i].payload.entering).toEqual(cur.slice(prev.length))
    }
  })

  it('introduces the normative scene content step by step', () => {
    const introduced = (i: number) => new Set<string>(STEPS[i].payload.entering)
    expect(introduced(0)).toEqual(new Set([E.you, E.prompt]))
    expect(introduced(1)).toEqual(new Set([E.skill, E.conversation, E.question]))
    expect(introduced(2).has(E.tray) && introduced(2).has(E.card1)).toBe(true)
    expect([E.card2, E.card3, E.card4].every((id) => introduced(3).has(id))).toBe(true)
    expect([E.ghost, E.depth].every((id) => introduced(4).has(id))).toBe(true)
    expect(introduced(5).has(E.socket)).toBe(true)
    expect([E.verify, E.pass].every((id) => introduced(6).has(id))).toBe(true)
    expect([E.modify, E.edited].every((id) => introduced(7).has(id))).toBe(true)
    expect(introduced(8).has(E.frame)).toBe(true)
  })

  it('uses one layoutId namespace', () => {
    const ids = Object.values(E)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => id.startsWith('htmp/'))).toBe(true)
  })

  it('lives in its own folder with a Talk entry', () => {
    expect(fs.existsSync(path.join(root, 'src/presentations/how-to-make-a-presentation/Talk.tsx'))).toBe(true)
  })
})

describe('registry and routes', () => {
  it('registers the sample under its slug and title', () => {
    expect(findPresentation('how-to-make-a-presentation')?.title).toBe('How to Use This Skill to Make a Presentation')
    expect(presentations.map((p) => p.slug)).toContain('how-to-make-a-presentation')
  })

  it('has unique slugs', () => {
    expect(new Set(presentations.map((p) => p.slug)).size).toBe(presentations.length)
  })

  it('routes "/" and unknown paths to the landing page and slugs to their presentation', () => {
    expect(resolveRoute('/').kind).toBe('landing')
    expect(resolveRoute('/nope').kind).toBe('landing')
    const route = resolveRoute('/how-to-make-a-presentation/')
    expect(route.kind === 'presentation' && route.entry.slug).toBe('how-to-make-a-presentation')
  })
})
