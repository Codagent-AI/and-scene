import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step04: Step<DeckPayload> = {
  id: 'grows',
  era: 'the gathering',
  title: "The deck grows",
  caption: "Same shapes, new beats. Every answer extends the story without redrawing it.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 4 },
}
