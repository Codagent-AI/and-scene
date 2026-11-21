import type { Step } from '../../../presentation-kit'
import type { Beat } from './Workshop'
import { Workshop } from './Workshop'

export const steps: readonly Step<Beat>[] = [
  {
    id: 'topic', era: 'the ask', title: 'You have a topic',
    caption: 'It starts with you, a topic, and mild overconfidence.',
    payload: 1, Scene: Workshop, groupKey: 'workshop',
  },
  {
    id: 'interview', era: 'the ask', title: 'The skill interviews you',
    caption: 'One question at a time: the topic, the look, then each beat of the story.',
    payload: 2, Scene: Workshop, groupKey: 'workshop',
  },
  {
    id: 'answers', era: 'the gathering', title: 'Answers become steps',
    caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
    payload: 3, Scene: Workshop, groupKey: 'workshop',
  },
  {
    id: 'growth', era: 'the gathering', title: 'The deck grows',
    caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
    payload: 4, Scene: Workshop, groupKey: 'workshop',
  },
  {
    id: 'depth', era: 'the gathering', title: 'You set the depth',
    caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
    payload: 5, Scene: Workshop, groupKey: 'workshop',
  },
  {
    id: 'assemble', era: 'the build', title: 'It assembles the scene',
    caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.',
    payload: 6, Scene: Workshop, groupKey: 'workshop',
  },
  {
    id: 'checks', era: 'the build', title: 'It checks its own work',
    caption: 'Before saying done, it builds and renders every step — and fixes what breaks.',
    payload: 7, Scene: Workshop, groupKey: 'workshop',
  },
  {
    id: 'loop', era: 'the loop', title: 'Changed your mind? Loop it.',
    caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
    payload: 8, Scene: Workshop, groupKey: 'workshop',
  },
  {
    id: 'reveal', era: 'the reveal', title: "You're looking at one",
    caption: 'This presentation was built exactly this way. Thanks for watching.',
    payload: 9, Scene: Workshop, groupKey: 'workshop',
  },
]
