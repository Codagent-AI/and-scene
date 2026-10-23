import type { Step } from '../../../presentation-kit/index.ts'
import { Scene, type ScenePayload } from './Scene.tsx'

export const STEPS: Step<ScenePayload>[] = [
  { id: 'first', era: 'start', title: 'One idea', caption: 'The scene starts with a single idea.', Scene, payload: { stage: 1 }, groupKey: 'starter' },
  { id: 'second', era: 'start', title: 'A second idea', caption: 'The next step adds a second idea without redrawing the first.', Scene, payload: { stage: 2 }, groupKey: 'starter' },
]
