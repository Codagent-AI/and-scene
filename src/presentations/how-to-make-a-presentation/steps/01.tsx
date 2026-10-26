import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { StoryScene, type Beat } from './Scene'
export const step1: Step<Beat> = { ...metadata[0], Scene: StoryScene, groupKey: 'story', payload: { beat: 1 } }
