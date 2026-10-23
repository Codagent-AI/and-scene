import type { Step } from '../../../presentation-kit'
import { E, type EntityId } from '../entities'
import { Scene, type ScenePayload } from '../scene'

interface StepSpec {
  id: string
  era: string
  title: string
  caption: string
  visible: readonly EntityId[]
}

const SPECS: StepSpec[] = [
  { id: 'start', era: 'opening', title: 'Start with an idea', caption: 'Replace this caption with what the first beat explains.', visible: [E.idea] },
  { id: 'connect', era: 'opening', title: 'Connect it to a detail', caption: 'Each step keeps the entities already on screen and adds or changes a few.', visible: [E.idea, E.detail, E.link] },
]

export const STEPS: Step<ScenePayload>[] = SPECS.map((spec, i) => ({
  id: spec.id,
  era: spec.era,
  title: spec.title,
  caption: spec.caption,
  Scene,
  groupKey: '__SLUG__',
  // Only entities new at this step fade in; continuing ones just morph.
  payload: { visible: spec.visible, entering: spec.visible.filter((e) => !SPECS[i - 1]?.visible.includes(e)) },
}))
