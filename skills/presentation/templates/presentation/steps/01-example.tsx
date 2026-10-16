import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step01: Step<DeckPayload> = {
  id: 'example-one',
  era: 'start',
  title: 'First step title',
  caption: 'One-sentence caption for the first step.',
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 1 },
}
