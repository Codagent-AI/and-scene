import type { Step } from '../../presentation-kit'
import type { SceneState } from './entities'
import { Scene } from './scene'

const step = (upTo: number, fields: { id: string; era: string; title: string; caption: string }): Step<SceneState> => ({
  ...fields,
  groupKey: 'main',
  payload: { upTo },
  Scene,
})

export const STEPS: readonly Step<SceneState>[] = [
  step(1, { id: 'start', era: 'start', title: "Hello Scene", caption: 'Replace this caption with the opening beat.' }),
  step(2, { id: 'develop', era: 'middle', title: 'The idea develops', caption: 'Replace this caption with the next beat.' }),
  step(3, { id: 'land', era: 'end', title: 'The idea lands', caption: 'Replace this caption with the closing beat.' }),
]
