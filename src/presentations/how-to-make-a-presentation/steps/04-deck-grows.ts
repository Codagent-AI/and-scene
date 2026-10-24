import type { Step } from '../../../presentation-kit'
import { SampleScene, type SamplePayload } from '../SampleScene'

export const step: Step<SamplePayload> = {
  id: "deck-grows",
  era: "the gathering",
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  groupKey: 'evolving-scene',
  Scene: SampleScene,
  payload: { step: 4 },
}
