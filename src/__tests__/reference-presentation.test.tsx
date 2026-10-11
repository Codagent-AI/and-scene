import { describe, expect, it } from 'vitest'
import { STEPS } from '../presentations/how-to-make-a-presentation/steps'
import { GROUP_ID } from '../presentations/how-to-make-a-presentation/entities'
import { presentations, resolvePresentation } from '../presentations'

const expected = [
  ['the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

describe('reference presentation contract', () => {
  it('matches the ordered nine-step outline in one unique, registered scene', () => {
    expect(STEPS).toHaveLength(9)
    expect(STEPS.map(({ era, title, caption }) => [era, title, caption])).toEqual(expected)
    expect(new Set(STEPS.map(({ id }) => id)).size).toBe(9)
    expect(STEPS.every(({ diagram }) => diagram.groupKey === GROUP_ID)).toBe(true)
    expect(STEPS.every(({ diagram }) => diagram.scene === STEPS[0].diagram.scene)).toBe(true)
    expect(presentations).toHaveLength(1)
    expect(resolvePresentation('how-to-make-a-presentation')).toMatchObject({
      slug: 'how-to-make-a-presentation',
      title: 'How to Use This Skill to Make a Presentation',
    })
  })
})
