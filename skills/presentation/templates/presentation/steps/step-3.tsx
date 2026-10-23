import type { Step } from '../../../presentation-kit/index.ts'
import { Scene, type Payload } from '../Scene.tsx'

export const step3: Step<Payload> = {
  id: 'step-3',
  era: 'finish',
  title: 'They connect',
  caption: 'An arrow connects the two boxes.',
  Scene,
  groupKey: '__SLUG__',
  payload: { step: 3 },
}
