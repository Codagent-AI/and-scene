import type { Step } from '../../../presentation-kit'
import { edited, editedRing, modify, modifyChip, route } from '../entities'
import { SampleScene } from '../Scene'
import type { SamplePayload } from '../types'
import { entities as previous } from './07-verify'

export const entities = [...previous, route, modify, modifyChip, editedRing, edited]

export const step: Step<SamplePayload> = {
  id: 'changed-your-mind-loop-it',
  era: 'the loop',
  title: 'Changed your mind? Loop it.',
  caption:
    'Point at a step and ask. The skill edits the scene in place — nothing is redrawn from scratch.',
  groupKey: 'scene',
  Scene: SampleScene,
  payload: { entities },
}
