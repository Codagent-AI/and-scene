import { Scene } from '../Scene'
import type { TalkStep } from '../types'

export const step1: TalkStep = {
  id: 'step-1',
  era: 'intro',
  title: 'Start with the subject',
  caption: 'The one thing this presentation is about.',
  Scene,
  groupKey: '__SLUG__',
  payload: { step: 1 },
}
