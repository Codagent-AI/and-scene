import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step2: Step<SamplePayload> = { id: 'skill-interviews', section: OUTLINE[1].era, title: OUTLINE[1].title, caption: OUTLINE[1].caption, groupKey: 'reference-scene', Scene, payload: { through: 2 } }
