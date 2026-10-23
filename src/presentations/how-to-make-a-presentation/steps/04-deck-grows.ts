import type { Step } from '../../../presentation-kit'
import { card2, card3, link23, link23Label } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'
import { entities as previous } from './03-answers'

export const entities = [...previous, card2, link23, link23Label, card3]

export const step: Step<SamplePayload> = {
  id: 'the-deck-grows',
  era: 'the gathering',
  title: 'The deck grows',
  caption: 'Same shapes, new beats. Every answer extends the story without redrawing it.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}
