import type { Step } from '../../../presentation-kit/types'
import { Scene } from './Scene'
import type { Payload } from './Scene'
export const steps: Step<Payload>[] = [{
  id: 'start', era: 'opening', title: 'Your first beat', caption: 'Explain what changes here.',
  Scene, groupKey: 'main', payload: { label: 'Your subject' },
}]
