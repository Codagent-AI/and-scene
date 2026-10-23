import type { BoxId, EntityId } from './entities'

export interface Beat {
  era: string
  title: string
  caption: string
  /** Entities introduced in this beat. Everything introduced earlier stays. */
  enter: readonly EntityId[]
  /** Appearance state set in this beat. Later beats keep it unless they change it. */
  states?: Partial<Record<BoxId, string>>
}

export const BEATS: readonly Beat[] = [
  {
    era: 'the ask',
    title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
    enter: ['you', 'prompt'],
  },
  {
    era: 'the ask',
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
    enter: ['skill', 'chat', 'question'],
  },
  {
    era: 'the gathering',
    title: 'Answers become steps',
    caption:
      'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
    enter: ['card1'],
  },
  {
    era: 'the gathering',
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
    enter: ['card2', 'card3', 'link12', 'link23'],
  },
  {
    era: 'the gathering',
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
    enter: ['ghost', 'partial'],
  },
  {
    era: 'the build',
    title: 'It assembles the scene',
    caption:
      'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
    enter: ['socket'],
  },
  {
    era: 'the build',
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
    enter: ['verify'],
    states: { verify: 'pass' },
  },
  {
    era: 'the loop',
    title: 'Changed your mind? Loop it.',
    caption:
      'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
    enter: ['modify', 'modifyLabel', 'route', 'flag'],
    states: { card2: 'edited' },
  },
  {
    era: 'the reveal',
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
    enter: ['frame'],
  },
]
