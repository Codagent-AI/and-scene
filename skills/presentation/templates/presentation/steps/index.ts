import type { Step } from '../../../presentation-kit/types'
import { Scene } from './Scene'
interface Payload { beat: string }
export const STEPS: Step<Payload>[] = [{ id: 'opening', era: 'opening', title: 'A clear title', caption: 'A concise explanatory caption for this beat.', groupKey: 'main-scene', Scene, payload: { beat: 'opening' } }]
