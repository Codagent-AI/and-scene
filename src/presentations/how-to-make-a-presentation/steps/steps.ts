import type { Step } from '../../../presentation-kit/index.ts'
import { SampleScene } from '../Scene.tsx'
import { START, type SceneState } from '../state.ts'

const GROUP = 'how-to-make-a-presentation'

function step(
  id: string,
  era: string,
  title: string,
  caption: string,
  state: Partial<SceneState>,
): Step<SceneState> {
  return { id, era, title, caption, groupKey: GROUP, Scene: SampleScene, payload: { ...START, ...state } }
}

// Each state repeats what came before, so the entity set only ever grows.
const s2 = { skill: true, focus: 'skill' } as const
const s3 = { ...s2, cards: 1, links: 1, focus: 'card-1' } as const
const s4 = { ...s3, cards: 4, links: 3, focus: 'card-4' } as const
const s5 = { ...s4, ghost: true, links: 4, control: true, focus: 'ghost' } as const
const s6 = { ...s5, kit: true, focus: 'kit' } as const
const s7 = { ...s6, verify: true, links: 5, focus: 'verify' } as const
const s8 = { ...s7, modify: true, focus: 'card-2' } as const
const s9 = { ...s8, frame: true, focus: null } as const

export const STEPS: Step<SceneState>[] = [
  step('ask-topic', 'the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.', {}),
  step('ask-interview', 'the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.', s2),
  step('gather-steps', 'the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', s3),
  step('gather-grows', 'the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.', s4),
  step('gather-depth', 'the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', s5),
  step('build-scene', 'the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', s6),
  step('build-verify', 'the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.', s7),
  step('loop-modify', 'the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', s8),
  step('reveal', 'the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.', s9),
]
