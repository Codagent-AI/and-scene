import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step02: Step<DeckPayload> = {
  id: 'example-two',
  era: 'start',
  title: 'Second step title',
  caption: 'One-sentence caption for the second step.',
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 2 },
}
