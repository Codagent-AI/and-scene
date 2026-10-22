import { ID } from '../entities.ts'
import { Scene } from '../Scene.tsx'
import type { Payload } from '../Scene.tsx'
import type { Step } from '../../../presentation-kit/index.ts'

export const STEP_01: Step<Payload> = {
  id: 'opening',
  era: 'the start',
  title: '__TITLE__',
  caption: 'Replace this caption with what the viewer should take from the first step.',
  Scene,
  groupKey: 'scene',
  payload: { visible: [ID.topic] },
}
