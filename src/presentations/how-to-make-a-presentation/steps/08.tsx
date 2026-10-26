import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { StoryScene, type Beat } from './Scene'
export const step8: Step<Beat> = { ...metadata[7], Scene: StoryScene, groupKey: 'story', payload: { beat: 8 } }
