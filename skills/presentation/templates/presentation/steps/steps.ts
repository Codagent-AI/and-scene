import type { Step } from '../../../presentation-kit/index.ts'
import { Scene, type ScenePayload } from '../scene.tsx'

const META = [
  { id: 'start', era: 'opening', title: 'First beat', caption: 'Describe the first beat of the story here.' },
  { id: 'next', era: 'opening', title: 'Second beat', caption: 'Describe how the scene evolves here.' },
]

export const STEPS: Step<ScenePayload>[] = META.map((m, index) => ({
  ...m,
  Scene,
  payload: { index },
  groupKey: '__SLUG__',
}))
