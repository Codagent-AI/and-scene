import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from './outline'
import { Scene, type SamplePayload } from './Scene'
export const step3: Step<SamplePayload> = { id: 'answers-become-steps', section: OUTLINE[2].era, title: OUTLINE[2].title, caption: OUTLINE[2].caption, groupKey: 'reference-scene', Scene, payload: { through: 3 } }
