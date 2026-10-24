import type { Step } from '../../../presentation-kit/index.ts'
import type { ScenePayload } from '../entities.ts'
import { Scene } from '../Scene.tsx'

export const step1: Step<ScenePayload> = {
  id: 'topic',
  groupKey: 'starter',
  era: 'the start',
  title: 'Start with a topic',
  caption: 'Every presentation begins with one thing worth explaining.',
  Scene,
  payload: { visible: ['topic'] },
}
