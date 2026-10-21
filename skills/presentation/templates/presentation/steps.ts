import type { Step } from '../../presentation-kit'
import { MainScene } from './Scene'
import type { ScenePayload } from './Scene'

type Beat = Pick<Step<ScenePayload>, 'id' | 'era' | 'title' | 'caption'>

const BEATS: readonly Beat[] = [
  { id: 'first', era: 'start', title: 'First beat', caption: 'One paragraph that explains the first beat.' },
  { id: 'second', era: 'start', title: 'Second beat', caption: 'One paragraph that explains the second beat.' },
]

export const STEPS: readonly Step<ScenePayload>[] = BEATS.map((beat, stage) => ({
  ...beat,
  groupKey: 'main',
  Scene: MainScene,
  payload: { stage },
}))
