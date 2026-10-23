import type { Step } from '../../../presentation-kit'
import { depth, ghost } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'
import { entities as previous } from './04-deck-grows'

export const entities = [...previous, ghost, depth]

export const step: Step<SamplePayload> = {
  id: 'you-set-the-depth',
  era: 'the gathering',
  title: 'You set the depth',
  caption: 'Spell out every step, or sketch a few and see how it looks. You hold the gate.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}
