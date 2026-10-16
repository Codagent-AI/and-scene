import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from './SampleScene.tsx'

export const step4: Step<SamplePayload> = {
  id: 'grows',
  era: "the gathering",
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { n: 4 },
}
