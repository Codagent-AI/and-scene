import type { Step } from '../../../presentation-kit'
import { SampleScene } from './Scene'
import type { ScenePayload } from './Scene'

type Beat = [id: string, era: string, title: string, caption: string]

const BEATS: Beat[] = [
  ['ask', 'the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  ['interview', 'the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.'],
  ['answers', 'the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.'],
  ['grows', 'the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.'],
  ['depth', 'the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.'],
  ['assemble', 'the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.'],
  ['check', 'the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.'],
  ['loop', 'the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.'],
  ['reveal', 'the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.'],
]

/** Every step shares one group, so a single scene instance accumulates entities. */
export const STEPS: Step<ScenePayload>[] = BEATS.map(([id, era, title, caption], i) => ({
  id,
  era,
  title,
  caption,
  Scene: SampleScene,
  groupKey: 'scene',
  payload: { n: i + 1 },
}))
