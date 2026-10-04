import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
type Payload = { label: string }
export const step: Step<Payload> = { id: 'start', era: 'example', title: 'A small beginning', caption: 'A registered example presentation, ready to evolve.', Scene, payload: { label: 'One scene, one step' } }
