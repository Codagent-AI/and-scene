import type { Step } from '../../../presentation-kit/types.ts'
import { HowToScene, type HowToPayload } from './HowToScene.tsx'

export const STEPS: Step<HowToPayload>[] = [
  { id: 'the-ask-topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 1 } },
  { id: 'the-ask-interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 2 } },
  { id: 'answers-become-steps', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 3 } },
  { id: 'deck-grows', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 4 } },
  { id: 'set-the-depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 5 } },
  { id: 'assembles-scene', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 6 } },
  { id: 'checks-work', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 7 } },
  { id: 'change-loop', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 8 } },
  { id: 'self-reference-reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', Scene: HowToScene, groupKey: 'how-to-scene', payload: { through: 9 } },
]
