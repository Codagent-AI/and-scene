import type { Step } from '../../presentation-kit'
import { Scene, type ScenePayload } from './Scene'

const GROUP = '__NAMESPACE__-scene'

export const STEPS: Step<ScenePayload>[] = [
  {
    id: 'start',
    era: 'start',
    title: 'Where we begin',
    caption: 'Describe the opening state of the diagram in a sentence or two.',
    groupKey: GROUP,
    Scene,
    payload: { step: 1 },
  },
  {
    id: 'middle',
    era: 'middle',
    title: 'Something is added',
    caption: 'Say what changed on screen and why it matters to the story.',
    groupKey: GROUP,
    Scene,
    payload: { step: 2 },
  },
  {
    id: 'end',
    era: 'end',
    title: 'Where we land',
    caption: 'Close the story and point at what the viewer should remember.',
    groupKey: GROUP,
    Scene,
    payload: { step: 3 },
  },
]
