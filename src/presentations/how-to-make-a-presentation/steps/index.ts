import type { Step } from '../../../presentation-kit'
import { SampleScene, type SampleState } from './Scene'

export const steps: Step<SampleState>[] = [
  { id: 'topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 0 } },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 1 } },
  { id: 'answers', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 2 } },
  { id: 'deck', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 3 } },
  { id: 'depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 4 } },
  { id: 'assembly', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 5 } },
  { id: 'verification', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 6 } },
  { id: 'loop', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 7 } },
  { id: 'reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', groupKey: 'one-evolving-scene', Scene: SampleScene, payload: { beat: 8 } },
]
