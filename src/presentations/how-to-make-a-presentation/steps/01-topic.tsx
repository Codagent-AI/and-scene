import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step01: Step<DeckPayload> = {
  id: 'topic',
  era: 'the ask',
  title: "You have a topic",
  caption: "It starts with you, a topic, and mild overconfidence.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 1 },
}
