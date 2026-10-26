import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { StoryScene, type Beat } from './Scene'
export const step9: Step<Beat> = { ...metadata[8], Scene: StoryScene, groupKey: 'story', payload: { beat: 9 } }
