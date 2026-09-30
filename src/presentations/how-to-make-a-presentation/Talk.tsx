import { Presentation, type Step } from '../../presentation-kit'
import { Scene, type ScenePayload } from './steps/Scene'
import './presentation.css'

// The verifier and registry-contract tests consume this canonical outline.
// eslint-disable-next-line react-refresh/only-export-components
export const STEPS: readonly Step<ScenePayload>[] = [
  { id: 'topic', era: 'the ask', title: 'You have a topic', caption: 'It starts with you, a topic, and mild overconfidence.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 1 } },
  { id: 'interview', era: 'the ask', title: 'The skill interviews you', caption: 'One question at a time: the topic, the look, then each beat of the story.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 2 } },
  { id: 'answers', era: 'the gathering', title: 'Answers become steps', caption: 'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 3 } },
  { id: 'grows', era: 'the gathering', title: 'The deck grows', caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 4 } },
  { id: 'depth', era: 'the gathering', title: 'You set the depth', caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 5 } },
  { id: 'assemble', era: 'the build', title: 'It assembles the scene', caption: 'Your steps are wired into one evolving scene, drawn with a shared scene kit — ready-made boxes, arrows, and motion that make entities morph.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 6 } },
  { id: 'verify', era: 'the build', title: 'It checks its own work', caption: 'Before saying done, it builds and renders every step — and fixes what breaks.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 7 } },
  { id: 'loop', era: 'the loop', title: 'Changed your mind? Loop it.', caption: 'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 8 } },
  { id: 'reveal', era: 'the reveal', title: "You're looking at one", caption: 'This presentation was built exactly this way. Thanks for watching.', groupKey: 'how-to-make-a-presentation-scene', Scene, payload: { beat: 9 } },
]

export default function Talk() {
  return <div className="sample-presentation"><Presentation steps={STEPS} title="How to Use This Skill to Make a Presentation" initialMode="browse" /></div>
}
