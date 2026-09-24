import type { Step } from '../../../presentation-kit'
import { EvolvingScene } from './EvolvingScene'

export interface ReferencePayload { through: number }
const titles = ['You have a topic', 'The skill interviews you', 'Answers become steps', 'The deck grows', 'You set the depth', 'It assembles the scene', 'It checks its own work', 'Changed your mind? Loop it.', "You're looking at one"]
const captions = [
  'It starts with you, a topic, and mild overconfidence.',
  'One question at a time: the topic, the look, then each beat of the story.',
  'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  'Same shapes, new beats. Every answer extends the story without redrawing it.',
  'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  'Before saying done, it builds and renders every step — and fixes what breaks.',
  'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  'This presentation was built exactly this way. Thanks for watching.',
]
const eras = ['the ask', 'the ask', 'the gathering', 'the gathering', 'the gathering', 'the build', 'the build', 'the loop', 'the reveal']

export const REFERENCE_STEPS: Step<ReferencePayload>[] = titles.map((title, index) => ({ id: `reference-${index + 1}`, era: eras[index], title, caption: captions[index], groupKey: 'reference-scene', Scene: EvolvingScene, payload: { through: index + 1 } }))
