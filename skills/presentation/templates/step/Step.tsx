import type { Step } from '../../presentation-kit/types'
import { Scene } from './Scene'

type Payload = Record<string, never>

export const step: Step<Payload> = {
  id: 'step-id', section: 'Section', title: 'Step title', caption: 'A concise explanation of this state.', Scene, payload: {}, groupKey: 'related-scene',
}
