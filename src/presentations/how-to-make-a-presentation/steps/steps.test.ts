import { describe, expect, it } from 'vitest'
import { STEPS } from './index'

describe('reference presentation outline', () => {
  it('defines the canonical nine step titles and captions in one persistent scene', () => {
    expect(STEPS.map(({ title }) => title)).toEqual([
      'You have a topic',
      'The skill interviews you',
      'Answers become steps',
      'The deck grows',
      'You set the depth',
      'It assembles the scene',
      'It checks its own work',
      'Changed your mind? Loop it.',
      "You're looking at one",
    ])
    expect(STEPS.map(({ caption }) => caption)).toEqual([
      'It starts with you, a topic, and mild overconfidence.',
      'One question at a time: the topic, the look, then each beat of the story.',
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
      'Same shapes, new beats. Every answer extends the story without redrawing it.',
      'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
      'Before saying done, it builds and renders every step — and fixes what breaks.',
      'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
      'This presentation was built exactly this way. Thanks for watching.',
    ])
    expect(new Set(STEPS.map(({ id }) => id)).size).toBe(9)
    expect(new Set(STEPS.map(({ groupKey }) => groupKey))).toEqual(new Set(['how-to-evolving-scene']))
    expect(new Set(STEPS.map(({ Scene }) => Scene)).size).toBe(1)
    expect(STEPS.map(({ payload }) => payload.beat)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })
})
