import type { Step } from '../../../presentation-kit/index.ts'
import { Scene, type Payload } from '../Scene.tsx'

export const step1: Step<Payload> = {
  id: 'step-1',
  era: 'start',
  title: 'One box',
  caption: 'A single box starts the scene.',
  Scene,
  groupKey: '__SLUG__',
  payload: { step: 1 },
}
