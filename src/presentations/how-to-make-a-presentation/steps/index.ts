import type { Step } from '../../../presentation-kit/types'
import { Scene } from './Scene'
import type { Beat } from './Scene'
import { outline } from './outline'
export const steps: Step<Beat>[] = outline.map((meta, index) => ({
  ...meta, Scene, groupKey: 'conversation', payload: { beat: index + 1 },
}))
