import metadata from '../metadata.json'
import { StoryScene } from './Scene'
import type { Step } from '../../../presentation-kit/types'
export const STEPS: Step<number>[] = metadata.map((step, index) => ({ ...step, groupKey: 'conversation', Scene: StoryScene, payload: index + 1 }))
