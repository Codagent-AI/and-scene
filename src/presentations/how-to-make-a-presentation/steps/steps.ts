import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene } from '../Scene.tsx'
import { START, type Beat, type SceneState } from '../state.ts'

const GROUP = 'how-to-make-a-presentation'

function step(
  id: string,
  era: string,
  title: string,
  caption: string,
  state: SceneState,
  previous: SceneState | null,
): Step<Beat> {
  return { id, era, title, caption, groupKey: GROUP, Scene: SampleScene, payload: { state, previous } }
}

// Each state repeats what came before, so the entity set only ever grows.
const s1: SceneState = START
const s2: SceneState = { ...s1, skill: true }
const s3: SceneState = { ...s2, cards: 1, links: 1 }
const s4: SceneState = { ...s3, cards: 4, links: 3 }
const s5: SceneState = { ...s4, ghost: true, links: 4, control: true }
const s6: SceneState = { ...s5, kit: true }
const s7: SceneState = { ...s6, verify: true, links: 5 }
const s8: SceneState = { ...s7, modify: true }
const s9: SceneState = { ...s8, frame: true }

export const STEPS: Step<Beat>[] = [
  step('ask-topic', 'the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.', s1, null),
  step('ask-interview', 'the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.', s2, s1),
  step('gather-steps', 'the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', s3, s2),
  step('gather-grows', 'the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.', s4, s3),
  step('gather-depth', 'the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', s5, s4),
  step('build-scene', 'the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', s6, s5),
  step('build-verify', 'the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.', s7, s6),
  step('loop-modify', 'the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', s8, s7),
  step('reveal', 'the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.', s9, s8),
]
