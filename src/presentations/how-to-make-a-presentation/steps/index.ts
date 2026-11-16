import type { Step } from '../../../presentation-kit/types'
import { OUTLINE } from '../outline'
import { GuideScene } from './Scene'
export const STEPS: Step<number>[] = OUTLINE.map(([era, title, caption], i) => ({ id: `beat-${i + 1}`, era, title, caption, groupKey: 'the-conversation', Scene: GuideScene, payload: i + 1 }))
