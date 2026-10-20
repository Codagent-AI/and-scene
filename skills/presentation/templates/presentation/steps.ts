import type { Step } from '../../presentation-kit/index.ts'
import { Scene, type Payload } from './Scene.tsx'

/** Replace these steps with the presentation's own. Each step names a state of one evolving scene. */
const META = [
  { id: 'idea', era: 'start', title: 'Start with the idea', caption: 'Introduce the topic with a single entity.' },
  { id: 'detail', era: 'start', title: 'Add the detail', caption: 'Bring in the next entity and connect it to the first.' },
  { id: 'result', era: 'finish', title: 'Land the result', caption: 'Finish the story without redrawing what is already there.' },
]

export const STEPS: Step<Payload>[] = META.map((meta, i) => ({ ...meta, groupKey: 'main', Scene, payload: { upTo: i + 1 } }))
