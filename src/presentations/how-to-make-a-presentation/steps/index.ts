import type { Step } from '../../../presentation-kit/types'
import { outline } from '../outline'
import { StoryScene } from './Scene'
export const STEPS: Step<number>[] = outline.map((meta, index) => ({ ...meta, groupKey: 'story', Scene: StoryScene, payload: index + 1 }))
