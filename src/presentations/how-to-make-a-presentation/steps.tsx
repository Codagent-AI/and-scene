import type { Step } from '../../presentation-kit'
import { SampleScene } from './steps/Scene'
import type { SamplePayload } from './steps/Scene'

const outline = [
  ['you-have-a-topic', 'the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['the-skill-interviews-you', 'the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['answers-become-steps', 'the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['the-deck-grows', 'the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['you-set-the-depth', 'the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['it-assembles-the-scene', 'the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['it-checks-its-own-work', 'the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['changed-your-mind-loop-it', 'the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['youre-looking-at-one', 'the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
] as const

export const STEPS: readonly Step<SamplePayload>[] = outline.map(([id, era, title, caption], index) => ({
  id,
  era,
  title,
  caption,
  groupKey: 'how-to-make-a-presentation:scene',
  Scene: SampleScene,
  payload: { phase: index + 1 },
}))
