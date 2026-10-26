import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { StoryScene, type Beat } from './Scene'
export const step3: Step<Beat> = { ...metadata[2], Scene: StoryScene, groupKey: 'story', payload: { beat: 3 } }
