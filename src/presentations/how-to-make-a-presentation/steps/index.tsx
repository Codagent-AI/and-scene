import type { Step } from '../../../presentation-kit'
import { ReferenceScene, type ReferencePayload } from './scene'

export const REFERENCE_OUTLINE = [
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

const states: readonly ReferencePayload[] = [
  { cards: 0 },
  { cards: 0, skill: true, question: true },
  { cards: 1, skill: true, question: true, tray: true },
  { cards: 3, skill: true, question: true, tray: true },
  { cards: 3, skill: true, question: true, tray: true, depth: true },
  { cards: 4, skill: true, question: true, tray: true, depth: true, kit: true },
  { cards: 4, skill: true, question: true, tray: true, depth: true, kit: true, verify: true },
  { cards: 4, skill: true, question: true, tray: true, depth: true, kit: true, verify: true, modify: true },
  { cards: 4, skill: true, question: true, tray: true, depth: true, kit: true, verify: true, modify: true, reveal: true },
]

export const STEPS: readonly Step<ReferencePayload>[] = REFERENCE_OUTLINE.map(([era, title, caption], index) => ({
  id: `reference-${index + 1}`,
  era,
  title,
  caption,
  payload: states[index]!,
  Scene: ReferenceScene,
  groupKey: 'reference-scene',
}))
