import type { Step } from '../../../presentation-kit'
import { outline } from '../outline'
import { StoryScene, type Beat } from './Scene'
export const STEPS: Step<Beat>[] = outline.map((meta, index) => ({ ...meta, groupKey: 'conversation', Scene: StoryScene, payload: { beat: index + 1 } }))
