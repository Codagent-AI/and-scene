import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { StoryScene, type Beat } from './Scene'
export const step6: Step<Beat> = { ...metadata[5], Scene: StoryScene, groupKey: 'story', payload: { beat: 6 } }
