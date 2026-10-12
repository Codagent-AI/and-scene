import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step7: Step<SamplePayload> = { id: 'verify-work', section: OUTLINE[6].era, title: OUTLINE[6].title, caption: OUTLINE[6].caption, groupKey: 'reference-scene', Scene, payload: { through: 7 } }
