import type { Step } from '../../../presentation-kit'
import { metadata } from '../metadata'
import { Scene, type Beat } from './Scene'
export const STEPS: readonly Step<Beat>[] = metadata.map((meta, index) => ({ ...meta, groupKey: 'conversation', Scene, payload: { beat: index + 1 } }))
