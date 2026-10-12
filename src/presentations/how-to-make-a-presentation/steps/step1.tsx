import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step1: Step<SamplePayload> = { id: 'ask-topic', section: OUTLINE[0].era, title: OUTLINE[0].title, caption: OUTLINE[0].caption, groupKey: 'reference-scene', Scene, payload: { through: 1 } }
