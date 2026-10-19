import type { EntityKey } from '../entities'

/** Diagram state for one step: everything visible so far, and what to emphasize now. */
export interface Beat {
  visible: readonly EntityKey[]
  emphasized: readonly EntityKey[]
}

interface BeatSpec {
  id: string
  era: string
  title: string
  caption: string
  /** Entities that join the scene on this step (the scene only ever grows). */
  add: readonly EntityKey[]
  focus: readonly EntityKey[]
}

export const BEAT_SPECS: readonly BeatSpec[] = [
  {
    id: 'topic',
    era: 'the ask',
    title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
    add: ['you', 'prompt'],
    focus: ['you', 'prompt'],
  },
  {
    id: 'interview',
    era: 'the ask',
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
    add: ['skill', 'ask-arrow', 'question'],
    focus: ['skill', 'question'],
  },
  {
    id: 'answers',
    era: 'the gathering',
    title: 'Answers become steps',
    caption:
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
    add: ['tray', 'tray-label', 'card-1', 'link-1', 'link-label-1'],
    focus: ['card-1', 'link-label-1'],
  },
  {
    id: 'grows',
    era: 'the gathering',
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
    add: ['card-2', 'card-3', 'card-4', 'link-2', 'link-label-2', 'link-3', 'link-label-3'],
    focus: ['card-2', 'card-3', 'card-4'],
  },
  {
    id: 'depth',
    era: 'the gathering',
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
    add: ['link-4', 'link-label-4', 'ghost', 'depth-control'],
    focus: ['ghost', 'depth-control', 'you'],
  },
  {
    id: 'assembles',
    era: 'the build',
    title: 'It assembles the scene',
    caption:
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
    add: ['scene-kit'],
    focus: ['scene-kit'],
  },
  {
    id: 'checks',
    era: 'the build',
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
    add: ['link-5', 'link-label-5', 'verify', 'verify-check'],
    focus: ['verify', 'verify-check'],
  },
  {
    id: 'loop',
    era: 'the loop',
    title: 'Changed your mind? Loop it.',
    caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
    add: ['modify', 'modify-label', 'flag'],
    focus: ['modify', 'modify-label', 'flag', 'card-4'],
  },
  {
    id: 'reveal',
    era: 'the reveal',
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
    add: ['frame'],
    focus: ['frame'],
  },
]

export function buildBeats(): Beat[] {
  const seen: EntityKey[] = []
  return BEAT_SPECS.map((spec) => {
    seen.push(...spec.add)
    return { visible: [...seen], emphasized: spec.focus }
  })
}
