import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const sample = 'src/presentations/how-to-make-a-presentation'
const outline = [
  ['You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ["You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

describe('reference sample', () => {
  it('exists and is registered as the canonical nine-step presentation', () => {
    expect(existsSync(resolve(root, sample, 'Talk.tsx'))).toBe(true)
    const registry = readFileSync(resolve(root, 'src/presentations/index.ts'), 'utf8')
    expect(registry).toContain("slug: 'how-to-make-a-presentation'")
    const steps = readFileSync(resolve(root, sample, 'steps/index.ts'), 'utf8')
    for (const [title, caption] of outline) {
      expect(steps).toContain(title)
      expect(steps).toContain(caption)
    }
    expect((steps.match(/id: '/g) ?? []).length).toBe(9)
    expect(steps).toContain('groupKey:')
  })
})
