import type { Step } from '__KIT__'
import { Scene, type SceneState } from './Scene.tsx'

const GROUP = 'scene'

export const STEPS: Step<SceneState>[] = [
  {
    id: 'step-1',
    era: 'start',
    title: 'Start with one idea',
    caption: 'The scene begins with a single entity.',
    groupKey: GROUP,
    Scene,
    payload: { stage: 1 },
  },
  {
    id: 'step-2',
    era: 'start',
    title: 'Then grow it',
    caption: 'The next beat adds an entity; the first one stays exactly where it is.',
    groupKey: GROUP,
    Scene,
    payload: { stage: 2 },
  },
]
