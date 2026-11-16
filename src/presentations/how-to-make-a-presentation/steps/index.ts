import type { Step } from '../../../presentation-kit/types'
import { ReferenceScene } from './Scene'
import { outline } from './outline'
export const STEPS: Step<number>[] = outline.map(([era, title, caption], i) => ({
  id: `beat-${i + 1}`, era, title, caption, groupKey: 'conversation', Scene: ReferenceScene, payload: i + 1,
}))
