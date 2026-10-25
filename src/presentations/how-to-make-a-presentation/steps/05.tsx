import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { SampleScene, type DiagramState } from './Scene'
export const step: Step<DiagramState> = { ...metadata[4], groupKey: 'skill-story', Scene: SampleScene, payload: { beat: 5 } }
