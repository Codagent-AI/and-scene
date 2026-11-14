import type { Step } from '../../../presentation-kit/types'
import { StoryScene } from './StoryScene'
import outline from './outline.json'
export interface StoryPayload { beat: number }
export const STEPS: Step<StoryPayload>[] = outline.map((meta, index) => ({ ...meta, groupKey: 'how-to-story', Scene: StoryScene, payload: { beat: index + 1 } }))
