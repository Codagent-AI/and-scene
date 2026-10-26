import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { StoryScene, type Beat } from './Scene'
export const step7: Step<Beat> = { ...metadata[6], Scene: StoryScene, groupKey: 'story', payload: { beat: 7 } }
