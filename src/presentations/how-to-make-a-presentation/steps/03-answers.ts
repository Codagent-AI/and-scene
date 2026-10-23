import type { Step } from '../../../presentation-kit'
import { card1, link12, link12Label, tray } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'
import { entities as previous } from './02-interview'

export const entities = [...previous, tray, card1, link12, link12Label]

export const step: Step<SamplePayload> = {
  id: 'answers-become-steps',
  era: 'the gathering',
  title: 'Answers become steps',
  caption:
    'Each answer lands as a step card — title, caption, visual — plus what morphs from one step into the next.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}
