import type { Step } from '../../../presentation-kit'
import { E, type EntityId } from '../entities'
import { SampleScene, type ScenePayload } from '../scene'

interface StepSpec {
  id: string
  era: string
  title: string
  caption: string
  visible: readonly EntityId[]
  flagged?: readonly EntityId[]
}

const s1 = [E.you, E.prompt] as const
const s2 = [...s1, E.skill, E.talk, E.question] as const
const s3 = [...s2, E.tray, E.card1] as const
const s4 = [...s3, E.card2, E.card3, E.card4, E.link1, E.link1Label, E.link2, E.link2Label, E.link3, E.link3Label] as const
const s5 = [...s4, E.ghost, E.control] as const
const s6 = [...s5, E.socket] as const
const s7 = [...s6, E.verify, E.link4, E.link4Label, E.pass] as const
const s8 = [...s7, E.modify, E.modifyLabel, E.edited, E.editedFlag] as const
const s9 = [...s8, E.frame, E.reveal] as const

const SPECS: StepSpec[] = [
  { id: 'you-have-a-topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', visible: s1 },
  { id: 'the-skill-interviews-you', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', visible: s2 },
  { id: 'answers-become-steps', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', visible: s3 },
  { id: 'the-deck-grows', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', visible: s4 },
  { id: 'you-set-the-depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', visible: s5 },
  { id: 'it-assembles-the-scene', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', visible: s6 },
  { id: 'it-checks-its-own-work', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', visible: s7 },
  { id: 'changed-your-mind', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', visible: s8, flagged: [E.card3] },
  { id: 'youre-looking-at-one', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', visible: s9, flagged: [E.card3] },
]

export const STEPS: Step<ScenePayload>[] = SPECS.map((spec, i) => ({
  id: spec.id,
  era: spec.era,
  title: spec.title,
  caption: spec.caption,
  Scene: SampleScene,
  groupKey: 'how-to-make-a-presentation',
  // Only entities new at this step fade in; continuing ones just morph.
  payload: { visible: spec.visible, entering: spec.visible.filter((e) => !SPECS[i - 1]?.visible.includes(e)), flagged: spec.flagged },
}))
