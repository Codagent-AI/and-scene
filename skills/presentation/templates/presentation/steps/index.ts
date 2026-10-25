import type { Step } from '../../../presentation-kit/index.ts'
import { Scene, type Payload } from './Scene.tsx'

const beats = [
  { id: 'intro', era: 'start', title: __TITLE_JSON__, caption: 'Replace this caption with what the viewer should take away.' },
  { id: 'next', era: 'start', title: 'The next idea', caption: 'Each step names one beat of the story.' },
]

export const STEPS: readonly Step<Payload>[] = beats.map((beat, i) => ({
  ...beat,
  groupKey: '__SLUG__',
  Scene,
  payload: { stage: i + 1 },
}))
