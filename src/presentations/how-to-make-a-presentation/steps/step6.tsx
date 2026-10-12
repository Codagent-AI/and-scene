import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step6: Step<SamplePayload> = { id: 'assemble-scene', section: OUTLINE[5].era, title: OUTLINE[5].title, caption: OUTLINE[5].caption, groupKey: 'reference-scene', Scene, payload: { through: 6 } }
