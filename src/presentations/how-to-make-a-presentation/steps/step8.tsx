import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step8: Step<SamplePayload> = { id: 'loop-edit', section: OUTLINE[7].era, title: OUTLINE[7].title, caption: OUTLINE[7].caption, groupKey: 'reference-scene', Scene, payload: { through: 8 } }
