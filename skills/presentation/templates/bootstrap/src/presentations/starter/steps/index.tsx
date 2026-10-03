import type { Step } from '../../../presentation-kit/types'
import { Scene } from './Scene'
import './presentation.css'

type Payload = { message: string }
export const STEPS: readonly Step<Payload>[] = [
  { id: 'idea', section: 'Introduction', title: 'Start with an idea', caption: 'A presentation unfolds as one scene, changing step by step.', Scene, payload: { message: 'One scene' }, groupKey: 'starter' },
  { id: 'change', section: 'Introduction', title: 'Show how it changes', caption: 'Stable entities make change easy to follow.', Scene, payload: { message: 'One scene, evolving' }, groupKey: 'starter' },
]
