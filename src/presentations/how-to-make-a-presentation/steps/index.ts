import type { Step } from '../../../presentation-kit'
import { Scene } from './Scene'
import { outline } from './outline'
export const steps: readonly Step<number>[] = outline.map((meta, payload) => ({ ...meta, payload, groupKey: 'conversation-to-scene', Scene }))
