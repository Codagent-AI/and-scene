import type { AnyStep, Step } from '../../presentation-kit/index.ts'
import { E, grow, type SceneState } from './entities.ts'
import { Scene } from './Scene.tsx'

const first = grow(null, [E.idea])
const second = grow(first, [E.detail, E.link])

const step = (id: string, era: string, title: string, caption: string, payload: SceneState): Step<SceneState> => ({
  id,
  era,
  title,
  caption,
  Scene,
  groupKey: 'main',
  payload,
})

// Replace these beats with the real story. Order alone defines the step numbers.
export const STEPS: AnyStep[] = [
  step('start', 'opening', 'Start with one idea', 'The scene begins with a single entity.', first),
  step('connect', 'opening', 'Connect it to a detail', 'New entities arrive after the existing ones settle; nothing is redrawn.', second),
]
