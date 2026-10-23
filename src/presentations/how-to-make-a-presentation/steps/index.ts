import type { Step } from '../../../presentation-kit'
import { E, type EntityId } from '../entities'
import { SampleScene, type ScenePayload } from '../scene'

const group = (id: string, era: string, title: string, caption: string, visible: readonly EntityId[], flagged?: readonly EntityId[]): Step<ScenePayload> => ({
  id,
  era,
  title,
  caption,
  Scene: SampleScene,
  groupKey: 'how-to-make-a-presentation',
  payload: { visible, flagged },
})

const s1 = [E.you, E.prompt] as const
const s2 = [...s1, E.skill, E.talk, E.question] as const
const s3 = [...s2, E.tray, E.card1] as const
const s4 = [...s3, E.card2, E.card3, E.card4, E.link1, E.link1Label, E.link2, E.link2Label, E.link3, E.link3Label] as const
const s5 = [...s4, E.ghost, E.control] as const
const s6 = [...s5, E.socket] as const
const s7 = [...s6, E.verify, E.pass] as const
const s8 = [...s7, E.modify, E.modifyLabel, E.edited, E.editedFlag] as const
const s9 = [...s8, E.frame, E.reveal] as const

export const STEPS: Step<ScenePayload>[] = [
  group('you-have-a-topic', 'the ask', 'You have a topic', 'It starts with you, a topic, and mild overconfidence.', s1),
  group('the-skill-interviews-you', 'the ask', 'The skill interviews you', 'One question at a time: the topic, the look, then each beat of the story.', s2),
  group('answers-become-steps', 'the gathering', 'Answers become steps', 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', s3),
  group('the-deck-grows', 'the gathering', 'The deck grows', 'Same shapes, new beats. Every answer extends the story without redrawing it.', s4),
  group('you-set-the-depth', 'the gathering', 'You set the depth', 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', s5),
  group('it-assembles-the-scene', 'the build', 'It assembles the scene', 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', s6),
  group('it-checks-its-own-work', 'the build', 'It checks its own work', 'Before saying done, it builds and renders every step — and fixes what breaks.', s7),
  group('changed-your-mind', 'the loop', 'Changed your mind? Loop it.', 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', s8, [E.card3]),
  group('youre-looking-at-one', 'the reveal', "You're looking at one", 'This presentation was built exactly this way. Thanks for watching.', s9, [E.card3]),
]
