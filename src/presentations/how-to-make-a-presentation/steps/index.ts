import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { StoryScene } from './Scene'
export const STEPS: readonly Step<number>[] = metadata.map((meta, index) => ({ ...meta, groupKey: 'the-story', Scene: StoryScene, payload: index }))
