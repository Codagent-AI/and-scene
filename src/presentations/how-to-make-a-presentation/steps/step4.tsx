import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step4: Step<SamplePayload> = { id: 'deck-grows', section: OUTLINE[3].era, title: OUTLINE[3].title, caption: OUTLINE[3].caption, groupKey: 'reference-scene', Scene, payload: { through: 4 } }
