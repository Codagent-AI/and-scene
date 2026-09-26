import type { Step } from '../../presentation-kit/index.js'
import { Scene } from './Scene.js'

export const PRESENTATION_TITLE = 'How to Use This Skill to Make a Presentation'

export type Payload = { cards: number; ghost: boolean; socket: boolean; verify: boolean; modify: boolean; reveal: boolean; question: boolean }

export const STEPS: readonly Step<Payload>[] = [
  { id: 'ask-topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 0, ghost: false, socket: false, verify: false, modify: false, reveal: false, question: false } },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 0, ghost: false, socket: false, verify: false, modify: false, reveal: false, question: true } },
  { id: 'answers', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 1, ghost: false, socket: false, verify: false, modify: false, reveal: false, question: true } },
  { id: 'deck-grows', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 3, ghost: false, socket: false, verify: false, modify: false, reveal: false, question: true } },
  { id: 'depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 4, ghost: true, socket: false, verify: false, modify: false, reveal: false, question: true } },
  { id: 'assemble', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 5, ghost: true, socket: true, verify: false, modify: false, reveal: false, question: true } },
  { id: 'verify', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 7, ghost: false, socket: true, verify: true, modify: false, reveal: false, question: true } },
  { id: 'modify', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 7, ghost: false, socket: true, verify: true, modify: true, reveal: false, question: true } },
  { id: 'reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', groupKey: 'sample-scene', scene: Scene, payload: { cards: 7, ghost: false, socket: true, verify: true, modify: false, reveal: true, question: true } },
]
