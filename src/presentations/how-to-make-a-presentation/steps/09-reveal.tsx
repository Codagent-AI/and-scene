import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step09: Step<DeckPayload> = {
  id: 'reveal',
  era: 'the reveal',
  title: "You're looking at one",
  caption: "This presentation was built exactly this way. Thanks for watching.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 9 },
}
