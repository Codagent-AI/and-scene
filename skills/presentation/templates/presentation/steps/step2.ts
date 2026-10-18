import { Scene } from '../Scene'
import type { TalkStep } from '../types'

export const step2: TalkStep = {
  id: 'step-2',
  era: 'intro',
  title: 'Add the detail',
  caption: 'A second entity appears while the subject stays put.',
  Scene,
  groupKey: '__SLUG__',
  payload: { step: 2 },
}
