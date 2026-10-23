import type { Step } from '../../../presentation-kit'
import { E } from '../entities'
import { Scene, type ScenePayload } from '../scene'

const step = (id: string, era: string, title: string, caption: string, visible: ScenePayload['visible']): Step<ScenePayload> => ({
  id,
  era,
  title,
  caption,
  Scene,
  groupKey: '__SLUG__',
  payload: { visible },
})

export const STEPS: Step<ScenePayload>[] = [
  step('start', 'opening', 'Start with an idea', 'Replace this caption with what the first beat explains.', [E.idea]),
  step('connect', 'opening', 'Connect it to a detail', 'Each step keeps the entities already on screen and adds or changes a few.', [E.idea, E.detail, E.link]),
]
