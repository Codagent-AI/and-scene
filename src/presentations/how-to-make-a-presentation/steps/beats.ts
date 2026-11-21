import type { EntityId } from '../entities'

export const beats = [
  {
    id: 'topic',
    era: 'the ask',
    title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
    introduces: ['you', 'prompt'],
  },
  {
    id: 'interview',
    era: 'the ask',
    title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
    introduces: ['skill', 'conversation', 'question'],
  },
  {
    id: 'answers',
    era: 'the gathering',
    title: 'Answers become steps',
    caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
    introduces: ['tray', 'first'],
  },
  {
    id: 'growth',
    era: 'the gathering',
    title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
    introduces: ['firstLink', 'morph', 'second', 'secondLink', 'third'],
  },
  {
    id: 'depth',
    era: 'the gathering',
    title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
    introduces: ['ghostLink', 'ghost', 'depth'],
  },
  {
    id: 'assembly',
    era: 'the build',
    title: 'It assembles the scene',
    caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
    introduces: ['kit'],
  },
  {
    id: 'verification',
    era: 'the build',
    title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
    introduces: ['checkLink', 'verify'],
  },
  {
    id: 'modification',
    era: 'the loop',
    title: 'Changed your mind? Loop it.',
    caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
    introduces: ['modify', 'modifyLabel', 'edited'],
  },
  {
    id: 'reveal',
    era: 'the reveal',
    title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
    introduces: ['reveal', 'revealLabel'],
  },
] as const satisfies readonly {
  id: string
  era: string
  title: string
  caption: string
  introduces: readonly EntityId[]
}[]
