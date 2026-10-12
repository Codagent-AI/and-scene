import type { Step } from '../../../presentation-kit/types'
import { Scene } from './Scene'

export const step: Step<null> = {
  id: 'step-one',
  section: 'Beginning',
  title: 'Step title',
  caption: 'Explain what changes in this step.',
  groupKey: 'main-scene',
  Scene,
  payload: null,
}
