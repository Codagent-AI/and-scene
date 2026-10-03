import type { Step } from '../../../presentation-kit'
import Scene from './Scene'

export const steps: Step<number>[] = [
  { id: 'topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', scene: Scene, payload: 0, groupKey: 'presentation-story' },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', scene: Scene, payload: 1, groupKey: 'presentation-story' },
  { id: 'answers', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', scene: Scene, payload: 2, groupKey: 'presentation-story' },
  { id: 'deck', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', scene: Scene, payload: 3, groupKey: 'presentation-story' },
  { id: 'depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', scene: Scene, payload: 4, groupKey: 'presentation-story' },
  { id: 'assemble', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', scene: Scene, payload: 5, groupKey: 'presentation-story' },
  { id: 'verify', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', scene: Scene, payload: 6, groupKey: 'presentation-story' },
  { id: 'modify', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', scene: Scene, payload: 7, groupKey: 'presentation-story' },
  { id: 'reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', scene: Scene, payload: 8, groupKey: 'presentation-story' },
]
