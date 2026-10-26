import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { StoryScene, type Beat } from './Scene'
export const step4: Step<Beat> = { ...metadata[3], Scene: StoryScene, groupKey: 'story', payload: { beat: 4 } }
