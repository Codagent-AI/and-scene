import { Scene } from '../Scene'
import type { TalkStep } from '../types'

export const step3: TalkStep = {
  id: 'step-3',
  era: 'close',
  title: 'Summarize',
  caption: 'Everything already on screen stays; the summary arrives last.',
  Scene,
  groupKey: '__SLUG__',
  payload: { step: 3 },
}
