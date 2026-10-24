import type { Step } from '../../../presentation-kit'
import type { SampleState } from '../entities'
import { SampleScene } from '../scene'

export const step4: Step<SampleState> = {
  id: 'the-deck-grows',
  era: 'the gathering',
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  groupKey: 'sample',
  payload: { upTo: 4 },
  Scene: SampleScene,
}
