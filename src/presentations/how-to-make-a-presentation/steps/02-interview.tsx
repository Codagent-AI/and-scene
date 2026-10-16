import type { Step } from '../../../presentation-kit'
import { DeckScene } from '../Scene'
import type { DeckPayload } from '../types'

export const step02: Step<DeckPayload> = {
  id: 'interview',
  era: 'the ask',
  title: "The skill interviews you",
  caption: "One question at a time: the topic, the look, then each beat of the story.",
  Scene: DeckScene,
  groupKey: 'deck',
  payload: { stage: 2 },
}
