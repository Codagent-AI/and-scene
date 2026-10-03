import { describe, expect, it } from 'vitest'
import { PRESENTATIONS } from './index.ts'
import { REFERENCE_PRESENTATION_TITLE, REFERENCE_STEPS } from './how-to-make-a-presentation/steps/index.tsx'

const expectedSteps = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', "Before saying done, it builds and renders every step — and fixes what breaks."],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

describe('reference presentation', () => {
  it('is registered under its canonical route', () => {
    expect(PRESENTATIONS).toEqual([
      expect.objectContaining({
        slug: 'how-to-make-a-presentation',
        title: REFERENCE_PRESENTATION_TITLE,
      }),
    ])
  })

  it('keeps the canonical nine-step outline in order', () => {
    expect(REFERENCE_STEPS).toHaveLength(expectedSteps.length)
    expect(REFERENCE_STEPS.map(({ era, title, caption }) => [era, title, caption])).toEqual(expectedSteps)
    expect(REFERENCE_STEPS.map(({ id }) => id)).toEqual([
      'the-ask',
      'the-interview',
      'answers-become-steps',
      'the-deck-grows',
      'set-the-depth',
      'assemble-the-scene',
      'check-the-work',
      'loop-it',
      'looking-at-one',
    ])
  })
})
