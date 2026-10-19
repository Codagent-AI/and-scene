import type { Step } from '../../presentation-kit/index.ts'
import { NARRATION } from './narration.ts'
import { Scene } from './Scene.tsx'
import type { Payload } from './Scene.tsx'

export const STEPS: Step<Payload>[] = NARRATION.map((n, i) => ({
  ...n,
  Scene,
  groupKey: 'how-to',
  payload: { stage: i + 1 },
}))
