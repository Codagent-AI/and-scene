import type { Step } from '../../../presentation-kit'
import { frame, frameLabel } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'
import { entities as previous } from './08-loop'

export const entities = [...previous, frame, frameLabel]

export const step: Step<SamplePayload> = {
  id: 'youre-looking-at-one',
  era: 'the reveal',
  title: "You're looking at one",
  caption: 'This presentation was built exactly this way. Thanks for watching.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}
