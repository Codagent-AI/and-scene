import type { Step } from '../../../presentation-kit/types'
import { Scene } from './Scene'
import './presentation.css'

type Payload = { message: string }
export const STEPS: readonly Step<Payload>[] = [
  { id: 'first', section: 'Introduction', title: 'First idea', caption: 'Explain what changes in this step.', Scene, payload: { message: 'Beginning' }, groupKey: '{{SLUG}}-story' },
]
