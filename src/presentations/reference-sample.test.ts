import { presentations } from './index'
import type { Step } from '../presentation-kit'

const canonicalSteps = [
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

describe('committed reference sample', () => {
  it('registers the canonical reference presentation and its nine steps in order', async () => {
    const registration = presentations.find(({ slug }) => slug === 'how-to-make-a-presentation')

    expect(registration).toMatchObject({
      slug: 'how-to-make-a-presentation',
      title: 'How to Use This Skill to Make a Presentation',
    })
    if (!registration) return

    const module = await registration.load()
    const stepsPath = './how-to-make-a-presentation/steps'
    const { STEPS } = await import(/* @vite-ignore */ stepsPath) as { STEPS: readonly Step<unknown>[] }
    expect(module.default).toBeTypeOf('function')
    expect(STEPS.map(({ era, title, caption }) => [era, title, caption])).toEqual(canonicalSteps)
  })
})
