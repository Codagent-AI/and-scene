import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step5: Step<SamplePayload> = { id: 'set-depth', section: OUTLINE[4].era, title: OUTLINE[4].title, caption: OUTLINE[4].caption, groupKey: 'reference-scene', Scene, payload: { through: 5 } }
