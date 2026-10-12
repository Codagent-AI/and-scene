import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step9: Step<SamplePayload> = { id: 'self-reveal', section: OUTLINE[8].era, title: OUTLINE[8].title, caption: OUTLINE[8].caption, groupKey: 'reference-scene', Scene, payload: { through: 9 } }
