import { describe, expect, it } from 'vitest'
import { OUTLINE, TITLE } from '../../../src/presentations/how-to-make-a-presentation/outline.ts'
import { compareOutline } from '../../../scripts/lib/verify-core.mjs'

/** Transcribed from the presentation-verification spec table; independent of the sample's exports. */
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

const expected = {
  title: 'How to Use This Skill to Make a Presentation',
  steps: NORMATIVE.map(([era, title, caption]) => ({ era, title, caption })),
}
interface Row {
  era: string
  title: string
  caption: string
}
const actual = (): { title: string; steps: Row[] } => ({
  title: TITLE,
  steps: OUTLINE.map(({ era, title, caption }) => ({ era, title, caption })),
})

describe('reference outline (L-57, L-63)', () => {
  it('has nine steps with the normative eras, titles and captions in order', () => {
    expect(OUTLINE).toHaveLength(9)
    OUTLINE.forEach((step, i) => {
      expect([step.era, step.title, step.caption]).toEqual([...NORMATIVE[i]])
    })
    expect(TITLE).toBe(expected.title)
  })

  it('has unique, stable step ids', () => {
    expect(new Set(OUTLINE.map((s) => s.id)).size).toBe(9)
  })

  it('compares clean against the independent expectation', () => {
    expect(compareOutline(actual(), expected)).toEqual([])
  })

  it('detects altered eras, titles, captions, order and count', () => {
    const a = actual()
    a.steps[2] = { ...a.steps[2], title: 'Answers become cards' }
    expect(compareOutline(a, expected)[0]).toMatch(/step 3 title/)
    const b = actual()
    b.steps[0] = { ...b.steps[0], era: 'the start' }
    expect(compareOutline(b, expected)[0]).toMatch(/step 1 era/)
    const c = actual()
    c.steps[8] = { ...c.steps[8], caption: 'Bye.' }
    expect(compareOutline(c, expected)[0]).toMatch(/step 9 caption/)
    const d = actual()
    ;[d.steps[3], d.steps[4]] = [d.steps[4], d.steps[3]]
    expect(compareOutline(d, expected).length).toBeGreaterThanOrEqual(2)
    const e = actual()
    e.steps.pop()
    expect(compareOutline(e, expected)[0]).toMatch(/8 steps, expected 9/)
    expect(compareOutline({ title: 'Other', steps: actual().steps }, expected)[0]).toMatch(/sample title/)
  })

  it('treats whitespace differences as equal but nothing else', () => {
    const a = actual()
    a.steps[1] = { ...a.steps[1], caption: `  ${a.steps[1].caption.replace(': ', ':\n ')} ` }
    expect(compareOutline(a, expected)).toEqual([])
    a.steps[1] = { ...a.steps[1], caption: a.steps[1].caption.replace('then', 'and') }
    expect(compareOutline(a, expected)).toHaveLength(1)
  })
})
