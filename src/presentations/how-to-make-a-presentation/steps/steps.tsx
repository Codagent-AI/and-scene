import type { Step } from '../../../presentation-kit/types'
import { outline } from './outline.mjs'
import { EvolvingScene } from './Scene'

type Payload = { count: number }
export const steps: Step<Payload>[] = outline.map(({ era, title, caption }, index) => ({ id: `step-${index + 1}`, era, title, caption, groupKey: 'one-evolving-scene', Scene: EvolvingScene, payload: { count: index + 1 } }))
