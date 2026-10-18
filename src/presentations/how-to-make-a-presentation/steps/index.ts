import type { Step } from '../../../presentation-kit'
import { NARRATION } from './narration'
import { SampleScene, type ScenePayload } from './Scene'

export const STEPS: readonly Step<ScenePayload>[] = NARRATION.map((meta, i) => ({
  ...meta,
  Scene: SampleScene,
  groupKey: 'scene',
  payload: { step: i + 1 },
}))
