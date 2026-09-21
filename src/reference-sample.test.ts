import { describe, expect, it } from 'vitest'
import { presentations } from './presentations'
import { referenceSteps } from './presentations/how-to-make-a-presentation/steps'

const canonical = [
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

describe('reference presentation contract', () => {
  it('registers the canonical nine-step sample in order', () => {
    expect(presentations.map(({ slug, title }) => ({ slug, title }))).toContainEqual({
      slug: 'how-to-make-a-presentation',
      title: 'How to Use This Skill to Make a Presentation',
    })
    expect(referenceSteps).toHaveLength(9)
    expect(referenceSteps.map(({ era, title, caption }) => [era, title, caption])).toEqual(canonical)
  })

  it('keeps the reference as one accumulating grouped scene with stable entities', () => {
    expect(referenceSteps.every((step) => step.groupKey === 'reference-scene')).toBe(true)
    const entityIds = referenceSteps.flatMap((step) => step.entityIds)
    expect(new Set(entityIds).size).toBeGreaterThan(8)
    expect(entityIds).toContain('reference:you')
    expect(entityIds).toContain('reference:skill')
    expect(entityIds).toContain('reference:reveal-frame')
  })
})
