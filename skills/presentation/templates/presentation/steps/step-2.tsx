import type { Step } from '../../../presentation-kit/index.ts'
import { Scene, type Payload } from '../Scene.tsx'

export const step2: Step<Payload> = {
  id: 'step-2',
  era: 'start',
  title: 'A second box',
  caption: 'A second box joins without disturbing the first.',
  Scene,
  groupKey: '__SLUG__',
  payload: { step: 2 },
}
