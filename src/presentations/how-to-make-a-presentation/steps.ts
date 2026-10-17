import type { Step } from '../../presentation-kit/index.ts'
import { SampleScene } from './Scene.tsx'

export interface SamplePayload {
  /** 1-based beat; entities are present from the beat that introduces them onward. */
  beat: number
}

const ERA = {
  ask: 'the ask',
  gathering: 'the gathering',
  build: 'the build',
  loop: 'the loop',
  reveal: 'the reveal',
} as const

type Spec = [id: string, era: string, title: string, caption: string]

const SPECS: Spec[] = [
  ['you-have-a-topic', ERA.ask, 'You have a topic', 'It starts with you, a topic, and mild overconfidence.'],
  [
    'the-skill-interviews-you',
    ERA.ask,
    'The skill interviews you',
    'One question at a time: the topic, the look, then each beat of the story.',
  ],
  [
    'answers-become-steps',
    ERA.gathering,
    'Answers become steps',
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  ],
  [
    'the-deck-grows',
    ERA.gathering,
    'The deck grows',
    'Same shapes, new beats. Every answer extends the story without redrawing it.',
  ],
  [
    'you-set-the-depth',
    ERA.gathering,
    'You set the depth',
    'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  ],
  [
    'it-assembles-the-scene',
    ERA.build,
    'It assembles the scene',
    'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
  ],
  [
    'it-checks-its-own-work',
    ERA.build,
    'It checks its own work',
    'Before saying done, it builds and renders every step — and fixes what breaks.',
  ],
  [
    'changed-your-mind',
    ERA.loop,
    'Changed your mind? Loop it.',
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  ],
  [
    'youre-looking-at-one',
    ERA.reveal,
    "You're looking at one",
    'This presentation was built exactly this way. Thanks for watching.',
  ],
]

export const STEPS: Step<SamplePayload>[] = SPECS.map(([id, era, title, caption], i) => ({
  id,
  era,
  title,
  caption,
  Scene: SampleScene,
  groupKey: 'conversation',
  payload: { beat: i + 1 },
}))
